import React, { useState, useEffect } from 'react';
import { Sparkles, Eraser, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { createApi } from '../lib/api';

const RemoveBackground = () => {
    const { getToken } = useAuth();

    const [input, setInput] = useState(null);
    const [preview, setPreview] = useState('');
    const [processedImage, setProcessedImage] = useState('');
    const [loading, setLoading] = useState(false);

    // Create an API client with Clerk authentication.
    const api = createApi(getToken);

    // Clean up the local preview URL when it changes or the component unmounts.
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!input) {
            toast.error('Please upload an image first.');
            return;
        }

        if (loading) {
            return;
        }

        setLoading(true);
        setProcessedImage('');

        console.log('[RemoveBackground] Request started', {
            fileName: input.name,
            fileSize: input.size,
            fileType: input.type,
        });

        try {
            // FormData is required to upload an image file.
            const formData = new FormData();

            formData.append('image', input);
            formData.append('prompt', 'Background removal');
            formData.append('published', 'false');

            // Send the image to the authenticated backend.
            const response = await api.post(
                '/api/ai/remove-background',
                formData
            );

            const result = response.data;

            if (!result.success || !result.content) {
                throw new Error(
                    result.message || 'Background removal failed.'
                );
            }

            setProcessedImage(result.content);

            toast.success('Background removed successfully!');

            console.log('[RemoveBackground] Request successful', {
                requestId: result.requestId,
                imageReceived: Boolean(result.content),
            });
        } catch (error) {
            const status = error.response?.status;
            const message =
                error.response?.data?.message ||
                error.message ||
                'Something went wrong.';

            console.error('[RemoveBackground] Request failed', {
                status,
                message,
                requestId: error.response?.data?.requestId,
            });

            if (status === 403) {
                toast.error(
                    'Background removal is available to premium users only.'
                );
            } else if (status === 401) {
                toast.error('Please sign in again and retry.');
            } else {
                toast.error(message);
            }
        } finally {
            setLoading(false);
        }
    };

    const onImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) {
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file.');
            e.target.value = '';
            return;
        }

        setInput(file);
        setPreview(URL.createObjectURL(file));
        setProcessedImage('');
    };

    return (
        <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

            {/* Left Column: Background Removal Configuration */}
            <form
                onSubmit={onSubmitHandler}
                className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
            >
                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 text-orange-600" />

                    <h1 className="text-xl font-semibold">
                        Background Removal
                    </h1>
                </div>

                {/* Upload Image */}
                <p className="mt-6 text-sm font-medium">
                    Upload Image
                </p>

                <input
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="text-gray-600 w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:border-orange-400"
                    required
                    disabled={loading}
                />

                <p className="mt-4 text-xs text-gray-500">
                    Supports JPG, PNG, and other image formats.
                </p>

                {/* Uploaded Image Preview */}
                {preview && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2">
                            Original Image
                        </p>

                        <img
                            src={preview}
                            alt="Uploaded preview"
                            className="w-full max-w-sm rounded-lg border border-gray-200"
                        />
                    </div>
                )}

                {/* Remove Background Button */}
                <button
                    type="submit"
                    disabled={!input || loading}
                    className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-orange-600 to-orange-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Eraser className="w-4 h-4" />

                    {loading ? 'Removing Background...' : 'Remove Background'}
                </button>
            </form>

            {/* Right Column: Processed Image */}
            <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Eraser className="w-5 h-5 text-orange-600" />

                    <h1 className="text-xl font-semibold">
                        Processed Image
                    </h1>
                </div>

                {/* Processed Image Output */}
                <div className="flex-1 flex flex-col items-center justify-center mt-4">
                    {loading ? (
                        <div className="text-center">
                            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />

                            <p className="text-sm text-gray-500">
                                Removing the background...
                            </p>
                        </div>
                    ) : processedImage ? (
                        <div className="w-full text-center">
                            <img
                                src={processedImage}
                                alt="Image with background removed"
                                className="w-full max-w-sm rounded-lg border border-gray-200 mx-auto"
                            />

                            <a
                                href={processedImage}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-4 text-sm text-orange-600 hover:underline"
                            >
                                Open processed image
                            </a>
                        </div>
                    ) : (
                        <>
                            <ImageIcon className="w-10 h-10 text-orange-400 mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                Your processed image will appear here.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoveBackground;