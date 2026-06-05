from typing import Any, Dict
from fastapi import APIRouter
from app.schemas.base import StandardResponse
from app.pipeline.preprocess import temp_pipeline
from app.schemas.openrouter import PreprocessRequest, PreprocessResponse
from app.schemas.features import Feature
# from app.schemas.model import TestRun

router = APIRouter(prefix="/preprocess")

@router.post(
    "/run", 
    response_model=PreprocessResponse | Any,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_preprocess(request: PreprocessRequest):
    """
    Endpoint untuk menjalankan seluruh pipeline preprocessing, berdasarkan dataset_id tertentu, Keluaran akan langsung disimpan pada database, namun akan diberikan beberapa informasi untuk logging.

    Args:
        request (PreprocessRequest): Request body yang berisi dataset id, serta pendekatan preprocessing yang diinginkan (Cluster/Forecast/Both).

    Returns:
        GemmaInsightResponse: Logging hasil preprocessing.
    """
    insight = await temp_pipeline(request.dataset_id, request.model_type)
    if type(insight) is Feature:
        return PreprocessResponse(insight=insight)
    else:
        return f"idk: {insight}"