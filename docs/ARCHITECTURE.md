# System Architecture Document
## Word Builder Game (Subwords)

| Document Control | Details |
| :--- | :--- |
| **System** | Word Builder (Subwords) System Architecture |
| **Architecture Version** | 1.0.0 |
| **Architecture Pattern** | Decoupled Client-Server (Mobile SPA + Asynchronous REST API) |
| **Document Status** | Approved / Living Document |
| **Last Updated** | November 2026 |

---

## 1. Architectural Overview & Context

Word Builder follows a modern decoupled client-server architecture. The presentation layer is an Expo-powered React Native mobile application, communicating over an asynchronous JSON REST API with a FastAPI (Python) backend service. Persistent game state is stored in MongoDB via Motor (asynchronous driver), with dual-tier lexical validation utilizing both an in-memory dictionary and the Free Dictionary API.

```mermaid
graph TB
    subgraph "Client Layer (Mobile / Web)"
        UI[React Native Expo App]
        ER[Expo Router Stack]
        Axios[Axios HTTP Client]
        UI --> ER
        UI --> Axios
    end

    subgraph "Network & Gateway Layer"
        CORS[Starlette CORS Middleware]
        Router[FastAPI API Router /api]
    end

    subgraph "Application Core (Backend Service)"
        GameService[Game Management Service]
        Validator[Lexical & Permutation Engine]
        AIEngine[AI Move Generator]
        LocalDict[Local Dictionary Cache: 2000+ Words]
    end

    subgraph "External & Persistence Layer"
        DictAPI[Free Dictionary API: dictionaryapi.dev]
        MongoDB[(MongoDB Database: subwords_db)]
    end

    Axios -->|HTTP REST / JSON| CORS
    CORS --> Router
    Router --> GameService
    Router --> Validator
    Router --> AIEngine

    Validator --> LocalDict
    Validator -->|Async HTTPX| DictAPI

    AIEngine --> LocalDict

    GameService -->|Motor Async Driver| MongoDB
```

---

## 2. Technology Stack Matrix

| Layer | Technology | Version | Rationale & Responsibility |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React Native (Expo) | ~52.0.x / React 18.3.1 | Cross-platform mobile support (iOS, Android, Web) with rapid hot reloading and unified UI components. |
| **Frontend Navigation** | Expo Router | ~4.0.x | File-system-based routing with deep-linking, typed parameters, and native stack navigation. |
| **Frontend Networking** | Axios | ^1.7.9 | Promise-based HTTP client for asynchronous REST API communication with timeout control. |
| **Backend Framework** | FastAPI | >=0.100.0 | High-performance Python async web framework with automatic OpenAPI/Swagger docs and Pydantic validation. |
| **ASGI Server** | Uvicorn | Standard | Lightning-fast ASGI web server implementation for Python. |
| **Database Driver** | Motor (AsyncIOMotorClient) | Standard | Non-blocking async driver for MongoDB running on asyncio event loop. |
| **Persistence Store** | MongoDB | >=6.0 (Atlas / Community) | Document database providing dynamic schema flexibility for nested word lists and game session states. |
| **External HTTP Client** | HTTPX | Standard | Async HTTP client for Python used for concurrent external dictionary API verification. |
| **Validation & Schema** | Pydantic v2 | Standard | High-speed data modeling, request payload validation, and type safety. |

---

## 3. Component Architecture

### 3.1 Frontend Components (`frontend/app/`)

```mermaid
classDiagram
    class IndexScreen {
        +render()
        +navigateToSetup()
    }
    class SetupScreen {
        -mode: "pvp" | "pvc"
        -difficulty: "easy" | "medium" | "hard"
        -player1: string
        -player2: string
        -loading: boolean
        +startGame()
    }
    class GameScreen {
        -gameData: GameState
        -currentWord: string
        -timeLeft: number
        -submitting: boolean
        -computerThinking: boolean
        +fetchGame()
        +handleSubmitWord()
        +handleEndTurn()
        +handleComputerTurn()
    }
    class ResultsScreen {
        -gameData: GameState
        +fetchGame()
        +calculateWinner()
        +playAgain()
        +navigateHome()
    }

    IndexScreen --> SetupScreen : /setup
    SetupScreen --> GameScreen : /game?gameId=...
    GameScreen --> ResultsScreen : /results?gameId=...
    ResultsScreen --> SetupScreen : Play Again
    ResultsScreen --> IndexScreen : Home
```

