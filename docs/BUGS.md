# Bugs, Vulnerabilities & Code Review Audit
## Word Builder Game (Subwords)

| Audit Metadata | Details |
| :--- | :--- |
| **Audit Scope** | Entire Codebase (`backend/`, `frontend/`, Configuration) |
| **Document Version** | 1.0.0 |
| **Status** | Active / Living Issue Tracker |
| **Classification Standard** | CVSS Severity / OWASP Top 10 / Functional Severity |
| **Last Updated** | November 2026 |

---

## 1. Executive Summary & Defect Density

A comprehensive code quality and vulnerability review was conducted across the Word Builder application stack. The audit identified **9 notable defects and architectural vulnerabilities**, categorized as follows:
- **1 Critical Severity** (Credential Exposure)
- **2 High Severity** (External Service Dependency & Access Control Bypass)
- **3 Medium Severity** (UI/UX Logic Glitches, Client-Controlled Game Loops, Unauthoritative Timers)
- **3 Low Severity** (Port Inconsistencies, Limited Vocabulary Pool, Missing Retry Handlers)

```mermaid
pie title Defect Severity Distribution
    "Critical (Security)" : 1
    "High (Reliability / Logic)" : 2
    "Medium (UI / Architecture)" : 3
    "Low (Config / Polish)" : 3
```

---

## 2. Detailed Bug Registry

---

### BUG-001: Committed Sensitive MongoDB Atlas Credentials in Git Repository
- **ID**: `SEC-001`
- **Severity**: **CRITICAL** (CVSS 9.8)
- **Component**: `backend/.env`
- **Detected In Commit**: `291d056` ("initialize project")

#### Description
The production database connection string containing plaintext username and password credentials was committed directly to the Git repository:
```env
MONGO_URL="mongodb+srv://amit:Am!tbora12@cluster0.ryxlm.mongodb.net/?appName=Cluster0"
```
#### Impact
Anyone with read access to the repository can directly connect to the MongoDB Atlas cluster, read all game data, drop collections, or exhaust database capacity.

#### Remediation Status
- **Immediate Action Taken**: Added root `.gitignore` and untracked `backend/.env` and `frontend/.env` via `git rm --cached` in commit `bd9992b`.
- **Pending Action Required**: The database user password for `amit` must be rotated immediately in the MongoDB Atlas Console, and old network IP whitelist entries reviewed.

---

### BUG-002: Single Point of Failure in Word Validation (Missing Local Dictionary Fallback)
- **ID**: `REL-001`
- **Severity**: **HIGH**
- **Component**: `backend/server.py` (`check_dictionary` function, lines 92–102 & 168–169)

#### Description
In `backend/server.py`, user submitted words are verified exclusively via the external API `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`:
```python
async def check_dictionary(word: str) -> bool:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}",
                timeout=5.0
            )
            return response.status_code == 200
    except:
        return False
```
Although `backend/server.py` contains a 2,000+ word dictionary (`VALID_WORDS`), it is **only used for the AI computer player** (`generate_subwords`). It is **never queried** during human word submission!

#### Impact
1. If the server loses internet connectivity or DictionaryAPI.dev is down, all valid human words are rejected.
2. Latency: Every word submission incurs a 100ms–1500ms external network call.

#### Recommended Fix
Implement a hybrid cache lookup: check local `VALID_WORDS` first ($O(1)$ in-memory hash set). If found, validate immediately. If not found, query DictionaryAPI.dev:
```python
async def check_dictionary_hybrid(word: str) -> bool:
    # Tier 1: Check in-memory dictionary
    if word.lower() in VALID_WORDS:
        return True
    # Tier 2: Check external API
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(f"https://api.dictionaryapi.dev/api/v2/entries/en/{word}", timeout=3.0)
            return res.status_code == 200
    except Exception:
        return False
```

---

### BUG-003: Word Submission Endpoint Lacks Player Turn & Game Status Enforcement
- **ID**: `SEC-002` / `LOGIC-001`
- **Severity**: **HIGH**
- **Component**: `backend/server.py` (`/api/game/submit-word`, lines 144–189)

#### Description
The `/api/game/submit-word` endpoint accepts `game_id`, `word`, and `player`. However, it fails to verify whether:
1. The game `status` is currently `"active"`.
2. The `player` passed in the request matches `game["current_player"]`.

#### Impact
- A malicious or out-of-sync client can submit words for Player 1 while it is Player 2's turn.
- A player can continue submitting words after the match has officially finished.

#### Recommended Fix
Insert state checks before scoring:
```python
if game.get("status") != "active":
    return {"valid": False, "reason": "Game has ended", "points": 0}

if input.player != game.get("current_player"):
    return {"valid": False, "reason": "Not your turn", "points": 0}
```

---

### BUG-004: False Winner Highlight on Tie Outcome
- **ID**: `UI-001`
- **Severity**: **MEDIUM**
- **Component**: `frontend/app/results.tsx` (lines 55 & 61)

