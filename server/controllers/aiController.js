import OpenAI from 'openai';
import sql from '../config/db.js';
import { clerkClient } from '@clerk/express';
import axios from 'axios';
import FormData from 'form-data';
import { v2 as cloudinary } from 'cloudinary';
import FileSystem from 'fs';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import { randomUUID } from 'crypto';
import { performance } from 'node:perf_hooks';

// ==================================================
// 1. LOGGING HELPERS
// ==================================================

const getTimestamp = () => new Date().toISOString();

// Use the request ID created by server.js whenever available.
const getRequestId = (req) => req.requestId || randomUUID();

const log = (requestId, message, details = {}) => {
    console.log(
        JSON.stringify({
            timestamp: getTimestamp(),
            requestId,
            level: 'INFO',
            message,
            ...details
        })
    );
};

const logError = (requestId, message, error) => {
    console.error(
        JSON.stringify({
            timestamp: getTimestamp(),
            requestId,
            level: 'ERROR',
            message,
            error: error?.message || 'Unknown error',
            status: error?.status || error?.response?.status,
            code: error?.code,
            type: error?.type
        })
    );
};

const createTimer = (requestId, operation) => {
    const start = performance.now();

    log(requestId, `${operation} START`);

    return {
        end(details = {}) {
            const durationMs = Number(
                (performance.now() - start).toFixed(2)
            );

            log(requestId, `${operation} END`, {
                durationMs,
                ...(
                    typeof details === 'string'
                        ? { details }
                        : details
                )
            });

            return durationMs;
        }
    };
};

const logRequestCompleted = (
    requestId,
    operation,
    requestStart,
    status = 'success'
) => {
    const totalDurationMs = Number(
        (performance.now() - requestStart).toFixed(2)
    );

    log(requestId, `${operation} ${status.toUpperCase()}`, {
        totalDurationMs,
        status
    });

    return totalDurationMs;
};

// ==================================================
// 2. GEMINI AI CONFIGURATION
// ==================================================

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL:
        'https://generativelanguage.googleapis.com/v1beta/openai/',
    timeout: 45000,
    maxRetries: 0
});

const GEMINI_MODEL =
    process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// ==================================================
// 3. COMMON HELPERS
// ==================================================

const getArticleLength = (length) => {
    const parsedLength = Number(length);

    if (![800, 1200, 1600].includes(parsedLength)) {
        return 800;
    }

    return parsedLength;
};

const getAIContent = (response) => {
    const content = response.choices?.[0]?.message?.content;

    if (typeof content === 'string') {
        return content.trim();
    }

    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (item.type === 'text') {
                    return item.text || '';
                }

                return '';
            })
            .join('')
            .trim();
    }

    return '';
};

const logAIResponse = (requestId, response, content) => {
    log(requestId, 'AI RESPONSE RECEIVED', {
        model: response.model,
        finishReason: response.choices?.[0]?.finish_reason,
        contentLength: content.length,
        completionTokens: response.usage?.completion_tokens,
        promptTokens: response.usage?.prompt_tokens
    });
};

const sendControllerError = (
    requestId,
    operation,
    error,
    res
) => {
    // Log the error once at the point where it is handled.
    logError(requestId, operation, error);

    const status = error?.status;

    if (status === 401 || status === 403) {
        return res.status(status).json({
            success: false,
            message:
                'The AI service rejected the request. ' +
                'Check your API credentials and permissions.',
            requestId
        });
    }

    if (status === 429) {
        return res.status(429).json({
            success: false,
            message:
                'The AI service rate limit was reached. ' +
                'Please try again later.',
            requestId
        });
    }

    if (
        status === 408 ||
        error?.code === 'ETIMEDOUT' ||
        error?.code === 'ECONNABORTED' ||
        error?.name === 'APIConnectionTimeoutError'
    ) {
        return res.status(504).json({
            success: false,
            message: 'The request timed out. Please try again.',
            requestId
        });
    }

    return res.status(500).json({
        success: false,
        message: 'The request failed. Please try again.',
        requestId
    });
};

const sendValidationError = (
    requestId,
    operation,
    res,
    status,
    message,
    requestStart
) => {
    log(requestId, `${operation} VALIDATION FAILED`, {
        status,
        reason: message
    });

    logRequestCompleted(
        requestId,
        operation,
        requestStart,
        'rejected'
    );

    return res.status(status).json({
        success: false,
        message,
        requestId
    });
};