1. **`index.tsx` (Home Screen)**: Entry point displaying title branding, game rules summary, and navigation trigger to setup.
2. **`setup.tsx` (Configuration Screen)**: Handles user input for match type (PvP vs PvC), AI difficulty tuning, and player naming; dispatches `POST /api/game/create`.
3. **`game.tsx` (Active Match Screen)**: Manages real-time countdown timer (120s), reactive input forms, word submission dispatch, simulated AI playback loops, and turn state synchronization.
4. **`results.tsx` (Outcome Screen)**: Reads final match state from backend, computes winner/tie conditions, and renders scoreboards and word review feeds.

---

### 3.2 Backend Services (`backend/server.py`)

- **Routing Layer (`api_router`)**:
  - `GET /api/`: Health check and connectivity probe.
  - `POST /api/game/create`: Generates new game session with a randomized base word.
  - `GET /api/game/{game_id}`: Retrieves complete game state.
  - `POST /api/game/submit-word`: Validates letters, verifies dictionary existence, updates scores and word list.
  - `POST /api/game/switch-turn`: Advances player turn, increments round counter, marks game as `finished` after round 2.
  - `POST /api/game/computer-turn`: Generates AI move set filtered by difficulty rules.
  - `POST /api/validate-word`: Standalone endpoint for validating individual words.

---

## 4. End-to-End Sequence Diagrams

### 4.1 Game Initialization Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player as User (Mobile Client)
    participant Setup as SetupScreen (Expo)
    participant API as FastAPI (/api/game/create)
    participant Mongo as MongoDB (db.games)

    Player->>Setup: Selects Mode (PvP/PvC) & Enters Names
    Player->>Setup: Taps "Start Game"
    Setup->>API: POST /api/game/create {player1, player2, mode, difficulty}
    API->>API: Select random main_word from WORD_LIST
    API->>API: Instantiate Game document (UUID, round=1, score=0)
    API->>Mongo: insert_one(game_dict)
    Mongo-->>API: Acknowledged (ObjectId)
    API->>API: Remove `_id` from payload
    API-->>Setup: Return GameState JSON (game_id, main_word, players)
    Setup->>Player: Transition to GameScreen (/game?gameId=...)
```

---

### 4.2 Word Submission & Dual-Tier Validation Flow

```mermaid
sequenceDiagram
    autonumber
    actor Player as Active Player
    participant Client as GameScreen
    participant API as FastAPI (/api/game/submit-word)
    participant DictAPI as DictionaryAPI.dev
    participant Mongo as MongoDB

    Player->>Client: Types subword & taps Submit
    Client->>API: POST /api/game/submit-word {game_id, word, player}
    API->>Mongo: find_one({id: game_id})
    Mongo-->>API: Game State

    Note over API: Step 1: Length Validation (len >= 3)
    Note over API: Step 2: Letter Multiset Check (can_form_word)
    Note over API: Step 3: Duplicate Check (player_words)
    
    alt Verification Failure in Step 1, 2, or 3
        API-->>Client: {valid: false, reason: "...", points: 0}
    else Structural Checks Passed
        API->>DictAPI: GET /api/v2/entries/en/{word} (5s timeout)
        alt Dictionary API returns 200 OK
            Note over API: Word is Valid English
        else Timeout / 404 / Error
            Note over API: Word is Invalid
        end
        API->>Mongo: update_one({id}, {$set: {player_words, player_score}})
        API-->>Client: {valid: bool, points: N, reason: "..."}
    end
    Client->>Client: Refresh local state & display feedback alert
