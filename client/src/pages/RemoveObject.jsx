import React, { useState, useEffect } from 'react';
import { Sparkles, Scissors } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import { createApi } from '../lib/api';

const RemoveObject = () => {
    const { getToken } = useAuth();
    const api = createApi(getToken);

    const [input, setInput] = useState(null);
    const [object, setObject] = useState('');
    const [preview, setPreview] = useState('');
    const [processedImage, setProcessedImage] = useState('');
    const [loading, setLoading] = useState(false);

    // Clean up the temporary preview URL when it changes or the component unmounts.
    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    // Handle image selection.
    const onImageChange = (e) => {
        const file = e.target.files[0];

        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image.');
                e.target.value = '';
                return;
            }

            setInput(file);
            setPreview(URL.createObjectURL(file));
            setProcessedImage('');
        }
    };

    // Send the image and object description to the backend.
    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!input) {
            toast.error('Please upload an image.');
            return;
        }

        if (!object.trim()) {
            toast.error('Please describe the object to remove.');
            return;
        }

        setLoading(true);
        setProcessedImage('');

        const requestId = crypto.randomUUID();

        console.log('[RemoveObject] Request started', {
            requestId,
            fileName: input.name,
            fileSize: input.size,
            fileType: input.type,
            objectDescription: object.trim(),
        });

        try {
            const formData = new FormData();

            // These field names must match the backend.
            formData.append('image', input);
            formData.append('object', object.trim());
            formData.append('published', 'false');

            const response = await api.post(
                '/api/ai/remove-object',
                formData
            );

            const result = response.data;

            if (!result.success) {
                throw new Error(
                    result.message || 'Object removal failed.'
                );
            }

            const imageUrl =
                result.content ||
                result.imageUrl ||
                result.image;
            
            console.log('[RemoveObject] Returned image URL:', imageUrl);    

            if (!imageUrl) {
                throw new Error(
                    'The server did not return a processed image.'
                );
            }

            setProcessedImage(imageUrl);

            console.log('[RemoveObject] Request completed', {
                requestId: result.requestId || requestId,
                success: true,
            });

            toast.success('Object removed successfully!');
        } catch (error) {
            console.error('[RemoveObject] Request failed', {
                requestId,
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Object removal failed.',
                serverRequestId: error.response?.data?.requestId,
            });

            toast.error(
                error.response?.data?.message ||
                'Failed to remove the object. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

            {/* Left Column: Object Removal Configuration */}
            <form
                onSubmit={onSubmitHandler}
                className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
            >
                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 text-red-600" />

                    <h1 className="text-xl font-semibold">
                        Object Removal
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
                    className="text-gray-600 w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 focus:border-red-400"
                    required
                    disabled={loading}
                />

                <p className="mt-4 text-xs text-gray-500">
                    Supports JPG, PNG, and other image formats.
                </p>

                {/* Original Image Preview */}
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

                {/* Object Description */}
                <p className="mt-6 text-sm font-medium">
                    Describe the object to be removed
                </p>

                <textarea
                    value={object}
                    rows={3}
                    onChange={(e) => setObject(e.target.value)}
                    className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 resize-none focus:border-red-400"
                    placeholder="For example: remove the person standing in the background..."
                    required
                    disabled={loading}
                />

                {/* Remove Object Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-red-600 to-red-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Scissors className="w-4 h-4" />

                    {loading ? 'Removing Object...' : 'Remove Object'}
                </button>
            </form>

            {/* Right Column: Processed Image */}
            <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-red-600" />

                    <h1 className="text-xl font-semibold">
                        Processed Image
                    </h1>
                </div>

                {/* Processed Image Output */}
                <div className="flex-1 flex flex-col items-center justify-center mt-4">
                    {processedImage ? (
                        <img
                            src={processedImage}
                            alt="Image with object removed"
                            className="w-full max-w-sm rounded-lg border border-gray-200"
                        />
                    ) : (
                        <>
                            <Scissors className="w-10 h-10 text-red-400 mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                {loading
                                    ? 'Removing the specified object...'
                                    : 'Your processed image will appear here.'}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RemoveObject;