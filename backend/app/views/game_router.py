"""
API View Router for Subwords Game Arena.
Defines HTTP endpoint signatures and delegates request handling to GameController.
"""

from fastapi import APIRouter, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from ..core.database import get_database
from ..controllers.game_controller import GameController
from ..models.game import GameCreate, WordSubmit, SwitchTurn, ComputerTurn

router = APIRouter(prefix="/api")

def get_controller(db: AsyncIOMotorDatabase = Depends(get_database)) -> GameController:
    return GameController(db)

@router.get("/")
@router.get("/health")
async def root():
    """API health and capabilities status"""
    return {
        "message": "Word Builder Web API v2.0",
        "status": "online",
        "architecture": "MVC",
        "features": ["configurable_timer", "competitor_lockout", "multiplier_scoring", "procedural_ai"]
    }

@router.post("/game/create")
async def create_game(
    input_data: GameCreate,
    controller: GameController = Depends(get_controller)
):
    """Create a new game session with a random 6+ letter root word"""
    return await controller.create_game(input_data)

@router.get("/game/{game_id}")
async def get_game(
    game_id: str,
    controller: GameController = Depends(get_controller)
):
    """Retrieve full game state by ID"""
    return await controller.get_game(game_id)

@router.post("/game/submit-word")
async def submit_word(
    input_data: WordSubmit,
    controller: GameController = Depends(get_controller)
):
    """Validate and score a submitted subword with competitor lockout"""
    return await controller.submit_word(input_data)

@router.post("/game/switch-turn")
async def switch_turn(
    input_data: SwitchTurn,
    controller: GameController = Depends(get_controller)
):
    """Switch active player turn or conclude game session"""
    return await controller.switch_turn(input_data)

@router.post("/game/computer-turn")
async def computer_turn(
    input_data: ComputerTurn,
    controller: GameController = Depends(get_controller)
):
    """Generate computer AI opponent turn and finalize match"""
    return await controller.computer_turn(input_data)

@router.get("/games")
async def list_games(
    limit: int = 20,
    controller: GameController = Depends(get_controller)
):
    """List recent game matches"""
    return await controller.list_games(limit=limit)
