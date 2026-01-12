"""
Smart Mail Guardian - AI Engine
FastAPI application for email threat analysis
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.routers import analysis, url_scanner, health
from app.services.model_service import ModelService

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global model service
model_service: ModelService = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    global model_service
    
    # Startup
    logger.info("🚀 Starting AI Engine...")
    model_service = ModelService()
    await model_service.initialize()
    app.state.model_service = model_service
    logger.info("✅ AI Engine ready")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down AI Engine...")
    if model_service:
        await model_service.cleanup()


app = FastAPI(
    title="Smart Mail Guardian - AI Engine",
    description="AI-powered email threat analysis engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["Health"])
app.include_router(analysis.router, prefix="/analyze", tags=["Analysis"])
app.include_router(url_scanner.router, prefix="/scan-url", tags=["URL Scanner"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Smart Mail Guardian - AI Engine",
        "version": "1.0.0",
        "status": "running"
    }