const incrementFreeUsage = async (
    requestId,
    userId,
    plan,
    freeUsage
) => {
    if (plan === 'premium') {
        log(requestId, 'FREE USAGE UPDATE SKIPPED', {
            reason: 'Premium user'
        });

        return;
    }

    const timer = createTimer(
        requestId,
        'CLERK FREE USAGE UPDATE'
    );

    try {
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {
                free_usage: freeUsage + 1
            }
        });

        timer.end({
            status: 'success'
        });
    } catch (error) {
        timer.end({
            status: 'failed'
        });

        throw error;
    }
};

const saveCreation = async (
    requestId,
    operation,
    query
) => {
    const timer = createTimer(requestId, operation);

    try {
        await query;

        timer.end({
            status: 'success'
        });
    } catch (error) {
        timer.end({
            status: 'failed'
        });

        throw error;
    }
};

const getRequestUser = (req) => {
    const authData = req.auth();

    if (!authData?.userId) {
        throw new Error(
            'Authenticated user ID is missing from the request.'
        );
    }

    return authData.userId;
};

const getRequestPlan = (req) => ({
    plan: req.plan || 'free',
    freeUsage: req.free_usage ?? 0
});

const isPublished = (published) =>
    published === true || published === 'true';

const cleanupTemporaryFile = async (
    requestId,
    filePath
) => {
    if (!filePath) {
        return;
    }

    const timer = createTimer(
        requestId,
        'TEMPORARY FILE CLEANUP'
    );

    try {
        await FileSystem.promises.unlink(filePath);

        timer.end({
            status: 'success'
        });
    } catch (error) {
        if (error.code === 'ENOENT') {
            timer.end({
                status: 'already_removed'
            });

            return;
        }

        timer.end({
            status: 'failed'
        });

        logError(
            requestId,
            'TEMPORARY FILE CLEANUP FAILED',
            error
        );
    }
};

// ==================================================
// 4. GENERATE ARTICLE
// ==================================================

export const generateArticle = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'ARTICLE REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);

        const { prompt, length } = req.body;

        const { plan, freeUsage } = getRequestPlan(req);

        log(requestId, 'ARTICLE REQUEST DETAILS', {
            plan,
            requestedLength: length,
            promptLength:
                typeof prompt === 'string'
                    ? prompt.length
                    : 0
        });

        if (
            typeof prompt !== 'string' ||
            !prompt.trim()
        ) {
            return sendValidationError(
                requestId,
                'ARTICLE GENERATION',
                res,
                400,
                'Please provide an article topic.',
                requestStart
            );
        }

        const articleLength = getArticleLength(length);

        if (plan !== 'premium' && freeUsage >= 10) {
            return sendValidationError(
                requestId,
                'ARTICLE GENERATION',
                res,
                403,
                'Limit reached. Upgrade to continue.',
                requestStart
            );
        }

        const articlePrompt = `
Write a complete, informative article about the following topic:

${prompt.trim()}

Requirements:
1. Target approximately ${articleLength} words.
2. Include a clear, engaging title.
3. Begin with an informative introduction.
4. Divide the article into meaningful sections.
5. Use Markdown headings and subheadings.
6. Explain the topic with relevant details and examples.
7. Include bullet points where useful.
8. Finish with a proper conclusion.
9. Do not stop after the introduction.
10. Return the complete article in Markdown format.
11. Do not describe the instructions or mention that you are an AI.
`;

        const aiTimer = createTimer(
            requestId,
            'GEMINI ARTICLE GENERATION'
        );

        let response;

        try {
            response = await AI.chat.completions.create({
                model: GEMINI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are a professional article writer. ' +
                            'Write complete, informative, well-structured ' +
                            'articles in Markdown. Follow the requested ' +
                            'length as closely as possible.'
                    },
                    {
                        role: 'user',
                        content: articlePrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000
            });

            aiTimer.end({
                status: 'success'
            });
        } catch (error) {
            aiTimer.end({
                status: 'failed'
            });

            throw error;
        }

        const content = getAIContent(response);

        logAIResponse(requestId, response, content);

        if (!content) {
            return sendValidationError(
                requestId,
                'ARTICLE GENERATION',
                res,
                502,
                'The AI returned an empty article. Please try again.',
                requestStart
            );
        }

        await saveCreation(
            requestId,
            'DATABASE ARTICLE INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type
                )
                VALUES (
                    ${userId},
                    ${prompt.trim()},
                    ${content},
                    'article'
                )
            `
        );

        await incrementFreeUsage(
            requestId,
            userId,
            plan,
            freeUsage
        );

        logRequestCompleted(
            requestId,
            'ARTICLE GENERATION',
            requestStart
        );

        return res.json({
            success: true,
            content,
            finishReason:
                response.choices?.[0]?.finish_reason,
            requestId
        });
    } catch (error) {
        logRequestCompleted(
            requestId,
            'ARTICLE GENERATION',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'ARTICLE GENERATION FAILED',
            error,
            res
        );
    }
};

// ==================================================
// 5. GENERATE BLOG TITLES
// ==================================================

export const generateBlogTitle = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'BLOG TITLE REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);

        const { prompt, category } = req.body;

        const { plan, freeUsage } = getRequestPlan(req);

        log(requestId, 'BLOG TITLE REQUEST DETAILS', {
            plan,
            category,
            promptLength:
                typeof prompt === 'string'
                    ? prompt.length
                    : 0
        });

        if (
            typeof prompt !== 'string' ||
            !prompt.trim()
        ) {
            return sendValidationError(
                requestId,
                'BLOG TITLE GENERATION',
                res,
                400,
                'Please provide a blog topic.',
                requestStart
            );
        }

        if (plan !== 'premium' && freeUsage >= 10) {
            return sendValidationError(
                requestId,
                'BLOG TITLE GENERATION',
                res,
                403,
                'Limit reached. Upgrade to continue.',
                requestStart
            );
        }

        const blogPrompt = `
