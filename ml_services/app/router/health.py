from typing import Any, Dict
from fastapi import APIRouter
from app.controller.health import check_health, check_gemma_health
from app.schemas.base import StandardResponse

router = APIRouter(prefix="/health")


@router.get(
    "/", 
    response_model=StandardResponse[dict],
    responses={
        422: {"model": StandardResponse[Dict[str, Any]], "description": "Validation Error"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
def get_ml_health() -> StandardResponse[dict]:
    """Health check for ML service."""
    return check_health()

@router.get(
    "/gemma",
    response_model=StandardResponse[dict],
    responses={
        422: {"model": StandardResponse[Dict[str, Any]], "description": "Validation Error"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def get_gemma_health() -> StandardResponse[dict]:
    """Health check for Gemma LLM via Ollama."""
    return await check_gemma_health()
