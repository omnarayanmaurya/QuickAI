import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

// ==========================================
// 1. LOGGING HELPER
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
// 2. TEMPORARY UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });

    log('INFO', 'Upload directory created', {
        directory: uploadDir
    });
}

// ==========================================
// 3. FILE TYPE CONFIGURATION
// ==========================================

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
]);

// ==========================================
// 4. STORAGE CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname)
            .toLowerCase();

        const uniqueName = `${Date.now()}-${randomUUID()}${extension}`;

        cb(null, uniqueName);
    }
});

// ==========================================
// 5. FILE FILTER
// ==========================================

function fileFilter(req, file, cb) {
    const requestId = req.requestId || 'unknown';

    if (!allowedMimeTypes.has(file.mimetype)) {
        log('WARN', 'Upload rejected: unsupported MIME type', {
            requestId,
            mimeType: file.mimetype
        });

        const error = new Error(
            'Unsupported file type. Upload a JPEG, PNG, WebP image or PDF.'
        );

        error.status = 400;

        return cb(error);
    }

    const extension = path.extname(file.originalname)
        .toLowerCase();

    const imageExtensions = new Set([
        '.jpg',
        '.jpeg',
        '.png',
        '.webp'
    ]);

    const isImage = file.mimetype.startsWith('image/');
    const isPdf = file.mimetype === 'application/pdf';

    if (
        (isImage && !imageExtensions.has(extension)) ||
        (isPdf && extension !== '.pdf')
    ) {
        log('WARN', 'Upload rejected: MIME and extension mismatch', {
            requestId,
            mimeType: file.mimetype,
            extension
        });

        const error = new Error(
            'The file extension does not match its declared type.'
        );

        error.status = 400;

        return cb(error);
    }

    cb(null, true);
}

// ==========================================
// 6. MULTER CONFIGURATION
// ==========================================

export const upload = multer({
    storage,
    fileFilter,

    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1
    }
});

// ==========================================
// 7. UPLOAD LOGGING MIDDLEWARE
// ==========================================

export function logUpload(req, res, next) {
    const requestId = req.requestId || 'unknown';

    if (req.file) {
        log('INFO', 'File upload accepted', {
            requestId,
            fieldName: req.file.fieldname,
            mimeType: req.file.mimetype,
            sizeBytes: req.file.size
        });
    } else {
        log('INFO', 'No file attached to request', {
            requestId
        });
    }

    next();
}