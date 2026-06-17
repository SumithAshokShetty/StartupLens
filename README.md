<!--
---
title: StartupLens
emoji: 🔎
colorFrom: gray
colorTo: indigo
sdk: docker
pinned: false
---
-->
# 🔎 StartupLens: Your Autonomous AI Co-Founder


[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2F%20Vite-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Docker](https://img.shields.io/badge/Docker-Supported-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)


## 📌 Problem Statement
Forty Three percent (43%) of early-stage startups fail, often due to lack of market need, premature scaling, or running out of cash. For founders, validating a new business idea is currently a slow, expensive, and manual process. It requires weeks of tedious competitor analysis, market trend research, customer profiling, and financial modeling. Additionally, founders rarely cross-reference their ideas with historical startup post-mortems to learn why similar businesses in their space failed. This lack of automated, data-driven, and historical verification leads to wasted capital, effort, and high failure rates.

---

## 🚀 Project Overview
**StartupLens** is a premium, AI-powered autonomous co-founder and market intelligence platform designed to validate business concepts instantly. When a user enters a startup idea, StartupLens coordinates parallel multi-agent workflows alongside a semantic vector retrieval database to evaluate the viability of the business model.

### 🌟 Key Features
- **🔐 User Authentication & History Management**: Secured by Supabase. Supports Email/Password signup/login, Google OAuth, and an anonymous Guest Mode. Once authenticated, users can save, pin, delete, search, and browse their entire history of business analyses.
- **📊 Dynamic Viability Scoring**: Assesses concepts based on market entry barriers, timing, and density.
- **🌐 Grounded Web Research**: Uses real-time search grounding to map active competitors and current trends.
- **💀 Failed Startups RAG Analysis**: Queries an internal vector database (ChromaDB) of real-world startup failure post-mortems using **BGE Base (`BAAI/bge-base-en-v1.5`)** embeddings to extract lessons and alert founders of historical pitfalls.
- **⚖️ Hybrid Rerank & Query Expansion**: Enhances retrieval accuracy with domain-specific synonym expansions and an optimized reranking scorer powered by a Cross-Encoder model (**`cross-encoder/ms-marco-MiniLM-L-6-v2`**) coupled with sector mapping priority.
- **🎨 Premium Nebula Theme & 3D Interactive Canvas**: Built with immersive 3D scene layers (using Three.js/Vite), dynamic keyframe loading animations, and collapsible user sidebars.
- **🖨️ PDF investment Memos**: Prints high-contrast, professional analytical summaries for offline distribution.

---

## 📐 System Architecture Diagram
The system separates responsibilities between the React SPA presentation layer and the Python FastAPI orchestration layer, utilizing an embedded vector database for local semantic search and LLMs for grounded synthesis:

![System Architecture](docs/images/architecture.jpg)

---

## 🔄 User Flow Diagram
StartupLens guides the user through entering their startup metadata and coordinates dual workflows to generate real-time metrics alongside vector database retrieval:

![User Flow](docs/images/user_flow.png)

---

## 🛠️ Tech Stack
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Recharts (data visualization), Lucide (iconography), Three.js (immersive animation components).
- **Backend**: Python, FastAPI, Pydantic, Uvicorn, Supabase (authentication and session tracking).
- **RAG & Vector Database**: ChromaDB, LangChain, BGE Embeddings (`BAAI/bge-base-en-v1.5`), MS-MARCO Reranker (`cross-encoder/ms-marco-MiniLM-L-6-v2`).
- **AI Models**: Google Gemini 2.5 Flash (for primary analysis and search grounding) and Llama 3.1 8B (fallback/summarization).

---

## 📁 Repository Structure
```
STARTUPLENS/
├── .vscode/
├── data/
├── docs/
│   ├── images/
│   │   ├── architecture.jpg
│   │   └── user_flow.png
│   ├── API_DOCS.md
│   └── design.md
│
├── frontend/
│   ├── dist/
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   ├── .gitignore
│   ├── eslint.config.js
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
│
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── server.py
│   ├── agents/
│   └── rag/
│
├── evaluation/
│   ├── eval_rag.py
│   ├── rag_accuracy_report.json
│   └── run_notebook_sim.py
│
├── scratch/
│   ├── __pycache__/
│   ├── check_db.py
│   ├── check_docs.py
│   ├── debug_imports.py
│   ├── debug_query_2.py
│   ├── find_agri.py
│   ├── find_jsx.py
│   ├── fix_jsx.py
│   ├── inspect_all.py
│   ├── inspect_rag_response.py
│   ├── test_contrarian.py
│   ├── test_ddg.py
│   ├── test_ddg_simple.py
│   ├── test_json.py
│   ├── test_minimal.py
│   ├── test_output.txt
│   ├── test_query_2.py
│   ├── test_rag.ipynb
│   ├── test_rag_accuracy.py
│   └── test_reranker.py
│
├── .dockerignore
├── .env
├── .gitattributes
├── .gitignore
├── Dockerfile
├── README.md
└── requirements.txt
```

---

## ⚙️ Setup & Installation Instructions

### 📋 Prerequisites
- **Node.js**: v18 or later
- **Python**: v3.10 or later
- **Google Gemini API Key(s)**: At least one is required

### Step 1: Clone the Repository
```bash
git clone https://github.com/sumithshetty2005/StartupLens.git
cd StartupLens
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Add your Gemini API key (supports comma-separated values for automatic key-rotation)
GOOGLE_API_KEYS=AIzaSyYourFirstKey...
GROQ_API_KEY=gsk_your_groq_api_key_here
PORT=8000
```

### Step 3: Initialize the Backend and Vector Store
```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Ingest historical failure dataset into ChromaDB
python -m src.rag.ingestion

# Start the FastAPI server
python src/server.py
```
*The interactive API documentation will be available at `http://localhost:8000/docs`.*

### Step 4: Run the Frontend Application
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` to interact with the web interface.*

---

## 🔗 Project Links
- **Demo Video Link**: [Video Presentation](https://drive.google.com/drive/u/0/folders/1Fiobl0-W6ajw6asrBZznjJ7qF0629BAj)
- **Live Deployed Application**: [https://startup-lens-eight.vercel.app](https://startup-lens-eight.vercel.app/)

---

## 👥 Team Details
- **Team Name**: Code Trekkers
- **Registration ID**: 69c7f0584e029c99f4ecc0e3
- **Team Members**:
  - **Sumith Ashok Shetty**
  - **Pranay Sharma**
  - **Rajdeep Singh**
