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

try {
    log('INFO', 'Cloudinary initialization started');

    const startTime = performance.now();

    await connectCloudinary();

    log('INFO', 'Cloudinary initialization completed', {
        durationMs: Number(
            (performance.now() - startTime).toFixed(2)
        )
    });
} catch (error) {
    log('ERROR', 'Cloudinary initialization failed', {
        errorName: error.name,
        message: error.message
    });

    process.exit(1);
}

// ==========================================
// 3. BASIC MIDDLEWARE
// ==========================================

// Enable cross-origin requests.
app.use(cors());

// Parse incoming JSON request bodies.
app.use(express.json());

// ==========================================
// 4. REQUEST LOGGING MIDDLEWARE
// ==========================================

app.use((req, res, next) => {
    const requestId = randomUUID();
    const startTime = performance.now();

    // Attach request information for downstream handlers.
    req.requestId = requestId;
    req.startTime = startTime;

    // Return the request ID to the client.
    res.setHeader('X-Request-ID', requestId);

    log('INFO', 'Incoming HTTP request', {
        requestId,
        method: req.method,
        path: req.path
    });

    // Log the final response status and duration.
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

// Makes Clerk authentication information available
// to routes and authentication middleware.
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

// Authentication is handled by the individual routes.
// Protected routes use the custom auth middleware.

// AI endpoints.
app.use('/api/ai', aiRouter);

// User endpoints.
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

    // Headers may already have been sent.
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
// 10. START SERVER
// ==========================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    log('INFO', 'Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
    });
});

// ==========================================
// 11. PROCESS-LEVEL ERROR HANDLING
// ==========================================

// Log unexpected promise rejections.
process.on('unhandledRejection', (reason) => {
    log('ERROR', 'Unhandled promise rejection', {
        message: reason instanceof Error
            ? reason.message
            : String(reason)
    });
});

// Shut down after an uncaught exception.
process.on('uncaughtException', (error) => {
    log('FATAL', 'Uncaught exception', {
        errorName: error.name,
        message: error.message
    });

    server.close(() => {
        process.exit(1);
    });

    // Prevent the process from hanging indefinitely.
    setTimeout(() => {
        process.exit(1);
    }, 5000).unref();
});