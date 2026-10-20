import React from 'react';
import { useUser, useClerk, Protect } from '@clerk/clerk-react';
import { NavLink } from 'react-router-dom';

import {
    House,
    PenLine,
    Hash,
    Image,
    Eraser,
    Scan,
    FileText,
    Users,
    LogOut
} from 'lucide-react';

const navItems = [
    { to: '/ai', label: 'Dashboard', Icon: House },
    { to: '/ai/write-articles', label: 'Write Articles', Icon: PenLine },
    { to: '/ai/blog-titles', label: 'Blog Titles', Icon: Hash },
    { to: '/ai/generate-images', label: 'Generate Images', Icon: Image },
    { to: '/ai/remove-background', label: 'Remove Background', Icon: Eraser },
    { to: '/ai/remove-object', label: 'Remove Object', Icon: Scan },
    { to: '/ai/review-resume', label: 'Review Resume', Icon: FileText },
    { to: '/ai/community', label: 'Community', Icon: Users },
];

const Sidebar = ({ sidebar, setSidebar }) => {
    const { user, isLoaded } = useUser();
    const { signOut, openUserProfile } = useClerk();

    // Wait until Clerk finishes loading the user.
    if (!isLoaded || !user) return null;

    return (
        <div
            className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${sidebar
                    ? 'translate-x-0'
                    : 'max-sm:-translate-x-full'
                } transition-all duration-300 ease-in-out`}
        >
            {/* User information and navigation */}
            <div className="my-7 w-full">

                {/* User avatar */}
                <img
                    src={user.imageUrl}
                    alt="User avatar"
                    className="w-12 h-12 rounded-full mx-auto cursor-pointer"
                    onClick={() => openUserProfile()}
                />

                {/* User name */}
                <h1 className="mt-1 text-center">
                    {user.fullName}
                </h1>

                {/* Navigation links */}
                <div className="px-6 mt-5 text-sm text-gray-600 font-medium">
                    {navItems.map(({ to, label, Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/ai'}
                            onClick={() => setSidebar(false)}
                            className={({ isActive }) =>
                                `px-3.5 py-2.5 flex items-center gap-3 rounded transition-all ${isActive
                                    ? 'bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white'
                                    : 'hover:bg-gray-100'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon
                                        className={`w-4 h-4 ${isActive ? 'text-white' : ''
                                            }`}
                                    />

                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>

            {/* Bottom section: User profile and logout */}
            <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">

                {/* Profile information */}
                <div
                    onClick={() => openUserProfile()}
                    className="flex gap-2 items-center cursor-pointer"
                >
                    <img
                        src={user.imageUrl}
                        className="w-8 h-8 rounded-full"
                        alt="User avatar"
                    />

                    <div>
                        <h1 className="text-sm font-medium">
                            {user.fullName}
                        </h1>

                        <p className="text-xs text-gray-500">
                            <Protect
                                plan="premium"
                                fallback={<span>Free </span>}
                            >
                                Premium{' '}
                            </Protect>
                            Plan
                        </p>
                    </div>
                </div>

                {/* Logout button */}
                <LogOut
                    onClick={() => signOut()}
                    className="w-5 h-5 text-gray-400 hover:text-gray-700 transition cursor-pointer"
                />
            </div>
        </div>
    );
};

export default Sidebar;