"""Health check router"""
from fastapi import APIRouter, Request
from datetime import datetime
import time

from app.models import HealthResponse

router = APIRouter()
start_time = time.time()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request):
    """Check service health"""
    model_service = getattr(request.app.state, 'model_service', None)
    
    return HealthResponse(
        status="healthy",
        model_loaded=model_service is not None and model_service.is_ready,
        version="1.0.0",
        uptime_seconds=time.time() - start_time
    )


@router.get("/ready")
async def readiness_check(request: Request):
    """Kubernetes readiness probe"""
    model_service = getattr(request.app.state, 'model_service', None)
    
    if model_service and model_service.is_ready:
        return {"status": "ready"}
    
    return {"status": "not_ready"}, 503


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive"}
