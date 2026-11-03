"""
Main FastAPI Application Entrypoint for Word Builder (Subwords).
Orchestrates lifespan lifecycle, CORS middleware, and API router mounting.
"""

import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import lifespan
from .routes.game_router import router as game_router

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("subwords")

# Initialize FastAPI application with lifespan management
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure Cross-Origin Resource Sharing (CORS)
is_wildcard = "*" in settings.ALLOWED_ORIGINS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=not is_wildcard,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount MVC View Router
app.include_router(game_router)

logger.info(f"{settings.PROJECT_NAME} initialized successfully in MVC layout.")
