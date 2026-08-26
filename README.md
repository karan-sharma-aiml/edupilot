# 🎓 EduPilot

<div align="center">

### 🚀 AI-Powered Personalized Learning Platform

*Learn Smarter • Practice Better • Track Progress*

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=for-the-badge&logo=mongodb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Gemini AI](https://img.shields.io/badge/Google-Gemini%20AI-4285F4?style=for-the-badge&logo=google)

</div>

---

# 📖 Overview

EduPilot is an **AI-powered personalized learning platform** designed to help students learn more efficiently through intelligent roadmaps, AI-generated notes, adaptive quizzes, progress analytics, and an interactive AI Tutor.

Instead of following a one-size-fits-all learning approach, EduPilot creates a personalized learning experience based on each student's goals and progress.

---

# ✨ Key Features

## 🔐 Authentication

- Secure User Registration
- Login System
- JWT Authentication
- Password Reset
- Protected Routes

---

## 🎯 Personalized Learning Roadmap

Generate customized learning paths based on:

- Learning Goal
- Current Skill Level
- Available Study Time
- Preferred Pace

Students receive structured daily learning plans instead of random topics.

---

## 📚 AI Notes Generator

Generate high-quality notes for any topic.

Features include:

- Clean formatting
- Beginner-friendly explanations
- Key concepts
- Important points
- Revision-friendly structure

---

## 🤖 AI Tutor

Students can ask questions naturally.

Example:

> Explain Binary Search with a real-life example.

The AI Tutor provides:

- Instant explanations
- Step-by-step guidance
- Beginner-friendly answers
- Follow-up learning support

---

## 📝 Smart Quiz Engine

Automatically generates quizzes for completed topics.

Features:

- Multiple Choice Questions
- Instant Evaluation
- Score Analysis
- Correct Answers
- Performance Tracking

---

## 📊 Dashboard

Track learning performance using:

- Learning Progress
- Topics Completed
- Quiz Scores
- Daily Learning Status
- Personalized Recommendations

---

## 🎨 Modern User Interface

- Responsive Design
- Dark Theme
- Smooth Animations
- Glassmorphism Components
- Interactive Cards
- Modern Dashboard
- Mobile Friendly

---

# 🏗 System Architecture

```text
                ┌──────────────────────────┐
                │        Frontend          │
                │      Next.js + React     │
                └────────────┬─────────────┘
                             │
                      REST API Calls
                             │
                ┌────────────▼─────────────┐
                │      FastAPI Backend     │
                │ Authentication           │
                │ Roadmap Engine           │
                │ AI Tutor                 │
                │ Notes Generator          │
                │ Quiz Engine              │
                │ Dashboard API            │
                └────────────┬─────────────┘
                             │
          ┌──────────────────┴─────────────────┐
          │                                    │
┌─────────▼─────────┐              ┌──────────▼──────────┐
│     MongoDB       │              │     Gemini AI       │
│ Users             │              │ AI Explanations     │
│ Roadmaps          │              │ Notes               │
│ Progress          │              │ Quizzes             │
│ Quiz Results      │              │ Recommendations     │
└───────────────────┘              └─────────────────────┘
```

---

# 🛠 Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Recharts
- Lucide Icons

---

## Backend

- FastAPI
- Python
- Motor
- Pydantic
- JWT Authentication

---

## Database

- MongoDB

---

## Artificial Intelligence

- Google Gemini API

Used for:

- Topic Explanation
- AI Tutor
- Notes Generation
- Quiz Generation
- Learning Recommendations

---

# 📸 Screenshots

## Landing Page

> *(Add Screenshot Here)*

---

## Dashboard

> *(Add Screenshot Here)*

---

## AI Tutor

> *(Add Screenshot Here)*

---

## Notes Generator

> *(Add Screenshot Here)*

---

## Learning Roadmap

> *(Add Screenshot Here)*

---

## Quiz Module

> *(Add Screenshot Here)*

---

# ⭐ Highlights

- AI-Powered Learning
- Personalized Study Roadmaps
- Interactive AI Tutor
- Smart Notes Generation
- Adaptive Quizzes
- Progress Analytics
- Responsive UI
- Secure Authentication

---

# 🚀 Getting Started

## Prerequisites

Before running EduPilot locally, ensure the following software is installed:

- Node.js 18+
- Python 3.10+
- MongoDB Community Server or MongoDB Atlas
- Git
- Google Gemini API Key

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone https://github.com/karan-sharma-aiml/edupilot.git
cd edupilot
```

---

## 2. Backend Setup

Navigate to the backend folder.

```bash
cd backend
```

Install Python dependencies.

```bash
pip install -r requirements.txt
```

Create a `.env` file using the example.

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY

MONGODB_URI=mongodb://localhost:27017

MONGODB_DB=edupilot

JWT_SECRET_KEY=your_secret_key

JWT_ALGORITHM=HS256
```

Run the backend server.

```bash
py -m uvicorn main:app --reload
```

Backend runs at

```
http://localhost:8000
```

---

## 3. Frontend Setup

Open another terminal.

```bash
cd frontend
```

Install dependencies.

```bash
npm install
```

Create

```
.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run frontend.

```bash
npm run dev
```

Frontend runs at

```
http://localhost:3000
```

---

# 📂 Project Structure

```
EduPilot
│
├── backend
│   ├── api
│   ├── middleware
│   ├── models
│   ├── schemas
│   ├── services
│   ├── tests
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   └── requirements.txt
│
├── frontend
│   ├── public
│   ├── src
│   │   ├── app
│   │   ├── components
│   │   ├── hooks
│   │   ├── services
│   │   ├── styles
│   │   └── types
│   │
│   ├── package.json
│   └── next.config.ts
│
├── README.md
└── .gitignore
```

---

# 🔑 Core Modules

### Authentication

- Register
- Login
- JWT Authentication
- Protected Routes
- Password Reset

---

### AI Tutor

- Ask Questions
- AI Responses
- Topic Assistance

---

### AI Notes Generator

- Generate Notes
- Revision Notes
- Important Points
- Key Concepts

---

### Learning Roadmap

- Personalized Roadmap
- Daily Topics
- Progress Tracking

---

### Quiz Engine

- AI Generated Questions
- Auto Evaluation
- Score Analysis

---

### Dashboard

- Learning Progress
- Quiz Performance
- Recommendations
- Learning Statistics

---

# 📊 Database Collections

| Collection | Purpose |
|------------|---------|
| users | User Accounts |
| roadmaps | Learning Roadmaps |
| quizzes | Quiz Data |
| sessions | Learning Sessions |
| recommendations | AI Recommendations |
| progress | Learning Progress |

---

# 🔒 Security

EduPilot includes:

- JWT Authentication
- Password Hashing
- Protected API Routes
- Request Validation
- Secure Environment Variables
- MongoDB Validation

---

# 📈 Future Improvements

- Voice-based AI Tutor
- AI Interview Preparation
- PDF Notes Export
- Certificate Generation
- Leaderboard
- Gamification
- Study Planner
- Calendar Integration
- Mobile Application
- Offline Learning
- Multi-language Support

---

# 🤝 Contributing

Contributions are welcome.

1. Fork the repository

2. Create a new branch

```bash
git checkout -b feature/your-feature
```

3. Commit changes

```bash
git commit -m "Add new feature"
```

4. Push

```bash
git push origin feature/your-feature
```

5. Create a Pull Request

---

# 🧪 Testing

Backend

```bash
cd backend

pytest
```

Frontend

```bash
npm run lint
```

---

# 🚀 Deployment

Frontend

- Vercel

Backend

- Render / Railway

Database

- MongoDB Atlas

---

# 🌟 Why EduPilot?

Unlike traditional learning platforms, EduPilot combines Artificial Intelligence with personalized education.

Students receive:

- Personalized Roadmaps
- AI Tutor
- Smart Notes
- Adaptive Quizzes
- Progress Analytics
- Intelligent Recommendations

All in one integrated platform.

---

# 👨‍💻 Developed By

**Team EduPilot**

AI-Powered Personalized Learning Platform

---

# 📜 License

This project is licensed under the MIT License.

---

<div align="center">

## ⭐ If you like this project, don't forget to give it a Star ⭐

**Made with ❤️ using Next.js, FastAPI, MongoDB & Google Gemini AI**

</div>
