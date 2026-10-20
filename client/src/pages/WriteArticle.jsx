import React, { useState } from 'react';
import { Sparkles, Edit } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import Markdown from 'react-markdown';

axios.defaults.baseURL = import.meta.env.VITE_BASE_URL;

const WriteArticle = () => {
  // Available article lengths
  const articleLength = [
    { length: 800, text: 'Short (500–800 words)' },
    { length: 1200, text: 'Medium (800–1200 words)' },
    { length: 1600, text: 'Long (1200+ words)' },
  ];

  // State variables
  const [selectedLength, setSelectedLength] = useState(articleLength[0]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');

  // Clerk authentication
  const { getToken } = useAuth();

  // Handle article generation
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error('Please enter an article topic.');
      return;
    }

    try {
      setLoading(true);
      setContent('');

      // Create the prompt
      const prompt = `Write an article about ${input.trim()} in approximately ${selectedLength.length} words. Use appropriate headings, subheadings, paragraphs, and bullet points where necessary. Return the article in Markdown format.`;

      // Get authentication token
      const token = await getToken();

      if (!token) {
        toast.error('Please sign in to generate an article.');
        return;
      }

      // Call backend API
      const { data } = await axios.post(
        '/api/ai/generate-article',
        {
          prompt,
          length: selectedLength.length,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Handle API response
      if (data.success) {
        setContent(data.content);
        toast.success('Article generated successfully!');
      } else {
        toast.error(data.message || 'Failed to generate article.');
      }
    } catch (error) {
      console.error('Article generation error:', error);

      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Something went wrong while generating the article.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-scroll p-6 flex items-start flex-wrap gap-4 text-slate-700">

      {/* Left Column: Article Configuration */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200"
      >
        {/* Heading */}
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 text-[#4A7AFF]" />

          <h1 className="text-xl font-semibold">
            Article Configuration
          </h1>
        </div>

        {/* Article Topic */}
        <p className="mt-6 text-sm font-medium">
          Article Topic
        </p>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 px-3 mt-2 outline-none text-sm rounded-md border border-gray-300"
          placeholder="The future of artificial intelligence..."
          required
        />

        {/* Article Length */}
        <p className="mt-4 text-sm font-medium">
          Article Length
        </p>

        <div className="mt-3 flex gap-3 flex-wrap">
          {articleLength.map((item) => (
            <button
              key={item.length}
              type="button"
              onClick={() => setSelectedLength(item)}
              className={`text-xs px-4 py-1 border rounded-full cursor-pointer ${
                selectedLength.length === item.length
                  ? 'bg-blue-50 text-blue-700 border-blue-300'
                  : 'text-gray-500 border-gray-300'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          disabled={loading}
          type="submit"
          className="w-full flex justify-center items-center gap-2 mt-6 px-4 py-2 text-sm text-white rounded-md bg-gradient-to-r from-[#3588F2] to-[#4A7AFF] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-4 h-4 my-1 rounded-full border-2 border-white border-t-transparent animate-spin" />
          ) : (
            <Sparkles className="w-4" />
          )}

          {loading ? 'Generating...' : 'Generate Article'}
        </button>
      </form>

      {/* Right Column: Generated Article */}
      <div className="w-full max-w-lg p-4 bg-white rounded-lg border border-gray-200 min-h-96 flex flex-col">

        {/* Heading */}
        <div className="flex items-center gap-3">
          <Edit className="w-5 h-5 text-[#4A7AFF]" />

          <h1 className="text-xl font-semibold">
            Generated Article
          </h1>
        </div>

        {/* Article Output */}
        {!content && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Edit className="w-10 h-10 text-[#4A7AFF] mb-3" />

            <p className="text-sm text-gray-400 text-center">
              Your generated article will appear here.
            </p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <span className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-[#4A7AFF] animate-spin" />

            <p className="text-sm text-gray-400 mt-3 text-center">
              Generating your article. Please wait...
            </p>
          </div>
        ) : (
          <div className="mt-4 max-h-[600px] overflow-y-auto text-sm text-slate-600">
            <div className="reset-tw">
              <Markdown
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-2xl font-bold mt-5 mb-3 text-slate-800">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-xl font-semibold mt-5 mb-2 text-slate-800">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-lg font-semibold mt-4 mb-2 text-slate-800">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-3 leading-7">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-6 mb-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-6 mb-4 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-6">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-800">
                      {children}
                    </strong>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-300 pl-4 italic my-4">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">
                      {children}
                    </code>
                  ),
                  hr: () => (
                    <hr className="my-5 border-gray-200" />
                  ),
                }}
              >
                {content}
              </Markdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WriteArticle;