#### Description
In `frontend/app/results.tsx`:
```tsx
<View style={[styles.playerResult, gameData.player1_score >= gameData.player2_score && styles.winner]}>
...
<View style={[styles.playerResult, gameData.player2_score >= gameData.player1_score && styles.winner]}>
```
When `player1_score === player2_score`, the expression evaluates to `true` for **both** players.

#### Impact
When a game ends in a tie (e.g., 15 to 15), both Player 1 and Player 2 cards receive the glowing gold winner border (`styles.winner`), contradicting the `"It's a Tie!"` header title.

#### Recommended Fix
```tsx
const isP1Winner = gameData.player1_score > gameData.player2_score;
const isP2Winner = gameData.player2_score > gameData.player1_score;

<View style={[styles.playerResult, isP1Winner && styles.winner]}>
...
<View style={[styles.playerResult, isP2Winner && styles.winner]}>
```

---

### BUG-005: Client-Orchestrated Computer Turn Creates Inconsistent State on App Closure
- **ID**: `ARCH-001`
- **Severity**: **MEDIUM**
- **Component**: `frontend/app/game.tsx` (lines 64–103) & `backend/server.py` (lines 320–385)

#### Description
The `/api/game/computer-turn` endpoint only calculates words and returns them as a JSON list. It does not update the database. The frontend React component then runs an iterative loop:
```tsx
for (const wordEntry of computerWords) {
  await new Promise(resolve => setTimeout(resolve, 1500));
  await axios.post(`${BACKEND_URL}/api/game/submit-word`, { ... });
  await fetchGame();
}
await handleEndTurn();
```

#### Impact
If the user's phone locks, app goes into background, or network drops during this loop, the computer's turn stops halfway through, leaving the match in an unrecoverable corrupted state.

#### Recommended Fix
The backend should handle the computer turn atomically in one request, writing words and final score directly to MongoDB, while the frontend simply polls or renders the playback animation.

---

### BUG-006: Unauthoritative Client-Side Turn Timer
- **ID**: `LOGIC-002`
- **Severity**: **MEDIUM**
- **Component**: `frontend/app/game.tsx` (lines 46–62)

#### Description
The 120-second turn limit is enforced strictly via a JavaScript `setInterval` running in the mobile client. The backend does not record a turn start timestamp or reject submissions after 120 seconds.

#### Impact
If a player pauses execution or delays turn switching, they can submit words indefinitely.

#### Recommended Fix
Store `turn_started_at: datetime` in the `Game` document. When `submit-word` is called, verify:
`now() - turn_started_at <= 125 seconds` (including 5s network grace period).

---

### BUG-007: Port and Host Mismatch Across Setup Documentation and Defaults
- **ID**: `CONF-001`
- **Severity**: **LOW**
- **Component**: `README.md`, `QUICKSTART.md`, `frontend/.env.example`

#### Description
- `README.md` and `QUICKSTART.md` instructed running uvicorn on port `8001`: `uvicorn server:app --host 0.0.0.0 --port 8001`.
- `frontend/.env.example` previously defaulted to `http://localhost:8000`.
- Uvicorn's default port when started without `--port` is `8000`.

#### Impact
Developers launching the frontend encounter `"Network request failed"` errors due to port mismatches.

#### Recommended Fix
Standardize on port `8001` across all configurations, documentation, and example files.

---

### BUG-008: Limited Word Bank for Game Initialization
- **ID**: `DATA-001`
- **Severity**: **LOW**
- **Component**: `backend/server.py` (`WORD_LIST`, lines 30–39)

#### Description
The initial `WORD_LIST` contains only 50 words. Repeated plays quickly cycle through the same words.

#### Impact
Reduced player retention and replay value.

#### Recommended Fix
Expand `WORD_LIST` to 500+ curated English words between 6 and 9 letters containing rich subword permutations.

---

### BUG-009: Missing Error State & Infinite Loading Spinner in Results Screen
- **ID**: `UI-002`
- **Severity**: **LOW**
- **Component**: `frontend/app/results.tsx` (lines 29–35)

#### Description
If `fetchGame()` fails (e.g., due to network disconnection), `gameData` remains `null`, leaving the screen trapped in an infinite `"Loading results..."` state with no "Retry" button.

#### Recommended Fix
Introduce an `error` state in `results.tsx` with a retry button and diagnostic alert.

---

## 3. Prioritized Action Plan & Resolution Roadmap

| Priority | Issue ID | Summary | Target Milestone |
| :--- | :--- | :--- | :--- |
| **P0** | `SEC-001` | Rotate MongoDB credentials in Atlas | Immediate |
| **P1** | `REL-001` | Hybrid dictionary lookup (Local + API) | Next Patch |
| **P1** | `SEC-002` | Enforce player turn & game status validation | Next Patch |
| **P2** | `UI-001` | Fix tie outcome winner styling | Next Patch |
| **P2** | `ARCH-001`| Atomic backend computer turn | Future Release |
| **P3** | `LOGIC-002`| Authoritative server turn timestamps | Future Release |
| **P3** | `DATA-001`| Expand base `WORD_LIST` | Future Release |
