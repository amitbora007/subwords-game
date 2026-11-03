# Quick Start Guide - Subwords Web Arena (v2.0)

## 📦 What's Included

- **Vite + ReactJS + TypeScript + Tailwind CSS** Web Application
- **FastAPI + Motor (async MongoDB)** Backend Service
- **Single Player (vs AI)** with 3 difficulty levels
- **Two Player (Pass & Play)** with competitor word lockout
- **Compounding Multiplier Scoring Engine**
- **Living Documentation Suite** in `docs/`

---

## ⚡ Quick Setup (3 Minutes)

### Step 1: Start MongoDB
Ensure MongoDB is running locally:
```bash
sudo systemctl start mongod
```

### Step 2: Start Backend (FastAPI)
```bash
cd backend
source .venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```
Keep this terminal open! Backend runs on `http://localhost:8001` with docs at `http://localhost:8001/docs`.

### Step 3: Start Frontend (React Web App)
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser! 🎉

---

## 🎮 How to Play

1. Choose **Vs Computer** or **2 Players** in Setup.
2. Select your turn time limit (30s, 60s, 90s, 120s, 180s).
3. Type or click tiles to form valid English subwords from the 6+ letter root word.
4. Press **Enter** to submit.
5. Score compounds: $\text{Total Score} = (\text{Sum of Word Lengths}) \times (\text{Total Words})$.
6. Locked Words: Words claimed by your competitor cannot be reused!
