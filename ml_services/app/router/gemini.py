from typing import Any, Dict
from fastapi import APIRouter
from app.schemas.base import StandardResponse
from app.controller.gemini import get_preprocess_from_gemini
from app.schemas.gemini import GeminiInsightRequest, GeminiInsightResponse, GeminiPreprocessRequest, GeminiPreprocessResponse
from app.schemas.features import Feature

router = APIRouter(prefix="/gemini")

@router.post(
    "/preprocess", 
    response_model=GeminiPreprocessResponse,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_preprocess(request: GeminiPreprocessRequest):
    """
    Endpoint untuk mendapatkan insight dari Gemma LLM berdasarkan data forecast yang diberikan.

    Args:
        request (GemmaInsightRequest): Request body yang berisi data forecast untuk dianalisis oleh Gemma.

    Returns:
        GemmaInsightResponse: Response yang berisi insight yang dihasilkan oleh Gemma.
    """
    insight = await get_preprocess_from_gemini(request.dataset_id, request.model_type)
    if type(insight) is Feature:
        return GeminiPreprocessResponse(insight=insight)
    else:
        return f"idk: {insight}"