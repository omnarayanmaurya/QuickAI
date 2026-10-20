import React, { useState } from 'react';
import Markdown from 'react-markdown'
const CreationItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            onClick={() => setExpanded(!expanded)}
            className="p-4 max-w-5xl text-sm bg-white border border-gray-200 rounded-lg cursor-pointer"
        >
            {/* Prompt and creation type */}
            <div className="flex justify-between items-center gap-4">
                <div>
                    <h2>{item.prompt}</h2>

                    <p className="text-gray-500">
                        {item.type} - {new Date(item.created_at).toLocaleDateString()}
                    </p>
                </div>

                <button className="bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF] px-4 py-1 rounded-full">
                    {item.type}
                </button>
            </div>

            {/* Expanded content */}
            {expanded && (
                <div className="mt-3">
                    {item.type === 'image' ? (
                        <div>
                            <img
                                src={item.content}
                                className="mt-3 w-full max-w-md rounded-lg"
                                alt="Generated image"
                            />
                        </div>
                    ) : (
                        <div className="mt-3 max-h-96 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
                            <div className='reset-tw'>
                                <Markdown>
                                {item.content}
                            </Markdown>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreationItem;