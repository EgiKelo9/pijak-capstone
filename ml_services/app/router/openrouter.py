from typing import Any, Dict
from fastapi import APIRouter
from app.schemas.base import StandardResponse
from app.controller.openrouter import analyze_columns, get_insight_from_data
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse, OpenRouterInsightRequest, OpenRouterInsightResponse

router = APIRouter(prefix="/openrouter")


@router.post(
    "/analyze-columns",
    response_model=StandardResponse[OpenRouterMappingResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def suggest_columns(request: DatasetMetadataRequest):
    """
    Endpoint untuk menyarankan mapping kolom berdasarkan metadata dataset yang diberikan.
    
    Args:
        request (DatasetMetadataRequest): Request body yang berisi metadata dataset untuk dianalisis oleh OpenRouter.
        
    Returns:
        StandardResponse[OpenRouterMappingResponse]: Response yang berisi status, task, dan mapping kolom yang disarankan oleh OpenRouter.
    """
    mapping = await analyze_columns(request)
    return StandardResponse(
        code=200,
        error=False,
        message="Analisis kolom berhasil",
        data=mapping,
    )


@router.post(
    "/insight", 
    response_model=OpenRouterInsightResponse,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_insight(request: OpenRouterInsightRequest):
    """
    Endpoint untuk mendapatkan insight dari OpenRouter berdasarkan data yang diberikan.

    Args:
        request (OpenRouterInsightRequest): Request body yang berisi data untuk dianalisis oleh OpenRouter.

    Returns:
        OpenRouterInsightResponse: Response yang berisi insight yang dihasilkan oleh OpenRouter.
    """
    insight = await get_insight_from_data(request.target_task, request.json_data)
    return OpenRouterInsightResponse(insight=insight)
