# ⚡ TRAINFORGE (FITAPP) - Elite Fitness Ecosystem

**TRAINFORGE** is a next-generation fitness platform designed for athletes who demand the best. Combining a mobile-first philosophy with cutting-edge AI, it provides a comprehensive suite of tools to track progress, optimize nutrition, and crush fitness goals.

---

## 🏗️ Architecture Overview

The project is divided into three main pillars:

### 1. 📱 Mobile App (`/frontend`)
*   **Technology**: React Native + Expo.
*   **Purpose**: The primary interface for users on the go. High-performance, cross-platform mobile experience.
*   **Key Features**: Real-time workout tracking, push notifications, and offline support.

### 2. 💻 Web App (`/web-app`)
*   **Technology**: React 19 + TypeScript + Vite + Bootstrap 5.
*   **Aesthetics**: Premium dark/light mode system with glassmorphism effects and smooth micro-animations.
*   **Purpose**: Dashboard for detailed analysis, exercise exploration, and routine management.
*   **Features**:
    *   **Exercise Gallery**: Searchable database of 1300+ techniques.
    *   **Routine Builder**: Create and manage personalized workout plans.
    *   **AI Coach Integration**: Floating AI assistant to generate routines on the fly.
    *   **Responsive Design**: Optimized for all devices (0.85x scale for professional density).

### 3. ⚙️ Backend API (`/backend`)
*   **Technology**: FastAPI (Python) + MongoDB (Motor).
*   **Core Logic**:
    *   **JWT Security**: Robust authentication system with encrypted sessions.
    *   **AI Nutrition Engine**: Personalized dietary advice powered by LLMs (OpenAI/Groq).
    *   **Smart Warmup Generator**: Context-aware warmup routines based on workout types.
    *   **Achievement System**: Gamified progress tracking (streaks, total workouts).
    *   **Rate Limiting**: Protected endpoints using SlowAPI.

---

## 🚀 Key Features

| Feature | Description |
| :--- | :--- |
| **🤖 AI Coach** | Chat with an intelligent coach that understands your progress and builds routines. |
| **🏋️ 1300+ Exercises** | Comprehensive library with GIFs, instructions, and target muscle groups. |
| **🏆 Gamification** | Earn achievements and maintain streaks to stay motivated. |
| **🌓 Dynamic Theme** | Seamless switching between High-Contrast Dark Mode and Clean Light Mode. |

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, React Native, Expo.
*   **Styling**: Bootstrap 5, Lucide-React, Vanilla CSS (Glassmorphism).
*   **Backend**: Python 3.x, FastAPI, Pydantic, Motor (Async MongoDB).
*   **AI**: OpenAI API / Groq (Llama-3), emergentintegrations.
*   **DevOps**: ESLint, TypeScript-ESLint, Pytest, Dotenv.

---

## 📂 Project Structure

```text
FITAPP/
├── backend/            # FastAPI Server & Business Logic
│   ├── server.py       # Main API entry point (1500+ lines of logic)
│   └── requirements.txt
├── web-app/            # Premium React Web Dashboard
│   ├── src/
│   │   ├── components/ # Reusable UI Components
│   │   └── App.tsx     # Main application & routing logic
│   └── package.json
├── frontend/           # React Native Mobile Application
│   └── app/            # Expo Router structure
├── tests/              # Comprehensive test suites
└── README.md           # This file
```

---

## 🛠️ Getting Started

### Backend
1. `cd backend`
2. `pip install -r requirements.txt`
3. Configure `.env` (MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY)
4. `uvicorn server:app --reload`

### Web App
1. `cd web-app`
2. `npm install`
3. `npm run dev`

---

Built with ❤️ by **Arturex919** & **Antigravity**.
*"Forja tu destino. Built for Greatness."*
