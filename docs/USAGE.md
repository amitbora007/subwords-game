# Usage & Developer Operations Guide
## Word Builder Game (Subwords)

| Document Metadata | Details |
| :--- | :--- |
| **Document** | Developer Operations & User Gameplay Guide |
| **Document Version** | 1.0.0 |
| **Target Audience** | Developers, Testers, Operators, End Users |
| **Last Updated** | November 2026 |

---

## 1. Prerequisites & Environment Setup

Before starting the application, ensure the following dependencies are installed on your host machine:

| Component | Minimum Version | Recommended | Verification Command |
| :--- | :--- | :--- | :--- |
| **Node.js** | v16.0.0 | v18.x or v20.x LTS | `node -v` |
| **npm / yarn** | npm v8+ / yarn v1.22+ | yarn v1.22.x | `yarn -v` or `npm -v` |
| **Python** | 3.8+ | 3.10+ / 3.11+ | `python3 --version` |
| **MongoDB** | 5.0+ | MongoDB Atlas or Local 7.0 | `mongod --version` or `mongosh` |
| **Expo Go** | Latest | iOS App Store / Google Play Store | Mobile Device |

---

## 2. Step-by-Step Installation & Launch

### 2.1 Clone & Directory Structure
```bash
cd /home/amit.bora/Downloads/ai/subwords
```

---

### 2.2 Backend Setup & Execution

1. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

2. **Create and activate a Python virtual environment** (recommended):
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Create or verify `backend/.env`:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=subwords_db
   ```
   *(If using MongoDB Atlas, replace with your authenticated SRV connection string).*

5. **Start the FastAPI server**:
   ```bash
   uvicorn server:app --host 0.0.0.0 --port 8001 --reload
   ```
   - **Local URL**: `http://localhost:8001`
   - **Interactive API Documentation (Swagger)**: `http://localhost:8001/docs`
   - **Health Check**: `http://localhost:8001/api/`

---

### 2.3 Frontend Setup & Execution

1. **Navigate to the frontend directory** (in a separate terminal):
   ```bash
   cd ../frontend
   ```

2. **Install JavaScript dependencies**:
   ```bash
   yarn install
   # or: npm install
   ```

3. **Configure Environment Variables**:
   Create or verify `frontend/.env`:
   
   To test on a physical mobile device, replace `localhost` with your computer's **Local LAN IP address**:
   - **Mac/Linux**: `ifconfig | grep "inet " | grep -v 127.0.0.1`
   - **Windows**: `ipconfig` (look for IPv4 Address, e.g. `192.168.1.15`)

   ```env
   EXPO_PUBLIC_BACKEND_URL=http://192.168.1.15:8001
   ```

4. **Launch the Expo Development Server**:
   ```bash
   npx expo start
   ```

---

### 2.4 Testing on Devices & Simulators

- **Physical Mobile Phone (iOS / Android)**:
  1. Open the **Expo Go** app.
  2. Ensure your phone is connected to the **same WiFi network** as your computer.
  3. Scan the terminal QR code (Camera app on iOS, Expo Go scanner on Android).
- **iOS Simulator (macOS only)**: Press `i` in the Expo terminal.
- **Android Emulator**: Press `a` in the Expo terminal.
- **Web Browser**: Press `w` in the Expo terminal (`http://localhost:8081`).

---

## 3. Configuration Reference

### 3.1 Backend Environment Variables (`backend/.env`)

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `MONGO_URL` | `mongodb://localhost:27017` | MongoDB connection string (supports local standalone or Atlas clusters). |
| `DB_NAME` | `subwords_db` | Target MongoDB database name for storing game documents. |

### 3.2 Frontend Environment Variables (`frontend/.env`)

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_BACKEND_URL` | `http://192.168.1.15:8001` | Base REST API URL exposed to the React Native runtime. |

---

## 4. End-User Gameplay Walkthrough

### 4.1 Player vs Player (PvP) Pass-and-Play
1. Launch app $\to$ Tap **"Start New Game"**.
2. Select **"Player vs Player"** mode.
3. Enter names for **Player 1** and **Player 2** (e.g., "Alice" and "Bob") $\to$ Tap **"Start Game"**.
4. **Round 1 (Player 1 Turn)**:
   - Alice reviews the bold uppercase **Main Word** (e.g., `PLANET`).
   - Alice has **120 seconds** to type subwords (e.g., `plane`, `plate`, `late`, `net`) and taps the checkmark submit button.
   - Valid words instantly award points equal to word length ($L \ge 3$).
   - Alice taps **"End Turn"** when finished.
5. **Turn Transition**:
   - An alert indicates turn handoff: *"Bob's turn now!"*.
   - Device is passed to Bob.
6. **Round 2 (Player 2 Turn)**:
   - Bob plays his 120-second turn with the same main word.
   - Bob submits words and taps **"End Turn"**.