Generate exactly 10 creative, engaging, SEO-friendly blog titles.

Topic or keyword: ${prompt.trim()}
Category: ${category || 'General'}

Requirements:
- Make each title clear and appealing.
- Avoid repetitive titles.
- Return only a numbered list.
- Do not add explanations.
`;

        const aiTimer = createTimer(
            requestId,
            'GEMINI BLOG TITLE GENERATION'
        );

        let response;

        try {
            response = await AI.chat.completions.create({
                model: GEMINI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert blog title writer. ' +
                            'Generate concise, original, SEO-friendly titles.'
                    },
                    {
                        role: 'user',
                        content: blogPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 700
            });

            aiTimer.end({
                status: 'success'
            });
        } catch (error) {
            aiTimer.end({
                status: 'failed'
            });

            throw error;
        }

        const content = getAIContent(response);

        logAIResponse(requestId, response, content);

        if (!content) {
            return sendValidationError(
                requestId,
                'BLOG TITLE GENERATION',
                res,
                502,
                'The AI returned no blog titles. Please try again.',
                requestStart
            );
        }

        await saveCreation(
            requestId,
            'DATABASE BLOG TITLE INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type
                )
                VALUES (
                    ${userId},
                    ${prompt.trim()},
                    ${content},
                    'blog-title'
                )
            `
        );

        await incrementFreeUsage(
            requestId,
            userId,
            plan,
            freeUsage
        );

        logRequestCompleted(
            requestId,
            'BLOG TITLE GENERATION',
            requestStart
        );

        return res.json({
            success: true,
            content,
            requestId
        });
    } catch (error) {
        logRequestCompleted(
            requestId,
            'BLOG TITLE GENERATION',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'BLOG TITLE GENERATION FAILED',
            error,
            res
        );
    }
};

// ==================================================
// 6. GENERATE IMAGE
// ==================================================

