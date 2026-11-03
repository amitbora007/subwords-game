import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any
from pydantic import BaseModel, Field

class WordItem(BaseModel):
    word: str
    valid: bool = True
    length: int
    points: int

class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    main_word: str
    player1_name: str = "Player 1"
    player2_name: str = "Player 2"
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
    difficulty: Optional[str] = "medium"

class WordSubmitResult(BaseModel):
    valid: bool
    reason: str
    word: Optional[str] = None
    length: Optional[int] = None
    word_count: Optional[int] = None
    base_points: Optional[int] = None
    total_score: Optional[int] = None
    points: Optional[int] = None
