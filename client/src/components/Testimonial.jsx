import React from 'react';

const Testimonial = () => {
    return (
        <div className="p-5">
            <div className="flex flex-col items-center text-center">

                {/* Heading */}
                <h1 className="text-4xl font-bold max-w-[740px] mb-[72px]">
                    Trusted by <span className="text-blue-600">30k+</span> world class companies & design teams
                </h1>

                {/* Testimonial Cards */}
                <div className="flex flex-wrap items-center justify-center gap-4">

                    {/* Testimonial 1 */}
                    <div className="flex flex-col items-center bg-white px-3 py-8 rounded-lg border border-gray-300/80 max-w-[272px] text-sm text-center text-gray-500">

                        <div className="relative mb-4">
                            <img
                                className="h-16 w-16 rounded-full"
                                src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage1.png"
                                alt="Donald Jackman"
                            />

                            <svg
                                className="absolute top-0 -right-2"
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="10.5" cy="10.5" r="8.5" fill="#2563EB" />
                                <path
                                    d="m11.584 13.872 1.752-3.288 1.104-.288a2.7 2.7 0 0 1-.432.576.76.76 0 0 1-.552.24q-.672 0-1.248-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.168.912-.144.504-.576 1.296l-1.92 3.552zm-5.4 0 1.752-3.288 1.08-.288a2.2 2.2 0 0 1-.408.576.76.76 0 0 1-.552.24q-.696 0-1.272-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.144.912-.144.504-.576 1.296L7.96 14.832z"
                                    fill="#fff"
                                />
                            </svg>
                        </div>

                        <p>
                            “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incidihunt ut labore et dolore magna aligua. Ut enim ad minim ieniam, quis nostrud aliquip”
                        </p>

                        <p className="text-lg text-gray-800 font-medium mt-5">
                            Donald Jackman
                        </p>

                        <p className="text-xs">Content Creator</p>
                    </div>

                    {/* Testimonial 2 */}
                    <div className="flex flex-col items-center bg-white px-3 py-8 rounded-lg border border-gray-300/80 max-w-[272px] text-sm text-center text-gray-500">

                        <div className="relative mb-4">
                            <img
                                className="h-16 w-16 rounded-full"
                                src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage2.png"
                                alt="Richard Nelson"
                            />

                            <svg
                                className="absolute top-0 -right-2"
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="10.5" cy="10.5" r="8.5" fill="#2563EB" />
                                <path
                                    d="m11.584 13.872 1.752-3.288 1.104-.288a2.7 2.7 0 0 1-.432.576.76.76 0 0 1-.552.24q-.672 0-1.248-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.168.912-.144.504-.576 1.296l-1.92 3.552zm-5.4 0 1.752-3.288 1.08-.288a2.2 2.2 0 0 1-.408.576.76.76 0 0 1-.552.24q-.696 0-1.272-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.144.912-.144.504-.576 1.296L7.96 14.832z"
                                    fill="#fff"
                                />
                            </svg>
                        </div>

                        <p>
                            “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud aliquip”
                        </p>

                        <p className="text-lg text-gray-800 font-medium mt-5">
                            Richard Nelson
                        </p>

                        <p className="text-xs">Content Writer</p>
                    </div>

                    {/* Testimonial 3 */}
                    <div className="flex flex-col items-center bg-white px-3 py-8 rounded-lg border border-gray-300/80 max-w-[272px] text-sm text-center text-gray-500">

                        <div className="relative mb-4">
                            <img
                                className="h-16 w-16 rounded-full"
                                src="https://raw.githubusercontent.com/prebuiltui/prebuiltui/main/assets/userImage/userImage3.png"
                                alt="James Washington"
                            />

                            <svg
                                className="absolute top-0 -right-2"
                                width="22"
                                height="22"
                                viewBox="0 0 22 22"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="10.5" cy="10.5" r="8.5" fill="#2563EB" />
                                <path
                                    d="m11.584 13.872 1.752-3.288 1.104-.288a2.7 2.7 0 0 1-.432.576.76.76 0 0 1-.552.24q-.672 0-1.248-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.168.912-.144.504-.576 1.296l-1.92 3.552zm-5.4 0 1.752-3.288 1.08-.288a2.2 2.2 0 0 1-.408.576.76.76 0 0 1-.552.24q-.696 0-1.272-.576t-.576-1.464q0-.936.624-1.584.648-.672 1.584-.672.888 0 1.536.672.672.648.672 1.584 0 .384-.144.912-.144.504-.576 1.296L7.96 14.832z"
                                    fill="#fff"
                                />
                            </svg>
                        </div>

                        <p>
                            “Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud aliquip”
                        </p>

                        <p className="text-lg text-gray-800 font-medium mt-5">
                            James Washington
                        </p>

                        <p className="text-xs">Content Marketing</p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default Testimonial;