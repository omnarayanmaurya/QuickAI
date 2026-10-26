# 🚀 QuickAI — AI-Powered SaaS Platform

QuickAI is a full-stack AI-powered SaaS application that brings multiple AI tools together in one platform. It helps users generate content, review resumes, and edit images through an intuitive web interface.

## 🌐 Live Demo

**[🚀 Visit QuickAI](https://quick-ai-bice-eight.vercel.app)**

## ✨ Features

- ✍️ **AI Article Generation** — Generate articles using AI.
- 📄 **AI Resume Review** — Upload PDF resumes and receive AI-powered feedback.
- 🎨 **AI Image Generation** — Generate images from text prompts.
- 🪄 **Background Removal** — Remove backgrounds from images.
- 🧹 **Object Removal** — Remove unwanted objects from images.
- 📝 **AI Blog Title Generation** — Generate engaging blog titles using AI.
- 🔐 **User Authentication** — Authenticate users and manage access using Clerk.
- ☁️ **Cloud Storage** — Store and manage images using Cloudinary.
- 📱 **Responsive UI** — Access the application through a responsive web interface.

## 🛠️ Tech Stack

### Frontend
- React.js
- Vite
- JavaScript


### Backend
- Node.js
- Express.js
- REST APIs

### Database & Storage
- PostgreSQL (Neon)
- Cloudinary

### Authentication
- Clerk

### AI & External APIs
- Google Gemini API
- Clipdrop API

### Deployment
- Vercel
- GitHub

## 🏗️ Architecture

QuickAI follows a client-server architecture.

1. The React frontend provides the user interface.
2. The Express backend exposes REST API endpoints.
3. Clerk handles user authentication.
4. PostgreSQL stores application data.
5. External AI APIs power content generation and image-processing features.
6. Cloudinary handles image storage and management.
7. Vercel hosts the frontend and backend.

## ⚙️ Getting Started

Follow these instructions to run QuickAI locally.

### Prerequisites

Install the following:

- Node.js and npm
- Git
- A PostgreSQL database
- The API credentials required by the application

### 1. Clone the Repository

```bash
git clone https://github.com/omnarayanmaurya/QuickAI.git
cd QuickAI
