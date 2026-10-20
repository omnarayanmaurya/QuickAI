import React, { useState } from 'react';
import { Sparkles, Hash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const BlogTitle = () => {
    const blogCategories = [
        'General',
        'Technology',
        'Business',
        'Health',
        'Lifestyle',
        'Education',
        'Travel',
        'Food',
    ];

    const [selectedCategory, setSelectedCategory] = useState('General');
    const [input, setInput] = useState('');
    const [titles, setTitles] = useState([]);
    const [loading, setLoading] = useState(false);

    const { getToken } = useAuth();
    const navigate = useNavigate();

    const onSubmitHandler = async (e) => {
        e.preventDefault();

        if (!input.trim()) {
            toast.error('Please enter a keyword');
            return;
        }

        try {
            setLoading(true);
            setTitles([]);

            const token = await getToken();

            const { data } = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/ai/generate-blog-title`,
                {
                    prompt: input,
                    category: selectedCategory,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (data.success) {
                // Handle either an array of titles or a string response.
                const generatedTitles = Array.isArray(data.content)
                    ? data.content
                    : typeof data.content === 'string'
                        ? data.content
                            .split('\n')
                            .map((title) => title.replace(/^\s*(?:\d+[\.\)]|[-*])\s*/, '').trim())
                            .filter(Boolean)
                        : [];

                setTitles(generatedTitles);

                if (generatedTitles.length === 0) {
                    toast.error('No titles were generated');
                }
            } else {
                toast.error(data.message || 'Failed to generate titles');

                if (data.redirect) {
                    navigate(data.redirect);
                }
            }
        } catch (error) {
            console.error('Blog title generation error:', error);

            toast.error(
                error.response?.data?.message ||
                error.response?.data?.error ||
                error.message ||
                'Something went wrong'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

            {/* Left Column: Title Configuration */}
            <form
                onSubmit={onSubmitHandler}
                className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
            >
                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 text-purple-600" />

                    <h1 className="text-xl font-semibold">
                        AI Title Generation
                    </h1>
                </div>

                {/* Keyword */}
                <p className="mt-6 text-sm font-medium">
                    Keyword
                </p>

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
                    placeholder="Enter a keyword for your blog..."
                    required
                />

                {/* Category */}
                <p className="mt-4 text-sm font-medium">
                    Category
                </p>

                <div className="mt-3 flex gap-3 flex-wrap">
                    {blogCategories.map((item) => (
                        <span
                            key={item}
                            onClick={() => setSelectedCategory(item)}
                            className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                                selectedCategory === item
                                    ? 'bg-purple-50 text-purple-700 border-purple-300'
                                    : 'text-gray-500 border-gray-300'
                            }`}
                        >
                            {item}
                        </span>
                    ))}
                </div>

                {/* Generate Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-purple-600 to-purple-500 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Hash className="w-4" />

                    {loading ? 'Generating...' : 'Generate Title'}
                </button>
            </form>

            {/* Right Column: Generated Titles */}
            <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

                {/* Heading */}
                <div className="flex items-center gap-3">
                    <Hash className="w-5 h-5 text-purple-600" />

                    <h1 className="text-xl font-semibold">
                        Generated Titles
                    </h1>
                </div>

                {/* Generated Titles */}
                <div className="flex-1 mt-4">

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>

                            <p className="text-sm text-gray-400 mt-3">
                                Generating your titles...
                            </p>
                        </div>
                    ) : titles.length > 0 ? (
                        <div className="space-y-3">
                            {titles.map((title, index) => (
                                <div
                                    key={index}
                                    className="p-3 border border-gray-200 rounded-md hover:border-purple-300 transition-colors"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-sm font-semibold text-purple-600">
                                            {index + 1}.
                                        </span>

                                        <p className="text-sm text-gray-700">
                                            {title}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Hash className="w-10 h-10 text-purple-400 mb-3" />

                            <p className="text-sm text-gray-400 text-center">
                                Your generated titles will appear here.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default BlogTitle;