export const generateImage = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'IMAGE GENERATION REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);

        const { prompt, published } = req.body;

        const { plan } = getRequestPlan(req);

        log(requestId, 'IMAGE GENERATION DETAILS', {
            plan,
            promptLength:
                typeof prompt === 'string'
                    ? prompt.length
                    : 0
        });

        if (plan !== 'premium') {
            return sendValidationError(
                requestId,
                'IMAGE GENERATION',
                res,
                403,
                'This feature is available to premium users only.',
                requestStart
            );
        }

        if (
            typeof prompt !== 'string' ||
            !prompt.trim()
        ) {
            return sendValidationError(
                requestId,
                'IMAGE GENERATION',
                res,
                400,
                'Please provide an image description.',
                requestStart
            );
        }

        const form = new FormData();

        form.append('prompt', prompt.trim());

        const clipdropTimer = createTimer(
            requestId,
            'CLIPDROP IMAGE GENERATION'
        );

        let response;

        try {
            response = await axios.post(
                'https://clipdrop-api.co/text-to-image/v1',
                form,
                {
                    headers: {
                        'x-api-key':
                            process.env.CLIPDROP_API_KEY,
                        ...form.getHeaders()
                    },
                    responseType: 'arraybuffer',
                    timeout: 120000
                }
            );

            clipdropTimer.end({
                status: 'success',
                responseBytes: response.data.byteLength
            });
        } catch (error) {
            clipdropTimer.end({
                status: 'failed'
            });

            throw error;
        }

        const base64Image =
            `data:image/png;base64,${Buffer.from(
                response.data
            ).toString('base64')}`;

        const cloudinaryTimer = createTimer(
            requestId,
            'CLOUDINARY IMAGE UPLOAD'
        );

        let secureUrl;

        try {
            const uploadedImage =
                await cloudinary.uploader.upload(
                    base64Image,
                    {
                        folder: 'quickai/generated-images'
                    }
                );

            secureUrl = uploadedImage.secure_url;

            cloudinaryTimer.end({
                status: 'success'
            });
        } catch (error) {
            cloudinaryTimer.end({
                status: 'failed'
            });

            throw error;
        }

        await saveCreation(
            requestId,
            'DATABASE IMAGE INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type,
                    publish
                )
                VALUES (
                    ${userId},
                    ${prompt.trim()},
                    ${secureUrl},
                    'image',
                    ${isPublished(published)}
                )
            `
        );

        logRequestCompleted(
            requestId,
            'IMAGE GENERATION',
            requestStart
        );

        return res.json({
            success: true,
            content: secureUrl,
            requestId
        });
    } catch (error) {
        logRequestCompleted(
            requestId,
            'IMAGE GENERATION',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'IMAGE GENERATION FAILED',
            error,
            res
        );
    }
};

// ==================================================
// 7. REMOVE IMAGE BACKGROUND
// ==================================================

export const removeImageBackground = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'BACKGROUND REMOVAL REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);

        const { prompt, published } = req.body;
        const image = req.file;

        const { plan } = getRequestPlan(req);

        log(requestId, 'BACKGROUND REMOVAL DETAILS', {
            plan,
            filePresent: Boolean(image),
            fileSize: image?.size
        });

        if (plan !== 'premium') {
            return sendValidationError(
                requestId,
                'BACKGROUND REMOVAL',
                res,
                403,
                'This feature is available to premium users only.',
                requestStart
            );
        }

        if (!image) {
            return sendValidationError(
                requestId,
                'BACKGROUND REMOVAL',
                res,
                400,
                'Please upload an image.',
                requestStart
            );
        }

        const cloudinaryTimer = createTimer(
            requestId,
            'CLOUDINARY BACKGROUND REMOVAL'
        );

        let secureUrl;

        try {
            const uploadedImage =
                await cloudinary.uploader.upload(
                    image.path,
                    {
                        transformation: [
                            {
                                effect: 'background_removal',
                                background_removal:
                                    'remove_the_background'
                            }
                        ],
                        folder: 'quickai/generated-images'
                    }
                );

            secureUrl = uploadedImage.secure_url;

            cloudinaryTimer.end({
                status: 'success'
            });
        } catch (error) {
            cloudinaryTimer.end({
                status: 'failed'
            });

            throw error;
        }

        await saveCreation(
            requestId,
            'DATABASE BACKGROUND REMOVAL INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type,
                    publish
                )
                VALUES (
                    ${userId},
                    ${prompt || 'Background removal'},
                    ${secureUrl},
                    'image',
                    ${isPublished(published)}
                )
            `
        );

        logRequestCompleted(
            requestId,
            'BACKGROUND REMOVAL',
            requestStart
        );

        return res.json({
            success: true,
            content: secureUrl,
            requestId
        });
    } catch (error) {
        logRequestCompleted(
            requestId,
            'BACKGROUND REMOVAL',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'BACKGROUND REMOVAL FAILED',
            error,
            res
        );
    } finally {
        await cleanupTemporaryFile(
            requestId,
            req.file?.path
        );
    }
};

