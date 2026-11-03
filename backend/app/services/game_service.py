"""
Game Domain Logic Service for Subwords.
Handles compounding multiplier scoring, competitor lockout rules, and AI bot moves.
"""

from typing import List, Dict, Any, Tuple
from .dictionary_service import generate_subwords

class GameService:
    @staticmethod
    def calculate_multiplier_score(words: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], int, int, int]:
        """
        Calculate score using compounding multiplier formula:
        Total Score = (Sum of Valid Word Lengths) * (Count of Valid Words)
        Returns: (updated_words, word_count, base_points, total_score)
        """
        valid_words = [w for w in words if w.get("valid", False)]
        word_count = len(valid_words)
        base_points = sum(w.get("length", len(w.get("word", ""))) for w in valid_words)
        total_score = base_points * word_count

        updated_words = list(words)
        for w in updated_words:
            if w.get("valid", False):
                length = w.get("length", len(w.get("word", "")))
                w["points"] = length * word_count

        return updated_words, word_count, base_points, total_score

    @staticmethod
    def generate_ai_words(
        main_word: str,
        difficulty: str = "medium",
        claimed_words: set = None
    ) -> Tuple[List[Dict[str, Any]], int, int, int]:
        """
        Generate computer player's words based on difficulty level,
        strictly respecting the competitor lockout rule (cannot reuse words claimed by opponent).
        """
        if claimed_words is None:
            claimed_words = set()

        all_subwords = generate_subwords(main_word, min_length=3)
        available_words = [w for w in all_subwords if w.lower() not in claimed_words]
        available_words.sort(key=lambda x: len(x))

        short_words = [w for w in available_words if len(w) <= 4]
        long_words = [w for w in available_words if len(w) >= 5]

        diff = (difficulty or "medium").lower().strip()
        selected_words = []

        if diff == "easy":
            target_count = min(5, max(3, len(short_words))) if short_words else min(3, len(available_words))
            selected_words = short_words[:target_count] if short_words else available_words[:target_count]
        elif diff == "medium":
            target_count = min(8, max(5, len(available_words)))
            short_target = min(len(short_words), int(target_count * 0.6))
            long_target = min(len(long_words), target_count - short_target)
            selected_words = short_words[:short_target] + long_words[:long_target]
            if len(selected_words) < target_count:
                remaining = [w for w in available_words if w not in selected_words]
                selected_words.extend(remaining[: target_count - len(selected_words)])
        else:  # hard
            target_count = min(12, max(8, len(available_words)))
            long_target = min(len(long_words), max(int(target_count * 0.8), min(8, len(long_words))))
            short_target = min(len(short_words), target_count - long_target)
            selected_words = long_words[:long_target] + short_words[:short_target]
            if len(selected_words) < target_count:
                remaining = [w for w in available_words if w not in selected_words]
                selected_words.extend(remaining[: target_count - len(selected_words)])
            if len(selected_words) < 8 and len(available_words) > 0:
                selected_words = available_words[: min(12, len(available_words))]

        # Format words and compute multiplier score
        formatted = [
            {"word": w, "valid": True, "length": len(w), "points": len(w)}
            for w in selected_words
        ]
        return GameService.calculate_multiplier_score(formatted)
