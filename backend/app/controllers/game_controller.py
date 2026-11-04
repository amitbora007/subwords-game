import random
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..models.game import GameCreate, WordSubmit, SwitchTurn, ComputerTurn
from ..services.dictionary_service import WORD_LIST, can_form_word, check_dictionary
from ..services.game_service import GameService

logger = logging.getLogger("subwords.controller")

class GameController:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db

    async def create_game(self, input_data: GameCreate) -> Dict[str, Any]:
        """Create a new game session with a random 6+ letter root word"""
        main_word = random.choice(WORD_LIST)
        time_limit = input_data.time_limit if input_data.time_limit and input_data.time_limit > 0 else 120

        p1_name = (input_data.player1_name or "Player 1").strip() or "Player 1"
        p2_default = "Computer AI" if input_data.mode == "pvc" else "Player 2"
        p2_name = (input_data.player2_name or "").strip() or p2_default

        game_dict = {
            "id": str(uuid.uuid4()),
            "main_word": main_word,
            "player1_name": p1_name,
            "player2_name": p2_name,
            "current_player": 1,
            "player1_words": [],
            "player2_words": [],
            "player1_score": 0,
            "player2_score": 0,
            "time_limit": time_limit,
            "status": "active",
            "round": 1,
            "mode": input_data.mode,
            "difficulty": input_data.difficulty or "medium",
            "created_at": datetime.now(timezone.utc),
        }

        await self.db.games.insert_one(game_dict)
        game_dict.pop("_id", None)
        return game_dict

    async def get_game(self, game_id: str) -> Dict[str, Any]:
        """Retrieve full game state by UUID"""
        game = await self.db.games.find_one({"id": game_id})
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")
        game.pop("_id", None)
        return game

    async def submit_word(self, input_data: WordSubmit) -> Dict[str, Any]:
        """Validate and score a submitted subword with competitor lockout and multiplier scoring"""
        game = await self.db.games.find_one({"id": input_data.game_id})
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        if game.get("status") != "active":
            return {"valid": False, "reason": "Game is already finished", "points": 0}

        if input_data.player != game.get("current_player"):
            return {
                "valid": False,
                "reason": f"It is Player {game.get('current_player')}'s turn!",
                "points": 0,
            }

        word = input_data.word.lower().strip()
        main_word = game["main_word"].lower()

        # 1. Minimum length constraint
        if len(word) < 3:
            return {"valid": False, "reason": "Word must be at least 3 letters", "points": 0}

        # 2. Multiset character constraint
        if not can_form_word(main_word, word):
            return {"valid": False, "reason": "Word cannot be formed from main word", "points": 0}

        # 3. Duplicate check for current player
        current_player_words = game.get(f"player{input_data.player}_words", [])
        if any(w.get("word") == word for w in current_player_words):
            return {"valid": False, "reason": "Word already submitted by you", "points": 0}

        # 4. Competitor lockout check
        competitor_num = 2 if input_data.player == 1 else 1
        competitor_words = game.get(f"player{competitor_num}_words", [])
        if any(w.get("word") == word and w.get("valid", False) for w in competitor_words):
            return {"valid": False, "reason": "Word already claimed by competitor!", "points": 0}

        # 5. Dual-tier lexical verification
        is_valid = await check_dictionary(word)
        if not is_valid:
            return {"valid": False, "reason": "Word not found in dictionary", "points": 0}

        # 6. Compounding Multiplier Scoring
        word_len = len(word)
        new_entry = {"word": word, "valid": True, "length": word_len, "points": word_len}
        updated_words = list(current_player_words)
        updated_words.append(new_entry)

        updated_words, word_count, base_points, total_score = GameService.calculate_multiplier_score(updated_words)

        # Atomic state update with match guards
        result = await self.db.games.update_one(
            {"id": input_data.game_id, "status": "active", "current_player": input_data.player},
            {
                "$set": {
                    f"player{input_data.player}_words": updated_words,
                    f"player{input_data.player}_score": total_score,
                }
            },
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
            "total_score": total_score,
            "points": word_len,
        }

    async def switch_turn(self, input_data: SwitchTurn) -> Dict[str, Any]:
        """Switch to next player or finish game after both players complete their turns"""
        game = await self.db.games.find_one({"id": input_data.game_id})
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        if game.get("status") == "finished":
            return {
                "success": True,
                "next_player": game.get("current_player", 1),
                "round": game.get("round", 3),
                "status": "finished",
            }

        current = game["current_player"]
        next_player = 2 if current == 1 else 1
        new_round = game["round"] + 1
        status = "finished" if new_round > 2 else "active"

        await self.db.games.update_one(
            {"id": input_data.game_id},
            {
                "$set": {
                    "current_player": next_player,
                    "round": new_round,
                    "status": status,
                }
            },
        )

        return {"success": True, "next_player": next_player, "round": new_round, "status": status}

    async def computer_turn(self, input_data: ComputerTurn) -> Dict[str, Any]:
        """Generate computer opponent's words based on difficulty, respecting competitor lockout"""
        game = await self.db.games.find_one({"id": input_data.game_id})
        if not game:
            raise HTTPException(status_code=404, detail="Game not found")

        main_word = game["main_word"]
        difficulty = input_data.difficulty or game.get("difficulty", "medium")

        # Get words already claimed by Player 1
        p1_claimed_words = set(
            w["word"].lower() for w in game.get("player1_words", []) if w.get("valid")
        )

        # Generate words and score via GameService
        computer_words, word_count, base_points, total_score = GameService.generate_ai_words(
            main_word=main_word,
            difficulty=difficulty,
            claimed_words=p1_claimed_words,
        )

        # Atomically update MongoDB and finish the game session
        await self.db.games.update_one(
            {"id": input_data.game_id},
            {
                "$set": {
                    "player2_words": computer_words,
                    "player2_score": total_score,
                    "round": 3,
                    "status": "finished",
                }
            },
        )

        return {
            "words": computer_words,
            "word_count": word_count,
            "base_points": base_points,
            "total_score": total_score,
        }

    async def list_games(self, limit: int = 20) -> List[Dict[str, Any]]:
        """List recent games for history and stats"""
        cursor = self.db.games.find().sort("created_at", -1).limit(limit)
        games = []
        async for doc in cursor:
            doc.pop("_id", None)
            games.append(doc)
        return games
