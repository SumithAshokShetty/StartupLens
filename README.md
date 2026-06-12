---
title: StartupLens
emoji: 🔍
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

# 🔎 StartupLens: Your Autonomous AI Co-Founder

StartupLens (formerly FounderLens) is a premium, AI-powered market intelligence platform designed to validate business concepts, compute financials, detect strategic threats, and cross-reference ideas with historical failed startup cases using **Retrieval-Augmented Generation (RAG)**.

By deploying autonomous AI agents, StartupLens turns raw ideas into data-driven strategic investment memos in seconds, saving founders from the expensive validation phases of early business development.

---

## 🌟 Key Features

*   **📊 Dynamic Viability Score**: Evaluates any startup idea on a scale of 0-100 based on market density, barriers to entry, and timing.
*   **🌐 Grounded Web Research**: Leverages Google Search grounding tools inside the LLM context to analyze live competitors, market share, and key trends.
*   **💀 Failed Startups RAG Engine**: Instantly queries an internal database of real-world startup failures using keyword-vector similarity matching. Shows founders what failed in their exact space and how to avoid the same fate.
*   **⚖️ Trust & Methodology Panel**: Includes a high-contrast explanation modal breaking down the mathematical logic, average multipliers, and risk scoring used by the model.
*   **💳 Demo Pricing Modal**: A built-in subscription model mockup representing pricing tiers ($20/month).
*   **🖨️ PDF investment Memos**: Print-friendly layouts styled with high-contrast text and clean graphics for seamless report downloads.
*   **🔑 API Key Auto-Shifting**: Supports hot-reloading keys from `.env` on-the-fly and automatically shifts between a list of multiple Gemini API keys if one hits rate limits, with a final fallback to Groq (`llama-3.1-8b-instant`).

---

## 🛠️ Technology Stack

*   **Frontend**: React (Vite), TypeScript, Tailwind CSS (modern glassmorphic design), Recharts (charts).
*   **Backend**: Python Flask/Uvicorn, Pandas (vector data matching).
*   **AI Models**: Google Gemini 2.5 Flash (primary reasoning & grounded search), Groq Llama 3.1 8B (fallback model).

---

## 🚀 Local Installation & Run Guide

### 📋 Prerequisites
*   Node.js (v18+)
*   Python 3.10+
*   Google Gemini API Key(s)
*   Groq API Key (Optional, for fallback)

### Step 1: Clone the Repository
```bash
git clone https://github.com/sumithshetty2005/StartupLens.git
cd StartupLens
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root folder:
```env
GOOGLE_API_KEYS=AIzaSyYourFirstKey...,AIzaSyYourSecondKey...
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### Step 3: Run the Backend
From the root directory:
```bash
# Install dependencies
pip install -r requirements.txt

# Start Flask Server (runs on port 7860)
python -m src.server
```

### Step 4: Run the Frontend
In a new terminal window:
```bash
cd frontend

# Install package dependencies
npm install

# Start Vite React server (runs on port 5173)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## ☁️ Cloud Deployment Guide (Free Tier)

StartupLens is structured to run separately in the cloud to easily bypass free-tier size limits:

### 1. Backend (Hugging Face Spaces - Free Docker Hosting)
1. Go to Hugging Face and create a **New Space**.
2. Select **Docker** as the SDK, and choose the **Blank** template.
3. Upload the root-level files (`Dockerfile`, `.dockerignore`, `requirements.txt`, `src/`, and `data/` folder).
4. Go to **Settings > Variables and secrets** in your space, and add your `GOOGLE_API_KEYS` and `GROQ_API_KEY`.
5. Copy your running Space URL (e.g. `https://username-space-name.hf.space`).

### 2. Frontend (Vercel - Free Static Hosting)
1. Link your repository in Vercel.
2. Select `frontend` as the **Root Directory**.
3. Under Environment Variables, add:
    *   **Key**: `VITE_API_BASE_URL`
    *   **Value**: `https://username-space-name.hf.space` (your Hugging Face Space URL)
4. Deploy!
