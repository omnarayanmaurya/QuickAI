import React, { useState } from 'react';

import { Sparkles, FileText } from 'lucide-react';

import { useAuth } from '@clerk/clerk-react';

import { toast } from 'react-toastify';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { createApi } from '../lib/api';

const ReviewResume = () => {
    const { getToken } = useAuth();

    const api = createApi(getToken);

    const [input, setInput] = useState(null);
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle resume selection.
    const onFileChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            const isPdf =
                file.type === 'application/pdf' ||
                /\.pdf$/i.test(file.name);

            if (!isPdf) {
                toast.error('Please upload your resume as a PDF file.');
                e.target.value = '';
                setInput(null);
                setReview('');
                return;
            }

            setInput(file);
            setReview('');
        }
    };

    // Submit the resume for AI review.
    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!input) {
            toast.error('Please upload your resume first.');
            return;
        }

        setLoading(true);
        setReview('');

        const requestId = crypto.randomUUID();

        console.log('[ReviewResume] Request started', {
            requestId,
            fileName: input.name,
            fileSize: input.size,
            fileType: input.type,
        });

        try {
            const formData = new FormData();

            // The backend expects the field name "resume".
            formData.append('resume', input);

            const response = await api.post(
                '/api/ai/resume-review',
                formData
            );

            const result = response.data;

            if (!result.success) {
                throw new Error(
                    result.message || 'Resume review failed.'
                );
            }

            const reviewContent =
                result.review ||
                result.content ||
                result.result;

            if (!reviewContent) {
                throw new Error(
                    'The server did not return a resume review.'
                );
            }

            setReview(
                typeof reviewContent === 'string'
                    ? reviewContent
                    : JSON.stringify(reviewContent, null, 2)
            );

            console.log('[ReviewResume] Request completed', {
                requestId: result.requestId || requestId,
                success: true,
            });

            toast.success('Resume review completed!');
        } catch (error) {
            console.error('[ReviewResume] Request failed', {
                requestId,
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Resume review failed.',
                serverRequestId: error.response?.data?.requestId,
            });

            toast.error(
                error.response?.data?.message ||
                'Failed to review your resume. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

            {/* Left Side: Resume Upload Form */}
            <form
                onSubmit={onSubmitHandler}
                className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 text-green-700" />

                    <h1 className="text-xl font-semibold">
                        AI Resume Review
                    </h1>
                </div>

                <p className="mt-6 text-sm font-medium">
                    Upload Resume
                </p>

                <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={onFileChange}
                    className="text-gray-600 w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:border-green-600"
                    required
                    disabled={loading}
                />

                <p className="mt-4 text-xs text-gray-500">
                    Upload your resume in PDF format.
                </p>

                {/* Selected Resume */}
                {input && (
                    <div className="mt-4 flex items-center gap-3 rounded-lg border border-green-300 bg-green-100 p-3">
                        <FileText className="w-6 h-6 text-green-700" />

                        <div className="min-w-0">
                            <p className="text-sm font-medium text-green-900">
                                Selected Resume
                            </p>

                            <p className="text-xs text-green-800 truncate">
                                {input.name}
                            </p>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-green-400 to-green-700 hover:from-green-500 hover:to-green-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Sparkles className="w-4 h-4" />

                    {loading
                        ? 'Reviewing Resume...'
                        : 'Review Resume'}
                </button>
            </form>

            {/* Right Side: Resume Analysis */}
            <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-700" />

                    <h1 className="text-xl font-semibold">
                        Resume Analysis
                    </h1>
                </div>

                <div className="flex-1 mt-4">

                    {review ? (
                        <div className="reset-tw w-full text-sm text-slate-700 leading-7">
                            <Markdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ ...props }) => (
                                        <h1
                                            className="text-2xl font-bold text-slate-800 mt-5 mb-3"
                                            {...props}
                                        />
                                    ),

                                    h2: ({ ...props }) => (
                                        <h2
                                            className="text-xl font-semibold text-slate-800 mt-5 mb-3"
                                            {...props}
                                        />
                                    ),

                                    h3: ({ ...props }) => (
                                        <h3
                                            className="text-lg font-semibold text-slate-800 mt-4 mb-2"
                                            {...props}
                                        />
                                    ),

                                    p: ({ ...props }) => (
                                        <p
                                            className="my-3 leading-7"
                                            {...props}
                                        />
                                    ),

                                    ul: ({ ...props }) => (
                                        <ul
                                            className="list-disc pl-6 my-3 space-y-1"
                                            {...props}
                                        />
                                    ),

                                    ol: ({ ...props }) => (
                                        <ol
                                            className="list-decimal pl-6 my-3 space-y-1"
                                            {...props}
                                        />
                                    ),

                                    li: ({ ...props }) => (
                                        <li
                                            className="pl-1"
                                            {...props}
                                        />
                                    ),

                                    strong: ({ ...props }) => (
                                        <strong
                                            className="font-semibold text-slate-900"
                                            {...props}
                                        />
                                    ),

                                    blockquote: ({ ...props }) => (
                                        <blockquote
                                            className="border-l-4 border-green-500 pl-4 my-4 italic text-slate-600"
                                            {...props}
                                        />
                                    ),

                                    code: ({ ...props }) => (
                                        <code
                                            className="bg-slate-100 rounded px-1 py-0.5 text-sm"
                                            {...props}
                                        />
                                    ),

                                    hr: () => (
                                        <hr className="my-5 border-slate-300" />
                                    ),

                                    table: ({ ...props }) => (
                                        <div className="my-4 overflow-x-auto">
                                            <table
                                                className="w-full border-collapse text-left text-sm"
                                                {...props}
                                            />
                                        </div>
                                    ),

                                    th: ({ ...props }) => (
                                        <th
                                            className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold"
                                            {...props}
                                        />
                                    ),

                                    td: ({ ...props }) => (
                                        <td
                                            className="border border-slate-300 px-3 py-2"
                                            {...props}
                                        />
                                    ),
                                }}
                            >
                                {review}
                            </Markdown>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center">
                            <FileText className="w-10 h-10 text-green-500 mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                {loading
                                    ? 'Analyzing your resume...'
                                    : 'Your resume analysis will appear here.'}
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default ReviewResume;