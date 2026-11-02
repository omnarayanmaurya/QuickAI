# ⚡ QuickAI — AI-Powered SaaS Platform

**QuickAI** is a full-stack AI-powered SaaS platform that brings multiple AI tools together in one application. It helps users generate written content, create images, review resumes, and edit images using AI-powered services.

Built with **React.js, Node.js, Express.js, PostgreSQL, Clerk, and AI APIs**, QuickAI provides an intuitive interface with authentication, usage limits, and premium features.

---

## 🌐 Live Demo

🔗 **Live Application:** https://quick-ai-bice-eight.vercel.app/

💻 **GitHub Repository:** https://github.com/omnarayanmaurya/QuickAI

---

## 📸 Screenshots

<!-- Add your screenshots to a folder named screenshots in the repository -->

### 🏠 Home Page

![QuickAI Home Page](screenshots/home.png)

### 📝 AI Article Writer

![AI Article Writer](screenshots/article-writer.png)

### 🎨 AI Image Generation

![AI Image Generation](screenshots/image-generation.png)

### 📄 Resume Review

![Resume Review](screenshots/resume-review.png)

### 🖼️ Background Removal

![Background Removal](screenshots/background-removal.png)

---

## ✨ Features

### 🤖 AI-Powered Tools

* **AI Article Writer:** Generate articles from user-provided topics and prompts.
* **Blog Title Generator:** Generate creative and engaging blog titles.
* **AI Image Generation:** Generate images using text prompts.
* **Background Removal:** Remove image backgrounds using AI-powered image processing.
* **Object Removal:** Remove unwanted objects from images.
* **AI Resume Review:** Upload a resume and receive AI-powered feedback and suggestions.

### 🔐 Authentication & User Management

* Secure user authentication using Clerk.
* User-specific access to application features.
* Free usage limits for users.
* Premium feature restrictions and access control.

### 🗄️ Data Management

* PostgreSQL database integration using Neon.
* Store and manage application data.
* Cloudinary integration for image storage and management.

### ⚙️ Application Features

* Responsive and user-friendly interface.
* RESTful API architecture.
* Separate frontend and backend applications.
* API integration with external AI services.
* Usage tracking and request handling.

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* React Router
* Axios
* Clerk Authentication

### Backend

* Node.js
* Express.js
* REST APIs
* Multer
* PDF-Parse
* Clerk Middleware

### Database & Storage

* PostgreSQL
* Neon Database
* Cloudinary

### AI & External Services

* Google Gemini API
* Clipdrop API

### Deployment & Tools

* Vercel
* Git
* GitHub
* Postman

---

## 🏗️ Project Architecture

QuickAI follows a client-server architecture.

```text
                 ┌──────────────────────┐
                 │      User             │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │   React Frontend      │
                 │   Vite + Tailwind     │
                 └──────────┬───────────┘
                            │
                            │ HTTP Requests
                            ▼
                 ┌──────────────────────┐
                 │   Express Backend    │
                 │     Node.js          │
                 └──────────┬───────────┘
                            │
              ┌─────────────┼──────────────┐
              │             │              │
              ▼             ▼              ▼
       ┌────────────┐ ┌────────────┐ ┌────────────┐
       │ Gemini API │ │ Clipdrop   │ │ Clerk      │
       │            │ │ API        │ │ Auth       │
       └────────────┘ └────────────┘ └────────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │  Neon PostgreSQL     │
                 │  Cloudinary Storage  │
                 └──────────────────────┘
```

---

## 📂 Project Structure

```text
QuickAI/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── configs/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── README.md
```

*The structure above is representative; adjust folder names if they differ from your current repository.*

---

## 🚀 Getting Started

Follow these steps to run QuickAI locally.

### 1. Clone the Repository

```bash
git clone https://github.com/omnarayanmaurya/QuickAI.git
```

### 2. Navigate to the Project

```bash
cd QuickAI
```

### 3. Setup the Backend

```bash
cd server
npm install
```

Create a `.env` file in the server directory and configure your environment variables.

```env
PORT=5000

DATABASE_URL=your_neon_database_url

CLERK_SECRET_KEY=your_clerk_secret_key

GEMINI_API_KEY=your_gemini_api_key

CLIPDROP_API_KEY=your_clipdrop_api_key

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

CLIENT_URL=http://localhost:5173
```

Start the backend:

```bash
npm run server
```

### 4. Setup the Frontend

Open another terminal:

```bash
cd client
npm install
```

Create a `.env` file in the client directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

VITE_BASE_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

### 5. Open the Application

Visit:

```text
http://localhost:5173
```

**Note:** The environment variable names above are a setup reference. Match them with the exact names used in your source code before running the application.

---

## 🔑 Third-Party Services

QuickAI uses the following external services:

| Service       | Purpose                              |
| ------------- | ------------------------------------ |
| Clerk         | Authentication and user management   |
| Neon          | PostgreSQL database hosting          |
| Google Gemini | AI text generation and resume review |
| Clipdrop      | AI-powered image processing          |
| Cloudinary    | Image storage and management         |
| Vercel        | Frontend and backend deployment      |

---

## ☁️ Deployment

QuickAI is deployed using Vercel.

| Component      | Deployment      |
| -------------- | --------------- |
| Frontend       | Vercel          |
| Backend        | Vercel          |
| Database       | Neon PostgreSQL |
| Image Storage  | Cloudinary      |
| Authentication | Clerk           |

### Deployment Configuration

* Configure frontend and backend environment variables in Vercel.
* Set the frontend API base URL to the deployed backend URL.
* Configure the backend's allowed frontend origin.
* Add the production frontend URL to the backend's `CLIENT_URL`.
* Keep all secret API keys in backend environment variables.

---

## 🔒 Security

* Clerk-based authentication.
* Protected backend routes.
* Environment variables for sensitive credentials.
* Server-side API integrations.
* Usage restrictions for free and premium features.
* CORS configuration for frontend-backend communication.

---

## 🔮 Future Enhancements

* AI-powered website builder.
* More AI writing and productivity tools.
* Improved AI-generated content customization.
* Enhanced user dashboard and usage analytics.
* Additional premium subscription capabilities.
* More advanced image editing tools.

---

## 👨‍💻 Developer

**Om Narayan Maurya**

B.Tech Computer Science & Engineering

* GitHub: https://github.com/omnarayanmaurya
* LinkedIn: https://www.linkedin.com/in/om-narayan-maurya-70886b308/

---

## 📄 License

This project is developed for learning and portfolio purposes.

---

⭐ If you find this project interesting, consider giving the repository a star!