// ==================================================
// 8. REMOVE OBJECT FROM IMAGE
// ==================================================

export const removeImageObject = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'OBJECT REMOVAL REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);

        const { prompt, published, object } = req.body;
        const image = req.file;

        const { plan } = getRequestPlan(req);

        log(requestId, 'OBJECT REMOVAL DETAILS', {
            plan,
            filePresent: Boolean(image),
            fileSize: image?.size,
            objectSpecified:
                typeof object === 'string' &&
                Boolean(object.trim())
        });

        // Check premium access.
        if (plan !== 'premium') {
            return sendValidationError(
                requestId,
                'OBJECT REMOVAL',
                res,
                403,
                'This feature is available to premium users only.',
                requestStart
            );
        }

        // Validate uploaded image.
        if (!image) {
            return sendValidationError(
                requestId,
                'OBJECT REMOVAL',
                res,
                400,
                'Please upload an image.',
                requestStart
            );
        }

        // Validate object description.
        if (
            typeof object !== 'string' ||
            !object.trim()
        ) {
            return sendValidationError(
                requestId,
                'OBJECT REMOVAL',
                res,
                400,
                'Please specify the object to remove.',
                requestStart
            );
        }

        // Upload the original image to Cloudinary.
        const cloudinaryTimer = createTimer(
            requestId,
            'CLOUDINARY ORIGINAL IMAGE UPLOAD'
        );

        let publicId;

        try {
            const uploadedImage =
                await cloudinary.uploader.upload(
                    image.path,
                    {
                        folder: 'quickai/generated-images',
                        resource_type: 'image'
                    }
                );

            publicId = uploadedImage.public_id;

            cloudinaryTimer.end({
                status: 'success'
            });
        } catch (error) {
            cloudinaryTimer.end({
                status: 'failed'
            });

            throw error;
        }

        // Create the object-removal transformation URL.
        const transformTimer = createTimer(
            requestId,
            'CLOUDINARY OBJECT REMOVAL URL CREATION'
        );

        const imageUrl = cloudinary.url(publicId, {
            effect: `gen_remove:prompt_${object.trim()}`,
            resource_type: 'image',
            secure: true
        });

        transformTimer.end({
            status: 'success'
        });

        log(requestId, 'OBJECT REMOVAL URL CREATED', {
            publicId,
            transformationCreated: Boolean(imageUrl)
        });

        // Save the result to the database.
        await saveCreation(
            requestId,
            'DATABASE OBJECT REMOVAL INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type,
                    publish
                )
                VALUES (
                    ${userId},
                    ${prompt || `Remove ${object.trim()} from image`},
                    ${imageUrl},
                    'image',
                    ${isPublished(published)}
                )
            `
        );

        logRequestCompleted(
            requestId,
            'OBJECT REMOVAL',
            requestStart
        );

        return res.json({
            success: true,
            content: imageUrl,
            requestId
        });

    } catch (error) {
        logRequestCompleted(
            requestId,
            'OBJECT REMOVAL',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'OBJECT REMOVAL FAILED',
            error,
            res
        );

    } finally {
        await cleanupTemporaryFile(
            requestId,
            req.file?.path
        );
    }
};
// ==================================================
// 9. RESUME REVIEW
// ==================================================

export const resumeReview = async (req, res) => {
    const requestId = getRequestId(req);
    const requestStart = performance.now();

    log(requestId, 'RESUME REVIEW REQUEST RECEIVED');

    try {
        const userId = getRequestUser(req);
        const resume = req.file;

        const { plan } = getRequestPlan(req);

        log(requestId, 'RESUME REVIEW DETAILS', {
            plan,
            filePresent: Boolean(resume),
            fileSize: resume?.size,
            mimetype: resume?.mimetype
        });

        // ==========================================
        // 1. VALIDATE USER PLAN
        // ==========================================

        if (plan !== 'premium') {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                403,
                'This feature is available to premium users only.',
                requestStart
            );
        }

        // ==========================================
        // 2. VALIDATE UPLOADED FILE
        // ==========================================

        if (!resume) {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                400,
                'Please upload your resume as a PDF.',
                requestStart
            );
        }

        if (
            resume.mimetype !== 'application/pdf' ||
            !resume.originalname
                .toLowerCase()
                .endsWith('.pdf')
        ) {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                400,
                'Only PDF files are supported.',
                requestStart
            );
        }

        if (resume.size > 5 * 1024 * 1024) {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                413,
                'Resume file exceeds the 5 MB limit.',
                requestStart
            );
        }

        // ==========================================
        // 3. EXTRACT PDF TEXT
        // ==========================================

        const pdfTimer = createTimer(
            requestId,
            'PDF TEXT EXTRACTION'
        );

        let resumeText;

        try {
            const dataBuffer =
                await FileSystem.promises.readFile(
                    resume.path
                );

            // pdf-parse@1.1.1 accepts a PDF buffer
            // and returns an object containing extracted text.
            const pdfData = await pdf(dataBuffer);

            resumeText = pdfData.text?.trim();

            pdfTimer.end({
                status: 'success',
                extractedCharacters:
                    resumeText?.length || 0
            });
        } catch (error) {
            pdfTimer.end({
                status: 'failed'
            });

            throw error;
        }

        // ==========================================
        // 4. VALIDATE EXTRACTED TEXT
        // ==========================================

        if (!resumeText) {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                400,
                'Could not extract text from this PDF. ' +
                    'Please upload a text-based PDF.',
                requestStart
            );
        }

        // ==========================================
        // 5. PREPARE AI REVIEW PROMPT
        // ==========================================

        const reviewPrompt = `
