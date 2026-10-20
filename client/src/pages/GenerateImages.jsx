import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Sparkles, Image as ImageIcon, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { createApi } from '../lib/api';

const GenerateImages = () => {
    const imageStyles = [
        'Realistic',
        'Ghibli Style',
        'Anime Style',
        'Cartoon Style',
        'Fantasy Style',
        '3D Style',
        'Portrait Style',
    ];

    const { getToken, isLoaded, isSignedIn } = useAuth();

    const [selectedStyle, setSelectedStyle] = useState('Realistic');
    const [input, setInput] = useState('');
    const [publish, setPublish] = useState(false);
    const [generatedImage, setGeneratedImage] = useState('');
    const [loading, setLoading] = useState(false);

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!input.trim()) {
            toast.error('Please describe the image you want to generate.');
            return;
        }

        if (!isLoaded) {
            toast.error('Authentication is still loading. Please try again.');
            return;
        }

        if (!isSignedIn) {
            toast.error('Please sign in to generate images.');
            return;
        }

        try {
            setLoading(true);

            console.info('[GenerateImages] Request started', {
                style: selectedStyle,
                publish,
            });

            const api = createApi(getToken);

            const response = await api.post('/api/ai/generate-image', {
                prompt: `${selectedStyle} style: ${input.trim()}`,
                publish,
            });

            const result = response.data;

            if (!result.success) {
                throw new Error(result.message || 'Image generation failed.');
            }

            // Adjust this field if your controller returns a different response shape.
            const imageUrl =
                result.imageUrl ||
                result.image ||
                result.creation?.content ||
                result.content;

            if (!imageUrl) {
                console.error(
                    '[GenerateImages] Response did not contain an image URL',
                    { requestId: result.requestId }
                );

                throw new Error(
                    'The server responded, but no image URL was returned.'
                );
            }

            setGeneratedImage(imageUrl);

            toast.success('Image generated successfully!');

            console.info('[GenerateImages] Request completed', {
                requestId: result.requestId,
            });
        } catch (error) {
            console.error('[GenerateImages] Request failed', {
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Unknown error',
                requestId: error.response?.data?.requestId,
            });

            toast.error(
                error.response?.data?.message ||
                error.message ||
                'Failed to generate image. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

            {/* Left Column: Image Configuration */}
            <form
                onSubmit={onSubmitHandler}
                className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
            >
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 text-green-600" />

                    <h1 className="text-xl font-semibold">
                        AI Image Generator
                    </h1>
                </div>

                <p className="mt-6 text-sm font-medium">
                    Describe your image
                </p>

                <textarea
                    value={input}
                    rows={4}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300 resize-none focus:border-green-400"
                    placeholder="Describe what you want to see in the image..."
                    required
                    disabled={loading}
                />

                <p className="mt-4 text-sm font-medium">
                    Image Style
                </p>

                <div className="mt-3 flex gap-3 flex-wrap">
                    {imageStyles.map((item) => (
                        <button
                            type="button"
                            key={item}
                            disabled={loading}
                            onClick={() => setSelectedStyle(item)}
                            className={`text-xs px-4 py-1 border rounded-full cursor-pointer disabled:cursor-not-allowed ${
                                selectedStyle === item
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'text-gray-500 border-gray-300'
                            }`}
                        >
                            {item}
                        </button>
                    ))}
                </div>

                <div className="my-6 flex items-center gap-2">
                    <label className="relative cursor-pointer">
                        <input
                            type="checkbox"
                            checked={publish}
                            onChange={(e) => setPublish(e.target.checked)}
                            className="sr-only peer"
                            disabled={loading}
                        />

                        <div className="w-9 h-5 bg-slate-300 rounded-full peer-checked:bg-green-500 transition"></div>

                        <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition peer-checked:translate-x-4"></span>
                    </label>

                    <p className="text-sm">Make this image Public</p>
                </div>

                <button
                    type="submit"
                    disabled={loading || !isLoaded}
                    className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-green-600 to-green-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-4 h-4" />
                            Generate Image
                        </>
                    )}
                </button>
            </form>

            {/* Right Column: Generated Image */}
            <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

                <div className="flex items-center gap-3">
                    <ImageIcon className="w-5 h-5 text-green-600" />

                    <h1 className="text-xl font-semibold">
                        Generated Image
                    </h1>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center mt-4">
                    {generatedImage ? (
                        <img
                            src={generatedImage}
                            alt="AI-generated result"
                            className="w-full rounded-lg object-contain"
                        />
                    ) : loading ? (
                        <>
                            <Loader2 className="w-10 h-10 text-green-500 animate-spin mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                Generating your image. Please wait...
                            </p>
                        </>
                    ) : (
                        <>
                            <ImageIcon className="w-10 h-10 text-green-400 mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                Your generated image will appear here.
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateImages;