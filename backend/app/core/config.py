import os
from pathlib import Path
from dotenv import load_dotenv

# Path to backend root directory where .env resides
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(ROOT_DIR / ".env")

class Settings:
    PROJECT_NAME: str = "Word Builder Web API"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # MongoDB settings
    MONGO_URL: str = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME: str = os.environ.get("DB_NAME", "subwords_db")
    
    # CORS settings
    ALLOWED_ORIGINS: list[str] = [
        o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "*").split(",")
    ]

settings = Settings()
