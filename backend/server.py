import os
import uuid
import random
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Optional
from collections import Counter
from contextlib import asynccontextmanager

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

try:
    from .dictionary import WORD_LIST, VALID_WORDS
except (ImportError, ValueError):
    from dictionary import WORD_LIST, VALID_WORDS

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging at startup
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("subwords")

# MongoDB connection setup
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
db_name = os.environ.get('DB_NAME', 'subwords_db')
client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

# Modern FastAPI lifespan context manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure unique index for high concurrency
    try:
        await db.games.create_index("id", unique=True)
        logger.info("MongoDB index on games.id ensured.")
    except Exception as e:
        logger.warning(f"Could not create MongoDB index: {e}")
    yield
    # Shutdown: gracefully close client
    client.close()
    logger.info("MongoDB client closed.")

# Main app with lifespan handler
app = FastAPI(title="Word Builder Web API", version="2.0.0", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# CORS configuration
allowed_origins = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    main_word: str
    player1_name: str
    player2_name: str
    current_player: int = 1
    player1_words: List[dict] = []
    player2_words: List[dict] = []
    player1_score: int = 0
    player2_score: int = 0
    time_limit: int = 120
    status: str = "active"
    round: int = 1
    mode: str = "pvp"
    difficulty: Optional[str] = "medium"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GameCreate(BaseModel):
    player1_name: Optional[str] = "Player 1"
    player2_name: Optional[str] = ""
    mode: str = "pvp"
    difficulty: Optional[str] = "medium"
    time_limit: Optional[int] = 120

class WordSubmit(BaseModel):
    game_id: str
    word: str
    player: int

class SwitchTurn(BaseModel):
    game_id: str

class ComputerTurn(BaseModel):
    game_id: str
    difficulty: str

# Pure helper function: Multiset character frequency check
def can_form_word(main_word: str, sub_word: str) -> bool:
    """Check if sub_word can be formed from letters in main_word using O(M + N) multiset check"""
    main_counts = Counter(main_word.lower().strip())
    sub_counts = Counter(sub_word.lower().strip())
    for char, count in sub_counts.items():
        if main_counts[char] < count:
            return False
    return True

# Helper function: Dual-tier dictionary verification
async def check_dictionary(word: str) -> bool:
    """Check if word exists in local dictionary or external dictionary API"""
    w = word.lower().strip()
    # Tier 1: In-memory O(1) hash set lookup
    if w in VALID_WORDS:
        return True
    
    # Tier 2: Free external dictionary API with 3.0s timeout
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.get(
                f"https://api.dictionaryapi.dev/api/v2/entries/en/{w}",
                timeout=3.0
            )
            if response.status_code == 200:
                VALID_WORDS.add(w)  # Dynamically cache verified word
                return True
    except Exception:
        pass
    return False

# Helper function: Generate all subwords from main word
def generate_subwords(main_word: str, min_length: int = 3) -> List[str]:
    """Generate all valid subwords from main_word using local dictionary"""
    main_word = main_word.lower().strip()
    subwords = []
    for word in VALID_WORDS:
        if min_length <= len(word) <= len(main_word):
            if can_form_word(main_word, word):
                subwords.append(word)
    return subwords

# API Endpoints
@api_router.get("/")
async def root():
    return {
        "message": "Word Builder Web API v2.0",
        "status": "online",
        "features": ["configurable_timer", "competitor_lockout", "multiplier_scoring"]
    }

@api_router.post("/game/create")
async def create_game(input: GameCreate):
    """Create a new game with random 6+ letter root word and configurable timer"""
    main_word = random.choice(WORD_LIST)
    time_limit = input.time_limit if input.time_limit and input.time_limit > 0 else 120
    
    game_dict = {
        "id": str(uuid.uuid4()),
        "main_word": main_word,
        "player1_name": input.player1_name.strip() or "Player 1",
        "player2_name": input.player2_name.strip() or ("Computer AI" if input.mode == "pvc" else "Player 2"),
        "current_player": 1,
        "player1_words": [],
        "player2_words": [],
        "player1_score": 0,
        "player2_score": 0,
        "time_limit": time_limit,
        "status": "active",
        "round": 1,
        "mode": input.mode,
        "difficulty": input.difficulty or "medium",
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.games.insert_one(game_dict)
    game_dict.pop('_id', None)
    return game_dict

@api_router.get("/game/{game_id}")
async def get_game(game_id: str):
    """Get complete game state by ID"""
    game = await db.games.find_one({"id": game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    game.pop('_id', None)
    return game

@api_router.post("/game/submit-word")
async def submit_word(input: WordSubmit):
    """Submit a word for validation with competitor lockout and compounding multiplier scoring"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    if game.get("status") != "active":
        return {"valid": False, "reason": "Game is already finished", "points": 0}
    
    if input.player != game.get("current_player"):
        return {"valid": False, "reason": f"It is Player {game.get('current_player')}'s turn!", "points": 0}
    
    word = input.word.lower().strip()
    main_word = game["main_word"].lower()
    
    # 1. Minimum length constraint
    if len(word) < 3:
        return {"valid": False, "reason": "Word must be at least 3 letters", "points": 0}
    
    # 2. Multiset character constraint
    if not can_form_word(main_word, word):
        return {"valid": False, "reason": "Word cannot be formed from main word", "points": 0}
    
    # 3. Duplicate check for current player
    current_player_words = game.get(f"player{input.player}_words", [])
    if any(w["word"] == word for w in current_player_words):
        return {"valid": False, "reason": "Word already submitted by you", "points": 0}
    
    # 4. Competitor lockout check: cannot reuse words claimed by opponent
    competitor_num = 2 if input.player == 1 else 1
    competitor_words = game.get(f"player{competitor_num}_words", [])
    if any(w["word"] == word and w.get("valid", False) for w in competitor_words):
        return {"valid": False, "reason": "Word already claimed by competitor!", "points": 0}
    
    # 5. Dual-tier dictionary lookup
    is_valid = await check_dictionary(word)
    if not is_valid:
        return {"valid": False, "reason": "Word not found in dictionary", "points": 0}
    
    # 6. Compounding Multiplier Scoring:
    # Total Score = (Sum of all valid word lengths) * (Total valid words count)
    word_len = len(word)
    new_word_entry = {"word": word, "valid": True, "length": word_len, "points": word_len}
    updated_words = list(current_player_words)
    updated_words.append(new_word_entry)
    
    valid_words = [w for w in updated_words if w.get("valid", False)]
    word_count = len(valid_words)
    base_points = sum(w.get("length", len(w["word"])) for w in valid_words)
    total_score = base_points * word_count
    
    # Update each word entry with current proportional points
    for w in updated_words:
        if w.get("valid"):
            w["points"] = w.get("length", len(w["word"])) * word_count
    
    # Atomic state update with match guards
    result = await db.games.update_one(
        {"id": input.game_id, "status": "active", "current_player": input.player},
        {
            "$set": {
                f"player{input.player}_words": updated_words,
                f"player{input.player}_score": total_score
            }
        }
    )
    
    if result.matched_count == 0:
        return {"valid": False, "reason": "Turn ended or game status changed", "points": 0}
    
    return {
        "valid": True,
        "reason": "Valid word!",
        "word": word,
        "length": word_len,
        "word_count": word_count,
        "base_points": base_points,
        "total_score": total_score
    }

@api_router.post("/game/switch-turn")
async def switch_turn(input: SwitchTurn):
    """Switch to next player or finish game after both players complete their turns"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    current = game["current_player"]
    next_player = 2 if current == 1 else 1
    new_round = game["round"] + 1
    status = "finished" if new_round > 2 else "active"
    
    await db.games.update_one(
        {"id": input.game_id},
        {
            "$set": {
                "current_player": next_player,
                "round": new_round,
                "status": status
            }
        }
    )
    
    return {"success": True, "next_player": next_player, "round": new_round, "status": status}

@api_router.post("/game/computer-turn")
async def computer_turn(input: ComputerTurn):
    """Generate computer's words based on difficulty, respecting competitor lockout rule"""
    game = await db.games.find_one({"id": input.game_id})
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    main_word = game["main_word"]
    difficulty = input.difficulty.lower()
    
    # Get all words already claimed by Player 1
    p1_claimed_words = set(w["word"].lower() for w in game.get("player1_words", []) if w.get("valid"))
    
    # Generate all valid subwords
    all_subwords = generate_subwords(main_word, min_length=3)
    
    # Filter out subwords claimed by Player 1 (competitor lockout)
    available_words = [w for w in all_subwords if w not in p1_claimed_words]
    available_words.sort(key=lambda x: len(x))
    
    short_words = [w for w in available_words if len(w) <= 4]
    long_words = [w for w in available_words if len(w) >= 5]
    
    selected_words = []
    if difficulty == "easy":
        target_count = min(5, max(3, len(short_words)))
        selected_words = short_words[:target_count]
    elif difficulty == "medium":
        target_count = min(8, max(5, len(available_words)))
        short_target = min(len(short_words), int(target_count * 0.6))
        long_target = min(len(long_words), target_count - short_target)
        selected_words = short_words[:short_target] + long_words[:long_target]
        if len(selected_words) < target_count:
            remaining = [w for w in available_words if w not in selected_words]
            selected_words.extend(remaining[:target_count - len(selected_words)])
    else:  # hard
        target_count = min(12, max(8, len(available_words)))
        long_target = min(len(long_words), max(int(target_count * 0.8), min(8, len(long_words))))
        short_target = min(len(short_words), target_count - long_target)
        selected_words = long_words[:long_target] + short_words[:short_target]
        if len(selected_words) < target_count:
            remaining = [w for w in available_words if w not in selected_words]
            selected_words.extend(remaining[:target_count - len(selected_words)])
        if len(selected_words) < 8 and len(available_words) > 0:
            selected_words = available_words[:min(12, len(available_words))]
    
    # Calculate score with the compounding multiplier formula
    word_count = len(selected_words)
    base_points = sum(len(w) for w in selected_words)
    total_score = base_points * word_count
    
    computer_words = []
    for word in selected_words:
        computer_words.append({
            "word": word,
            "valid": True,
            "length": len(word),
            "points": len(word) * word_count
        })
    
    # Atomically persist computer turn to MongoDB and mark game as finished
    await db.games.update_one(
        {"id": input.game_id},
        {
            "$set": {
                "player2_words": computer_words,
                "player2_score": total_score,
                "round": 3,
                "status": "finished"
            }
        }
    )
    
    return {
        "words": computer_words,
        "word_count": word_count,
        "base_points": base_points,
        "total_score": total_score
    }

# Include the router in the main app
app.include_router(api_router)
