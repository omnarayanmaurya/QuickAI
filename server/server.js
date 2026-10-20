import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { randomUUID } from 'crypto';
import { performance } from 'perf_hooks';

import { clerkMiddleware } from '@clerk/express';

import aiRouter from './routes/aiRoutes.js';
import userRouter from './routes/userRouter.js';
import connectCloudinary from './config/cloudinary.js';

const app = express();

// ==========================================
// 1. LOGGING HELPER
// ==========================================

function log(level, message, details = {}) {
    const timestamp = new Date().toISOString();

    console.log(
        JSON.stringify({
            timestamp,
            level,
            message,
            ...details
        })
    );
}

// ==========================================
// 2. CLOUDINARY INITIALIZATION
// ==========================================

// Initialize Cloudinary once per serverless instance.
// Cache the promise so concurrent requests don't
// repeatedly initialize the connection.

let cloudinaryInitialization;

function initializeCloudinary() {
    if (!cloudinaryInitialization) {
        cloudinaryInitialization = (async () => {
            log('INFO', 'Cloudinary initialization started');

            const startTime = performance.now();

            await connectCloudinary();

            log('INFO', 'Cloudinary initialization completed', {
                durationMs: Number(
                    (performance.now() - startTime).toFixed(2)
                )
            });
        })().catch((error) => {
            // Allow a later request to retry initialization.
            cloudinaryInitialization = undefined;

            log('ERROR', 'Cloudinary initialization failed', {
                errorName: error.name,
                message: error.message
            });

            throw error;
        });
    }

    return cloudinaryInitialization;
}

// Initialize Cloudinary before processing each request.
// The promise is cached after successful initialization.
app.use(async (req, res, next) => {
    try {
        await initializeCloudinary();
        next();
    } catch (error) {
        if (res.headersSent) {
            return next(error);
        }

        res.status(500).json({
            success: false,
            message: 'Service initialization failed'
        });
    }
});

// ==========================================
// 3. BASIC MIDDLEWARE
// ==========================================

// Enable cross-origin requests.
// Restrict allowed origins to your frontend in production.
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173'
].filter(Boolean);

app.use(
    cors({
        origin(origin, callback) {
            // Allow requests without an Origin header,
            // such as server-to-server requests.
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error('Origin not allowed by CORS'));
        }
    })
);

// Parse incoming JSON request bodies.
app.use(express.json());

// ==========================================
// 4. REQUEST LOGGING MIDDLEWARE
// ==========================================

app.use((req, res, next) => {
    const requestId = randomUUID();
    const startTime = performance.now();

    req.requestId = requestId;
    req.startTime = startTime;

    res.setHeader('X-Request-ID', requestId);

    log('INFO', 'Incoming HTTP request', {
        requestId,
        method: req.method,
        path: req.path
    });

    res.on('finish', () => {
        log('INFO', 'HTTP request completed', {
            requestId,
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            durationMs: Number(
                (performance.now() - startTime).toFixed(2)
            )
        });
    });

    next();
});

// ==========================================
// 5. CLERK MIDDLEWARE
// ==========================================

app.use(clerkMiddleware());

// ==========================================
// 6. PUBLIC HEALTH-CHECK ROUTE
// ==========================================

app.get('/', (req, res) => {
    log('INFO', 'Health check requested', {
        requestId: req.requestId
    });

    res.status(200).send('Server is live!');
});

// ==========================================
// 7. APPLICATION ROUTES
// ==========================================

app.use('/api/ai', aiRouter);
app.use('/api/user', userRouter);

// ==========================================
// 8. NOT FOUND HANDLER
// ==========================================

app.use((req, res) => {
    log('WARN', 'Route not found', {
        requestId: req.requestId,
        method: req.method,
        path: req.path
    });

    res.status(404).json({
        success: false,
        message: 'Route not found',
        requestId: req.requestId
    });
});

// ==========================================
// 9. GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
    log('ERROR', 'Unhandled Express error', {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        errorName: error.name,
        message: error.message
    });

    if (res.headersSent) {
        return next(error);
    }

    const statusCode =
        Number.isInteger(error.status) &&
        error.status >= 400 &&
        error.status <= 599
            ? error.status
            : 500;

    res.status(statusCode).json({
        success: false,
        message: statusCode >= 500
            ? 'An unexpected server error occurred'
            : error.message,
        requestId: req.requestId
    });
});

// ==========================================
// 10. EXPORT APPLICATION FOR VERCEL
// ==========================================

// Vercel imports this Express application.
// Do not call app.listen() in the serverless entry point.

export default app;

// ==========================================
// 11. LOCAL DEVELOPMENT SERVER
// ==========================================

// Start a persistent server only when running locally.
// Vercel sets VERCEL=1 in its deployment environment.

if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;

    const server = app.listen(PORT, () => {
        log('INFO', 'Server started successfully', {
            port: PORT,
            environment: process.env.NODE_ENV || 'development'
        });
    });

    // ==========================================
    // 12. PROCESS-LEVEL ERROR HANDLING
    // ==========================================

    process.on('unhandledRejection', (reason) => {
        log('ERROR', 'Unhandled promise rejection', {
            message: reason instanceof Error
                ? reason.message
                : String(reason)
        });
    });

    process.on('uncaughtException', (error) => {
        log('FATAL', 'Uncaught exception', {
            errorName: error.name,
            message: error.message
        });

        server.close(() => {
            process.exit(1);
        });

        setTimeout(() => {
            process.exit(1);
        }, 5000).unref();
    });
}