```

---

### 4.3 Computer AI Move Execution Flow (PvC Mode)

```mermaid
sequenceDiagram
    autonumber
    participant Client as GameScreen
    participant API as FastAPI (/api/game/computer-turn)
    participant LocalDict as In-Memory Dictionary (VALID_WORDS)
    participant Mongo as MongoDB

    Note over Client: Detected current_player == 2 & mode == "pvc"
    Client->>Client: Display "Computer is thinking..." Overlay
    Client->>Client: Wait 3000ms (Human-like think pause)
    Client->>API: POST /api/game/computer-turn {game_id, difficulty}
    
    API->>Mongo: find_one({id: game_id})
    Mongo-->>API: Game State (main_word)
    
    API->>LocalDict: generate_subwords(main_word, min_len=3)
    LocalDict-->>API: All valid subwords
    API->>API: Filter words by difficulty tier (Easy/Medium/Hard)
    API-->>Client: {words: [...], total_score, count}

    loop For each word in words
        Client->>Client: Wait 1500ms (Pacing)
        Client->>API: POST /api/game/submit-word {game_id, word, player: 2}
        API-->>Client: Submission Acknowledged
    end

    Client->>Client: Wait 2000ms
    Client->>API: POST /api/game/switch-turn {game_id}
    API->>Mongo: Update round=3, status="finished"
    API-->>Client: {status: "finished"}
    Client->>Client: Navigate to /results
```

---

## 5. Data Architecture & MongoDB Schema

The system uses a single operational collection named `games` inside the `subwords_db` database.

### 5.1 `games` Document Schema Model

```json
{
  "_id": "ObjectId('...')",
  "id": "e4b2d184-7a32-4e89-9a67-9c98ef820d88",
  "main_word": "planet",
  "player1_name": "Alice",
  "player2_name": "Bob",
  "current_player": 1,
  "player1_words": [
    {
      "word": "plan",
      "valid": true,
      "points": 4
    },
    {
      "word": "lane",
      "valid": true,
      "points": 4
    }
  ],
  "player2_words": [
    {
      "word": "plant",
      "valid": true,
      "points": 5
    }
  ],
  "player1_score": 8,
  "player2_score": 5,
  "status": "active",
  "round": 1,
  "mode": "pvp",
  "difficulty": null,
  "created_at": "2026-11-03T06:00:00.000Z"
}
```

### 5.2 Schema Constraints & Indexing Strategy
- **Unique Primary Index**: `{ "id": 1 }` (UUID string, unique constraint ensures $O(1)$ lookup for all game actions).
- **TTL Index (Recommended for Production)**: `{ "created_at": 1 }, { expireAfterSeconds: 86400 }` to automatically clean up abandoned games after 24 hours.

---

## 6. Networking & Deployment Topology

```mermaid
graph LR
    subgraph "Local Development / Testing"
        Phone[Physical Device / Expo Go]
        DevPC[Developer Machine]
        Phone -->|WiFi LAN 192.168.x.x:8001| DevPC
        DevPC --> FastAPISrv[FastAPI Port 8001]
        FastAPISrv --> MongoLocal[(MongoDB 27017)]
    end

    subgraph "Production Topology (Target)"
        ClientApp[iOS / Android App Bundle]
        LB[HTTPS Load Balancer / Reverse Proxy]
        FastAPICluster[FastAPI Container Instances]
        Atlas[(MongoDB Atlas Cloud M0/M10)]

        ClientApp -->|HTTPS /api| LB
        LB --> FastAPICluster
        FastAPICluster --> Atlas
    end
```

---

## 7. Security & Architecture Quality Attributes

1. **Data Confidentiality & Credentials**:
   - Environment variables loaded exclusively via `python-dotenv` and Expo environment configurations.
   - Credentials strictly barred from version control via `.gitignore`.
2. **CORS Configuration**:
   - Currently permissive (`*`) for cross-device LAN development; production requires origin whitelisting (`subwords.app`).
3. **Resilience & Fault Tolerance**:
   - External Dictionary API call is wrapped in a strict 5.0-second timeout with non-blocking async execution.
   - Database operations use async non-blocking I/O preventing event loop starvation.
