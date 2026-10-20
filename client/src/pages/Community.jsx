import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { Heart } from 'lucide-react';
import { toast } from 'react-toastify';
import { createApi } from '../lib/api';

const Community = () => {
    const [creations, setCreations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [likingIds, setLikingIds] = useState([]);

    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    const api = createApi(getToken);

    // Fetch published creations from the backend.
    const fetchCreations = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get(
                '/api/user/get-published-creations'
            );

            const result = response.data;

            if (!result.success) {
                throw new Error(
                    result.message || 'Failed to fetch community creations.'
                );
            }

            setCreations(
                Array.isArray(result.creations)
                    ? result.creations
                    : Array.isArray(result.content)
                        ? result.content
                        : []
            );
        } catch (error) {
            console.error('[Community] Fetch failed', {
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Failed to fetch community creations.',
                requestId: error.response?.data?.requestId,
            });

            toast.error('Failed to load community creations.');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        if (isLoaded) {
            fetchCreations();
        }
    }, [isLoaded, fetchCreations]);

    // Toggle the current user's like without refreshing all creations.
    const handleLike = async (creationId) => {
        if (!user) {
            toast.error('Please sign in to like a creation.');
            return;
        }

        // Prevent duplicate requests for the same creation.
        if (likingIds.includes(creationId)) {
            return;
        }

        setLikingIds((prev) => [...prev, creationId]);

        try {
            const response = await api.post(
                '/api/user/toggle-like',
                { creationId }
            );

            const result = response.data;

            if (!result.success) {
                throw new Error(
                    result.message || 'Failed to update like.'
                );
            }

            // Update only the selected creation.
            setCreations((prevCreations) =>
                prevCreations.map((creation) =>
                    creation.id === creationId
                        ? {
                            ...creation,
                            likes: Array.isArray(result.likes)
                                ? result.likes
                                : [],
                        }
                        : creation
                )
            );
        } catch (error) {
            console.error('[Community] Like failed', {
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Failed to update like.',
                requestId: error.response?.data?.requestId,
            });

            toast.error(
                error.response?.data?.message ||
                'Failed to update like.'
            );
        } finally {
            setLikingIds((prev) =>
                prev.filter((id) => id !== creationId)
            );
        }
    };

    return (
        <div className="flex-1 h-full flex flex-col gap-4 p-6">
            <h1 className="text-xl font-semibold">Community</h1>

            <div className="bg-white h-full w-full rounded-xl overflow-y-scroll">
                {loading ? (
                    <p className="p-6 text-sm text-gray-500">
                        Loading community creations...
                    </p>
                ) : creations.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500">
                        No published creations yet.
                    </p>
                ) : (
                    <div className="flex flex-wrap">
                        {creations.map((creation, index) => {
                            const likes = Array.isArray(creation.likes)
                                ? creation.likes
                                : [];

                            const isLiked = user
                                ? likes.includes(user.id)
                                : false;

                            const isLiking = likingIds.includes(
                                creation.id
                            );

                            return (
                                <div
                                    key={creation.id ?? index}
                                    className="relative group inline-block pl-3 pt-3 w-full sm:w-1/2 lg:w-1/3"
                                >
                                    <img
                                        src={creation.content}
                                        alt={
                                            creation.prompt ||
                                            'Community creation'
                                        }
                                        className="w-full h-full object-cover rounded-lg"
                                    />

                                    <div className="absolute bottom-0 top-0 right-0 left-3 flex gap-2 items-end justify-end group-hover:justify-between p-3 group-hover:bg-gradient-to-b from-transparent to-black/80 text-white rounded-lg">
                                        <p className="text-sm hidden group-hover:block">
                                            {creation.prompt}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleLike(creation.id)
                                            }
                                            disabled={isLiking}
                                            aria-label={
                                                isLiked
                                                    ? 'Unlike creation'
                                                    : 'Like creation'
                                            }
                                            aria-pressed={isLiked}
                                            className={`flex gap-1 items-center ${
                                                isLiking
                                                    ? 'opacity-60 cursor-wait'
                                                    : 'cursor-pointer'
                                            }`}
                                        >
                                            <span>{likes.length}</span>

                                            <Heart
                                                className={`min-w-5 h-5 transition-transform ${
                                                    isLiking
                                                        ? ''
                                                        : 'hover:scale-110'
                                                } ${
                                                    isLiked
                                                        ? 'fill-red-500 text-red-600'
                                                        : 'text-white'
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Community;