7. **Results Screen**:
   - The winner is declared with a golden trophy.
   - Side-by-side score breakdown and word lists are reviewed.
   - Players can tap **"Play Again"** for a new base word or return **"Home"**.

### 4.2 Player vs Computer (PvC) AI Mode
1. Tap **"Start New Game"** $\to$ Select **"Player vs Computer"**.
2. Select difficulty:
   - **Easy**: 3–5 short words (3–4 letters).
   - **Medium**: 5–8 mixed-length words.
   - **Hard**: 8–12 words (maximizes length).
3. Enter your player name $\to$ Tap **"Start Game"**.
4. Play your 120-second turn as Player 1 $\to$ Tap **"End Turn"**.
5. The screen displays the **"Computer is thinking..."** overlay.
6. The AI bot realistically submits its words with visual delays.
7. Final results are calculated and presented automatically.

---

## 5. Backend REST API Reference & Developer Cheat Sheet

All endpoints are prefixed with `/api`.

### 5.1 Health Probe
```bash
curl -X GET http://localhost:8001/api/
```
**Response**:
```json
{"message": "Word Game API"}
```

---

### 5.2 Create Game (`POST /api/game/create`)
```bash
curl -X POST http://localhost:8001/api/game/create \
  -H "Content-Type: application/json" \
  -d '{
    "player1_name": "Alice",
    "player2_name": "Bob",
    "mode": "pvp"
  }'
```
**Response**:
```json
{
  "id": "c71a39f0-2f91-4e4b-9742-f8eb04e22dc7",
  "main_word": "planet",
  "player1_name": "Alice",
  "player2_name": "Bob",
  "current_player": 1,
  "player1_words": [],
  "player2_words": [],
  "player1_score": 0,
  "player2_score": 0,
  "status": "active",
  "round": 1,
  "mode": "pvp",
  "difficulty": null,
  "created_at": "2026-11-03T06:15:00.000Z"
}
```

---

### 5.3 Submit Word (`POST /api/game/submit-word`)
```bash
curl -X POST http://localhost:8001/api/game/submit-word \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "c71a39f0-2f91-4e4b-9742-f8eb04e22dc7",
    "word": "plan",
    "player": 1
  }'
```
**Response (Success)**:
```json
{
  "valid": true,
  "reason": "Valid word!",
  "points": 4
}
```
**Response (Failure)**:
```json
{
  "valid": false,
  "reason": "Word cannot be formed from main word",
  "points": 0
}
```

---

### 5.4 Switch Turn (`POST /api/game/switch-turn`)
```bash
curl -X POST http://localhost:8001/api/game/switch-turn \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "c71a39f0-2f91-4e4b-9742-f8eb04e22dc7"
  }'
```
**Response**:
```json
{
  "success": true,
  "next_player": 2,
  "status": "active"
}
```

---

### 5.5 Trigger Computer Turn (`POST /api/game/computer-turn`)
```bash
curl -X POST http://localhost:8001/api/game/computer-turn \
  -H "Content-Type: application/json" \
  -d '{
    "game_id": "c71a39f0-2f91-4e4b-9742-f8eb04e22dc7",
    "difficulty": "medium"
  }'
```
**Response**:
```json
{
  "words": [
    {"word": "net", "valid": true, "points": 3},
    {"word": "plan", "valid": true, "points": 4},
    {"word": "plant", "valid": true, "points": 5}
  ],
  "total_score": 12,
  "count": 3
}
```

---

## 6. Diagnostic & Troubleshooting Runbook

### Issue 1: "Network request failed" in Expo Go
- **Cause**: Mobile phone cannot reach your computer's local IP address or firewall is blocking port 8001.
- **Solution**:
  1. Confirm your computer and phone are on the exact same WiFi network (disable VPNs/guest networks).
  2. Verify your IP using `ifconfig` and update `frontend/.env`.
  3. Test connectivity in your phone's browser: navigate to `http://YOUR_LOCAL_IP:8001/api/`. You should see `{"message": "Word Game API"}`.

### Issue 2: Port 8001 Already in Use
- **Cause**: An orphaned `uvicorn` process is still binding port 8001.
- **Solution**:
  ```bash
  # Linux / macOS
  lsof -ti:8001 | xargs kill -9
  ```

### Issue 3: MongoDB Connection Refused
- **Cause**: Local MongoDB daemon is not running.
- **Solution**:
  ```bash
  # Linux (systemd)
  sudo systemctl start mongod
  sudo systemctl status mongod
  
  # macOS
  brew services start mongodb-community
  ```

### Issue 4: Stale Expo Bundler Cache
- **Cause**: React Native bundler serving cached JavaScript bundle.
- **Solution**:
  ```bash
  cd frontend
  npx expo start -c
  ```
