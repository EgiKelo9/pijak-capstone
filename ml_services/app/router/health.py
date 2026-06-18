from typing import Any, Dict
from fastapi import APIRouter
from app.controller.health import check_health, check_llm_health
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
    "/llm",
    response_model=StandardResponse[dict],
    responses={
        422: {"model": StandardResponse[Dict[str, Any]], "description": "Validation Error"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def get_llm_health() -> StandardResponse[dict]:
    """Health check for LLM via OpenRouter."""
    return await check_llm_health()
