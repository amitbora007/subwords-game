# Usage & Developer Operations Guide
## Word Builder Web Arena (Subwords)

| Document Metadata | Details |
| :--- | :--- |
| **Document** | Developer Operations & User Gameplay Guide |
| **Document Version** | 2.0.0 (Web Revamp) |
| **Target Audience** | Developers, Testers, Operators, End Users |
| **Last Updated** | November 2026 |

---

## 1. Prerequisites & Environment Setup

| Component | Minimum Version | Recommended | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | v18.0.0 | v20.x or v22.x LTS | `node -v` |
| **npm** | v9.0.0 | v10.x | `npm -v` |
| **Python** | 3.9+ | 3.11+ / 3.14+ | `python3 --version` |
| **MongoDB** | 5.0+ | MongoDB Community or Atlas | `mongosh --eval "db.runCommand({ping: 1})"` |

---

## 2. Step-by-Step Installation & Quickstart

### 2.1 Backend Execution (FastAPI)

1. **Navigate to the backend directory**:
   ```bash
   cd /home/amit.bora/Downloads/ai/subwords/backend
   ```

2. **Activate the Python virtual environment**:
   ```bash
   source .venv/bin/activate
   ```
   *(If initializing on a new machine: `python3 -m venv .venv && pip install -r requirements.txt`)*

3. **Verify Environment Configuration** (`backend/.env`):
   ```env
   MONGO_URL="mongodb://localhost:27017"
   DB_NAME="subwords_db"
   ```

4. **Launch the FastAPI Server (MVC Architecture)**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
   *(Legacy command `uvicorn server:app` is also supported via compatibility proxy).*
   - **Base URL**: `http://localhost:8000`
   - **Interactive OpenAPI (Swagger)**: `http://localhost:8000/docs`
   - **Health Probe**: `http://localhost:8000/api/`

---

### 2.2 Frontend Execution (ReactJS Web App)

1. **Navigate to the frontend directory** (in a separate terminal):
   ```bash
   cd /home/amit.bora/Downloads/ai/subwords/frontend
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Launch the Vite Development Server**:
   ```bash
   npm run dev
   ```
   - **Web Arena URL**: `http://localhost:5173`
   - Vite automatically proxies `/api` requests to `http://localhost:8000`.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 3. End-User Gameplay Walkthrough

### 3.1 Single Player vs AI Mode
1. Open `http://localhost:5173` in your browser $\to$ Click **"Launch Game"**.
2. Select **"Vs Computer"** mode.
3. Choose difficulty tier:
   - **Easy**: AI claims 3–5 short subwords.
   - **Medium**: AI claims 5–8 mixed subwords.
   - **Hard**: AI claims 8–12 subwords, prioritizing maximum length.
4. Select turn time limit (e.g., 60s) $\to$ Enter your name $\to$ Click **"Enter Arena"**.
5. **Your Turn**:
   - Tap letter tiles or type on your keyboard to form valid subwords from the 6+ letter root.
   - Press **Enter** to submit. Watch your total score compound:
     $$\text{Score} = (\text{Sum of Lengths}) \times (\text{Total Words})$$
   - Click **"Finish Turn Early"** or let the timer expire.
6. **AI Turn (Humanized Real-Time Playback)**:
   - The AI takes its turn live directly on the arena board!
   - Watch the computer contemplate (1.1s–1.9s pauses) and type subwords letter-by-letter with audio clicks.
   - The board tiles decrement remaining letter frequencies dynamically, and Player 2's score compounds in real-time.
   - You can watch the full demonstration or click **"Skip to Results"** at any moment to fast-forward straight to the post-game summary.
7. **Victory Screen**:
   - Final scores and comparative subwords lists are reviewed with celebration confetti!

---

### 3.2 Two Player Arena (Pass & Play)
1. Select **"2 Players"** mode.
2. Select time limit (e.g., 90s) and enter names for Player 1 and Player 2.
3. **Round 1**: Player 1 submits subwords.
4. **Round 2**: Player 2 takes their turn.
   - **Crucial Rule**: Player 2 cannot submit words already claimed by Player 1!
5. **Results**: Winner is declared based on highest compounded score.

---

## 4. Backend REST API Cheat Sheet

### 4.1 Health Check
```bash
curl -X GET http://localhost:8001/api/
```

### 4.2 Create Game (`POST /api/game/create`)
```bash
curl -X POST http://localhost:8001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "player1_name": "Alice",
    "player2_name": "Bob",
    "mode": "pvp",
    "time_limit": 60
  }'
```

### 4.3 Submit Word with Multiplier Scoring & Lockout (`POST /api/game/submit-word`)
```bash
curl -X POST http://localhost:8001/api/game/submit-word \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "YOUR_GAME_ID",
    "word": "planet",
    "player": 1
  }'
```
**Response**:
```json
{
  "valid": true,
  "reason": "Valid word!",
  "word": "planet",
  "length": 6,
  "word_count": 1,
  "base_points": 6,
  "total_score": 6
}
```

### 4.4 Switch Turn (`POST /api/game/switch-turn`)
```bash
curl -X POST http://localhost:8001/api/game/switch-turn \
  -H "Content-Type: application/json" \
  -d '{"game_id": "YOUR_GAME_ID"}'
```

### 4.5 Trigger Computer AI Turn (`POST /api/game/computer-turn`)
```bash
curl -X POST http://localhost:8001/api/game/computer-turn \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "YOUR_GAME_ID",
    "difficulty": "medium"
  }'
```
