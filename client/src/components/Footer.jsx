import React from 'react';
import { assets } from '../assets/assets';
const Footer = () => {
  return (
    <footer className="px-6 md:px-16 lg:px-24 xl:px-32 pt-8 w-full text-gray-500">
      <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500/30 pb-6">

        {/* Company information */}
        <div className="md:max-w-96">
          {/* Paste your SVG logo here */}
          <img src={assets.logo} alt="" />

          <p className="mt-6 text-sm">
            QuickAI helps you create content, generate images, and improve your
            workflow with powerful AI tools.
          </p>
        </div>

        {/* Company links and newsletter */}
        <div className="flex-1 flex flex-col sm:flex-row items-start md:justify-end gap-10 sm:gap-20">

          <div>
            <h2 className="font-semibold mb-5 text-gray-800">
              Company
            </h2>

            <ul className="text-sm space-y-2">
              <li><a href="/" className="hover:text-primary">Home</a></li>
              <li><a href="/about" className="hover:text-primary">About us</a></li>
              <li><a href="/contact" className="hover:text-primary">Contact us</a></li>
              <li><a href="/privacy" className="hover:text-primary">Privacy policy</a></li>
            </ul>
          </div>

          <div className="w-full sm:max-w-sm">
            <h2 className="font-semibold text-gray-800 mb-5">
              Subscribe to our newsletter
            </h2>

            <div className="text-sm space-y-2">
              <p>
                The latest AI news, articles, and resources, sent to your inbox.
              </p>

              <form
                className="flex items-center gap-2 pt-4"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  className="border border-gray-500/30 placeholder-gray-500 focus:ring-2 focus:ring-indigo-600 outline-none w-full max-w-64 h-9 rounded px-2"
                  type="email"
                  placeholder="Enter your email"
                  aria-label="Email address"
                  required
                />

                <button
                  type="submit"
                  className="bg-blue-600 px-3 h-9 text-white rounded hover:bg-blue-700 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      <p className="pt-4 text-center text-xs md:text-sm pb-5">
        Copyright {new Date().getFullYear()} © QuickAI. All Rights Reserved.
      </p>
    </footer>
  );
};

export default Footer;