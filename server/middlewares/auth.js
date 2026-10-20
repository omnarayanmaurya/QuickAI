import { clerkClient } from '@clerk/express';
import { performance } from 'perf_hooks';

// ==========================================
// LOGGING HELPER
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

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

export const auth = async (req, res, next) => {
    const requestId = req.requestId || 'unknown';
    const middlewareStart = performance.now();

    log('INFO', 'Authentication middleware started', {
        requestId,
        method: req.method,
        path: req.path
    });

    try {
        // --------------------------------------
        // 1. GET AUTHENTICATED USER
        // --------------------------------------

        const authStart = performance.now();

        log('INFO', 'Checking authenticated user', {
            requestId
        });

        const { userId, has } = await req.auth();

        log('INFO', 'User authentication check completed', {
            requestId,
            authenticated: Boolean(userId),
            durationMs: Number(
                (performance.now() - authStart).toFixed(2)
            )
        });

        if (!userId) {
            log('WARN', 'Authentication rejected: no user ID', {
                requestId
            });

            return res.status(401).json({
                success: false,
                message: 'Unauthorized. Please log in.',
                requestId
            });
        }

        // --------------------------------------
        // 2. CHECK PREMIUM PLAN
        // --------------------------------------

        const planStart = performance.now();

        log('INFO', 'Premium plan check started', {
            requestId
        });

        const hasPremiumPlan = await has({
            plan: 'premium'
        });

        log('INFO', 'Premium plan check completed', {
            requestId,
            plan: hasPremiumPlan ? 'premium' : 'free',
            durationMs: Number(
                (performance.now() - planStart).toFixed(2)
            )
        });

        // --------------------------------------
        // 3. FETCH USER FROM CLERK
        // --------------------------------------

        const userStart = performance.now();

        log('INFO', 'Fetching user metadata from Clerk', {
            requestId
        });

        const user = await clerkClient.users.getUser(userId);

        log('INFO', 'User metadata retrieved successfully', {
            requestId,
            durationMs: Number(
                (performance.now() - userStart).toFixed(2)
            )
        });

        // --------------------------------------
        // 4. READ FREE USAGE
        // --------------------------------------

        const freeUsage = user.privateMetadata.free_usage ?? 0;

        req.plan = hasPremiumPlan ? 'premium' : 'free';
        req.hasPremiumPlan = hasPremiumPlan;
        req.free_usage = hasPremiumPlan ? 0 : freeUsage;

        log('INFO', 'Authentication middleware completed', {
            requestId,
            plan: req.plan,
            freeUsage: req.free_usage,
            durationMs: Number(
                (performance.now() - middlewareStart).toFixed(2)
            )
        });

        // --------------------------------------
        // 5. CONTINUE TO CONTROLLER
        // --------------------------------------

        next();

    } catch (error) {
        log('ERROR', 'Authentication middleware failed', {
            requestId,
            message: error.message,
            durationMs: Number(
                (performance.now() - middlewareStart).toFixed(2)
            )
        });

        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
            requestId
        });
    }
};