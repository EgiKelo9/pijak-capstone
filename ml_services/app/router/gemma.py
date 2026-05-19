from typing import Any, Dict
from fastapi import APIRouter
from app.schemas.base import StandardResponse
from app.controller.gemma import get_insight_from_gemma
from app.schemas.gemma import GemmaInsightRequest, GemmaInsightResponse

router = APIRouter(prefix="/gemma")

@router.post(
    "/insight", 
    response_model=GemmaInsightResponse,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_insight(request: GemmaInsightRequest):
    """
    Endpoint untuk mendapatkan insight dari Gemma LLM berdasarkan data forecast yang diberikan.

    Args:
        request (GemmaInsightRequest): Request body yang berisi data forecast untuk dianalisis oleh Gemma.

    Returns:
        GemmaInsightResponse: Response yang berisi insight yang dihasilkan oleh Gemma.
    """
    insight = await get_insight_from_gemma({"dummy": request.forecast_data})
    return GemmaInsightResponse(insight=insight)

