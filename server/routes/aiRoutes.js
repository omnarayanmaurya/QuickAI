import express from 'express';

import {
    generateArticle,
    generateBlogTitle,
    generateImage,
    removeImageBackground,
    removeImageObject,
    resumeReview
} from '../controllers/aiController.js';

import { auth } from '../middlewares/auth.js';

import {
    upload,
    logUpload
} from '../middlewares/multer.js';

const aiRouter = express.Router();

// ==========================================
// 1. GENERATE ARTICLE
// ==========================================

aiRouter.post(
    '/generate-article',
    auth,
    generateArticle
);

// ==========================================
// 2. GENERATE BLOG TITLES
// ==========================================

aiRouter.post(
    '/generate-blog-title',
    auth,
    generateBlogTitle
);

// ==========================================
// 3. GENERATE IMAGE
// ==========================================

aiRouter.post(
    '/generate-image',
    auth,
    generateImage
);

// ==========================================
// 4. REMOVE IMAGE BACKGROUND
// ==========================================

aiRouter.post(
    '/remove-background',
    auth,
    upload.single('image'),
    logUpload,
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image.',
                requestId: req.requestId
            });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a valid image file.',
                requestId: req.requestId
            });
        }

        next();
    },
    removeImageBackground
);

// ==========================================
// 5. REMOVE OBJECT FROM IMAGE
// ==========================================

aiRouter.post(
    '/remove-object',
    auth,
    upload.single('image'),
    logUpload,
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image.',
                requestId: req.requestId
            });
        }

        if (!req.file.mimetype.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a valid image file.',
                requestId: req.requestId
            });
        }

        next();
    },
    removeImageObject
);

// ==========================================
// 6. RESUME REVIEW
// ==========================================

aiRouter.post(
    '/resume-review',
    auth,
    upload.single('resume'),
    logUpload,
    (req, res, next) => {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload your resume as a PDF.',
                requestId: req.requestId
            });
        }

        if (
            req.file.mimetype !== 'application/pdf' ||
            !req.file.originalname.toLowerCase().endsWith('.pdf')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Only PDF resumes are supported.',
                requestId: req.requestId
            });
        }

        next();
    },
    resumeReview
);

export default aiRouter;