Review the following resume as an experienced technical recruiter.

Evaluate:
1. Overall resume quality.
2. Strengths and weaknesses.
3. Technical skills and their relevance.
4. Projects and measurable impact.
5. Work experience and achievements.
6. ATS compatibility and formatting.
7. Grammar, clarity, and action verbs.
8. Specific, actionable improvements.

Give an overall score out of 100, explain the main reasons,
and provide concrete suggestions for improvement.

Do not invent qualifications or experience.

RESUME CONTENT:
${resumeText}
`;

        // ==========================================
        // 6. REQUEST GEMINI REVIEW
        // ==========================================

        const aiTimer = createTimer(
            requestId,
            'GEMINI RESUME REVIEW'
        );

        let response;

        try {
            response = await AI.chat.completions.create({
                model: GEMINI_MODEL,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an expert technical recruiter ' +
                            'and resume reviewer. Give honest, ' +
                            'constructive, specific feedback. ' +
                            'Never invent information absent ' +
                            'from the resume.'
                    },
                    {
                        role: 'user',
                        content: reviewPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1500
            });

            aiTimer.end({
                status: 'success'
            });
        } catch (error) {
            aiTimer.end({
                status: 'failed'
            });

            throw error;
        }

        // ==========================================
        // 7. VALIDATE AI RESPONSE
        // ==========================================

        const review = getAIContent(response);

        logAIResponse(requestId, response, review);

        if (!review) {
            return sendValidationError(
                requestId,
                'RESUME REVIEW',
                res,
                502,
                'The AI returned an empty resume review. Please try again.',
                requestStart
            );
        }

        // ==========================================
        // 8. SAVE REVIEW TO DATABASE
        // ==========================================

        await saveCreation(
            requestId,
            'DATABASE RESUME REVIEW INSERT',
            sql`
                INSERT INTO creations (
                    user_id,
                    prompt,
                    content,
                    type,
                    publish
                )
                VALUES (
                    ${userId},
                    ${'Review uploaded resume'},
                    ${review},
                    'resume-review',
                    FALSE
                )
            `
        );

        // ==========================================
        // 9. LOG COMPLETION AND RETURN RESPONSE
        // ==========================================

        logRequestCompleted(
            requestId,
            'RESUME REVIEW',
            requestStart
        );

        return res.json({
            success: true,
            content: review,
            requestId
        });
    } catch (error) {
        logRequestCompleted(
            requestId,
            'RESUME REVIEW',
            requestStart,
            'failed'
        );

        return sendControllerError(
            requestId,
            'RESUME REVIEW FAILED',
            error,
            res
        );
    } finally {
        // ==========================================
        // 10. CLEAN UP TEMPORARY UPLOAD
        // ==========================================

        await cleanupTemporaryFile(
            requestId,
            req.file?.path
        );
    }
};