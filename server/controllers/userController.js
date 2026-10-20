import sql from '../config/db.js';
import { clerkClient } from '@clerk/express';
import { performance } from 'perf_hooks';

// ==========================================
// 1. LOGGING HELPERS
// ==========================================

function log(level, message, details = {}) {
    console.log(
        JSON.stringify({
            timestamp: new Date().toISOString(),
            level,
            message,
            ...details
        })
    );
}

function getRequestId(req) {
    return req.requestId || 'unknown';
}

function createTimer() {
    const startTime = performance.now();

    return {
        elapsed: () =>
            Number((performance.now() - startTime).toFixed(2))
    };
}

function sendError(res, req, operation, error) {
    const requestId = getRequestId(req);

    log('ERROR', `${operation} failed`, {
        requestId,
        errorName: error.name,
        message: error.message
    });

    return res.status(500).json({
        success: false,
        message: 'An unexpected error occurred. Please try again.',
        requestId
    });
}

// ==========================================
// 2. GET USER CREATIONS
// ==========================================

export const getUserCreations = async (req, res) => {
    const requestId = getRequestId(req);
    const timer = createTimer();

    try {
        const { userId } = req.auth();

        log('INFO', 'Fetching user creations', {
            requestId
        });

        const dbTimer = createTimer();

        const creations = await sql`
            SELECT *
            FROM creations
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
        `;

        log('INFO', 'User creations fetched', {
            requestId,
            count: creations.length,
            databaseDurationMs: dbTimer.elapsed()
        });

        return res.json({
            success: true,
            creations,
            requestId
        });
    } catch (error) {
        return sendError(
            res,
            req,
            'Get user creations',
            error
        );
    } finally {
        log('INFO', 'Get user creations completed', {
            requestId,
            durationMs: timer.elapsed()
        });
    }
};

// ==========================================
// 3. GET PUBLISHED CREATIONS
// ==========================================

export const getPublishedCreations = async (req, res) => {
    const requestId = getRequestId(req);
    const timer = createTimer();

    try {
        log('INFO', 'Fetching published creations', {
            requestId
        });

        const dbTimer = createTimer();

        const creations = await sql`
            SELECT *
            FROM creations
            WHERE publish = TRUE
            ORDER BY created_at DESC
        `;

        log('INFO', 'Published creations fetched', {
            requestId,
            count: creations.length,
            databaseDurationMs: dbTimer.elapsed()
        });

        return res.json({
            success: true,
            creations,
            requestId
        });
    } catch (error) {
        return sendError(
            res,
            req,
            'Get published creations',
            error
        );
    } finally {
        log('INFO', 'Get published creations completed', {
            requestId,
            durationMs: timer.elapsed()
        });
    }
};

// ==========================================
// 4. TOGGLE LIKE CREATION
// ==========================================

export const toggleLikeCreation = async (req, res) => {
    const requestId = getRequestId(req);
    const timer = createTimer();

    try {
        const { userId } = req.auth();
        const { creationId } = req.body;

        // Validate the creation ID.
        const parsedCreationId = Number(creationId);

        if (
            creationId === undefined ||
            creationId === null ||
            creationId === '' ||
            !Number.isSafeInteger(parsedCreationId) ||
            parsedCreationId <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid creation ID.',
                requestId
            });
        }

        log('INFO', 'Toggling creation like', {
            requestId,
            creationId: parsedCreationId
        });

        const dbTimer = createTimer();

        /*
         * Update the array in a single SQL statement.
         *
         * If the user has already liked the creation,
         * remove their ID.
         *
         * Otherwise, append their ID.
         *
         * COALESCE handles NULL likes arrays.
         */
        const [creation] = await sql`
            UPDATE creations
            SET
                likes = CASE
                    WHEN ${userId} = ANY(
                        COALESCE(likes, ARRAY[]::TEXT[])
                    )
                    THEN array_remove(
                        COALESCE(likes, ARRAY[]::TEXT[]),
                        ${userId}
                    )
                    ELSE array_append(
                        COALESCE(likes, ARRAY[]::TEXT[]),
                        ${userId}
                    )
                END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${parsedCreationId}
            RETURNING id, likes
        `;

        log('INFO', 'Creation like database operation completed', {
            requestId,
            creationId: parsedCreationId,
            databaseDurationMs: dbTimer.elapsed()
        });

        if (!creation) {
            log('WARN', 'Creation not found for like operation', {
                requestId,
                creationId: parsedCreationId
            });

            return res.status(404).json({
                success: false,
                message: 'Creation not found.',
                requestId
            });
        }

        const likes = creation.likes || [];
        const isLiked = likes.includes(userId);

        const message = isLiked
            ? 'Creation Liked'
            : 'Creation Unliked';

        log('INFO', 'Creation like toggled successfully', {
            requestId,
            creationId: parsedCreationId,
            isLiked,
            likesCount: likes.length,
            durationMs: timer.elapsed()
        });

        return res.json({
            success: true,
            message,
            likes,
            isLiked,
            requestId
        });
    } catch (error) {
        return sendError(
            res,
            req,
            'Toggle creation like',
            error
        );
    } finally {
        log('INFO', 'Toggle like request completed', {
            requestId,
            durationMs: timer.elapsed()
        });
    }
};

// ==========================================
// 5. GET USER PROFILE
// ==========================================

export const getUserProfile = async (req, res) => {
    const requestId = getRequestId(req);
    const timer = createTimer();

    try {
        const { userId } = req.auth();

        log('INFO', 'Fetching user profile', {
            requestId
        });

        const clerkTimer = createTimer();

        const user = await clerkClient.users.getUser(userId);

        log('INFO', 'User profile fetched from Clerk', {
            requestId,
            clerkDurationMs: clerkTimer.elapsed()
        });

        return res.json({
            success: true,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.emailAddresses?.[0]?.emailAddress,
                imageUrl: user.imageUrl
            },
            requestId
        });
    } catch (error) {
        return sendError(
            res,
            req,
            'Get user profile',
            error
        );
    } finally {
        log('INFO', 'Get user profile completed', {
            requestId,
            durationMs: timer.elapsed()
        });
    }
};