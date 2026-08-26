# 🎓 EduPilot — Your Personal AI Learning Mentor

> AI-powered personalized learning platform that helps students create structured learning roadmaps, master concepts with AI explanations, take adaptive quizzes, and monitor progress — all guided by Google Gemini AI.

Built for the **Horizon Hackathon** 🏆 | Theme: **AI with Education**

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **AI Roadmap Generator** | Personalized weekly learning plans based on goals, pace, and skill level |
| 📚 **Smart AI Lessons** | Gemini-powered explanations with real-world examples and step-by-step guidance |
| 🧠 **Adaptive Quizzes** | AI-generated MCQs with instant scoring and detailed explanations |
| 📊 **Progress Dashboard** | Visual tracking of completion, quiz scores, streaks, and weak topics |
| 🎯 **Smart Recommendations** | AI suggests what to study next based on quiz performance |
| ⚡ **Daily Missions** | Automatic daily learning goals to maintain momentum |

---

## 🏗️ Architecture

```
┌─────────────────────┐     REST API     ┌──────────────────────┐     AI      ┌─────────────────┐
│   Next.js Frontend  │ ◄──────────────► │   FastAPI Backend    │ ◄─────────► │  Google Gemini  │
│   (Vercel)          │                  │   (Render)           │             │  API            │
└─────────────────────┘                  └──────────┬───────────┘             └─────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │     MongoDB          │
                                         │     (Atlas)          │
                                         └──────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** — React framework with App Router
- **TypeScript** — Type-safe development
- **Tailwind CSS** — Utility-first styling
- **Framer Motion** — Smooth animations
- **Recharts** — Beautiful data visualization
- **Lucide React** — Icon system

### Backend
- **FastAPI** — High-performance async Python API
- **Motor** — Async MongoDB driver
- **Pydantic** — Data validation and serialization

### AI
- **Google Gemini 2.0 Flash** — Roadmap generation, topic explanation, quiz creation, recommendations

### Database
- **MongoDB** — Document store for students, roadmaps, quizzes, and progress

---

## 📸 Screenshots

> Screenshots will be added after deployment.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MongoDB (local or Atlas)
- Google Gemini API Key

### 1. Clone the repository
```bash
git clone https://github.com/your-username/edupilot.git
cd edupilot
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your GEMINI_API_KEY and MONGODB_URI

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local if your backend is not on localhost:8000

# Start the dev server
npm run dev
```

### 4. Open the app
Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/generate-roadmap` | Create student + AI-generated roadmap |
| GET | `/api/roadmap/{student_id}` | Fetch student's roadmap |
| GET | `/api/todays-topic/{student_id}` | Get current topic to study |
| POST | `/api/complete-topic` | Mark a topic as completed |
| POST | `/api/explain-topic` | AI explanation for a topic |
| POST | `/api/generate-quiz` | Generate adaptive quiz |
| POST | `/api/submit-quiz` | Submit quiz and get results |
| GET | `/api/dashboard/{student_id}` | Get progress dashboard data |

---

## 📁 Project Structure

```
edupilot/
├── backend/
│   ├── api/              # FastAPI route handlers
│   │   ├── roadmap.py
│   │   ├── learning.py
│   │   ├── quiz.py
│   │   └── dashboard.py
│   ├── models/           # Pydantic data models
│   ├── schemas/          # Request/Response schemas
│   ├── services/         # Business logic
│   │   ├── gemini_service.py    # Gemini AI integration
│   │   ├── roadmap_service.py   # Roadmap CRUD
│   │   ├── quiz_service.py      # Quiz logic
│   │   └── dashboard_service.py # Dashboard aggregation
│   ├── main.py           # FastAPI app entry
│   ├── config.py         # Settings
│   └── database.py       # MongoDB connection
│
├── frontend/
│   └── src/
│       ├── app/          # Next.js pages (App Router)
│       │   ├── page.tsx              # Landing page
│       │   ├── onboarding/           # Student onboarding
│       │   ├── roadmap/[studentId]/  # Roadmap view
│       │   ├── learn/[studentId]/    # AI lesson view
│       │   ├── quiz/[studentId]/     # Adaptive quiz
│       │   └── dashboard/[studentId]/ # Progress dashboard
│       ├── components/   # Reusable UI components
│       │   └── shared/   # GlassCard, GradientText, etc.
│       ├── services/     # API client
│       └── types/        # TypeScript interfaces
│
└── README.md
```

---

## 🗄️ Database Collections

| Collection | Description |
|------------|-------------|
| `students` | Student profiles and preferences |
| `roadmaps` | AI-generated learning roadmaps |
| `sessions` | Learning session records |
| `quizzes` | Generated quiz questions |
| `quiz_results` | Quiz scores and answers |
| `recommendations` | AI-generated study recommendations |

---

## 🔮 Future Scope

- 🔐 Authentication (OAuth/NextAuth)
- 📱 Mobile-responsive PWA
- 🤝 Peer study groups
- 📹 Video content integration
- 🏆 Gamification (badges, leaderboards)
- 💬 AI chat for topic doubts
- 📅 Calendar integration
- 📈 Advanced analytics and learning patterns
- 🌐 Multi-language support

---

## 👥 Team

Built with ❤️ for the **Horizon Hackathon**

---

## 📄 License

MIT License — feel free to use, modify, and distribute.
