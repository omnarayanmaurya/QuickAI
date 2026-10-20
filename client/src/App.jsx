import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import Home from './pages/Home';
import Layout from './pages/Layout';
import DashBoard from './pages/Dashboard';
import WriteArticles from './pages/WriteArticle';
import BlogTitles from './pages/BlogTitle';
import GenerateImages from './pages/GenerateImages';
import RemoveBackground from './pages/RemoveBackground';
import RemoveObject from './pages/RemoveObject';
import ReviewResume from './pages/ReviewResume';
import Community from './pages/Community';
import { Toaster } from 'react-hot-toast';

const App = () => {
  
  return (
    <div>
      <Toaster/>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/ai" element={<Layout />}>
          <Route index element={<DashBoard />} />
          <Route path="write-articles" element={<WriteArticles />} />
          <Route path="blog-titles" element={<BlogTitles />} />
          <Route path="generate-images" element={<GenerateImages />} />
          <Route path="remove-background" element={<RemoveBackground />} />
          <Route path="remove-object" element={<RemoveObject />} />
          <Route path="review-resume" element={<ReviewResume />} />
          <Route path="community" element={<Community />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;