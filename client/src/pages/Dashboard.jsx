import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Gem as GemIcon } from 'lucide-react';
import { Protect, useAuth } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

import CreationItem from '../components/CreationItem';
import { createApi } from '../lib/api';

const Dashboard = () => {
    const [creations, setCreations] = useState([]);
    const [loading, setLoading] = useState(true);

    const { getToken, isLoaded, isSignedIn } = useAuth();

    const getDashBoardData = useCallback(async () => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            setCreations([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            const api = createApi(getToken);

            const response = await api.get(
                '/api/user/get-user-creations'
            );

            const result = response.data;

            if (!result.success) {
                throw new Error(
                    result.message || 'Failed to fetch your creations.'
                );
            }

            setCreations(
                Array.isArray(result.creations)
                    ? result.creations
                    : []
            );
        } catch (error) {
            console.error('[Dashboard] Fetch failed', {
                status: error.response?.status,
                message:
                    error.response?.data?.message ||
                    error.message ||
                    'Failed to fetch your creations.',
                requestId: error.response?.data?.requestId,
            });

            toast.error('Failed to load your creations.');
        } finally {
            setLoading(false);
        }
    }, [getToken, isLoaded, isSignedIn]);

    useEffect(() => {
        getDashBoardData();
    }, [getDashBoardData]);

    return (
        <div className="h-full overflow-y-scroll p-6">

            {/* Dashboard Summary Cards */}
            <div className="flex justify-start gap-4 flex-wrap">

                {/* Total Creations Card */}
                <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
                    <div className="text-slate-600">
                        <p className="text-sm">Total Creations</p>

                        <h2 className="text-2xl font-semibold">
                            {loading ? '...' : creations.length}
                        </h2>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3588F2] to-[#0BB0D7] text-white flex justify-center items-center">
                        <Sparkles className="w-5 h-5" />
                    </div>
                </div>

                {/* Active Plan Card */}
                <div className="flex justify-between items-center w-72 p-4 px-6 bg-white rounded-xl border border-gray-200">
                    <div className="text-slate-600">
                        <p className="text-sm">Active Plan</p>

                        <h2 className="text-2xl font-semibold">
                            <Protect plan="premium" fallback="Free">
                                Premium
                            </Protect>
                        </h2>
                    </div>

                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF61C5] to-[#9E53EE] text-white flex justify-center items-center">
                        <GemIcon className="w-5 h-5" />
                    </div>
                </div>

            </div>

            {/* Recent Creations */}
            <div className="space-y-3">
                <p className="mt-6 mb-4 font-medium">
                    Recent Creations
                </p>

                {loading ? (
                    <p className="text-sm text-gray-500">
                        Loading your creations...
                    </p>
                ) : creations.length > 0 ? (
                    creations.map((item) => (
                        <CreationItem
                            key={item.id}
                            item={item}
                        />
                    ))
                ) : (
                    <p className="text-sm text-gray-500">
                        No creations found.
                    </p>
                )}
            </div>

        </div>
    );
};

export default Dashboard;