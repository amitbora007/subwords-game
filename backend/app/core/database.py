import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

logger = logging.getLogger("subwords.database")

class Database:
    client: AsyncIOMotorClient = None
    db: AsyncIOMotorDatabase = None

db_instance = Database()

def get_database() -> AsyncIOMotorDatabase:
    if db_instance.db is None:
        db_instance.client = AsyncIOMotorClient(settings.MONGO_URL)
        db_instance.db = db_instance.client[settings.DB_NAME]
    return db_instance.db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and ensure unique index
    db_instance.client = AsyncIOMotorClient(settings.MONGO_URL)
    db_instance.db = db_instance.client[settings.DB_NAME]
    try:
        await db_instance.db.games.create_index("id", unique=True)
        logger.info("MongoDB index on games.id ensured.")
    except Exception as e:
        logger.warning(f"Could not create MongoDB index: {e}")

    yield

    # Shutdown: Close client
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")
