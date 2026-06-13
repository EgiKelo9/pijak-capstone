from typing import Any, Dict
from fastapi import APIRouter, BackgroundTasks
from app.schemas.base import StandardResponse
from app.controller.openrouter import analyze_columns, get_insight_from_data
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse, OpenRouterInsightRequest, OpenRouterInsightResponse
from app.core.utils import call_backend_api, get_dataset_feature_metadata

router = APIRouter(prefix="/openrouter")


@router.post(
    "/analyze-columns",
    response_model=StandardResponse[OpenRouterMappingResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def suggest_columns(request: DatasetMetadataRequest, background_tasks: BackgroundTasks):
    """
    Endpoint untuk menyarankan mapping kolom berdasarkan dataset_id dan model_type.
    Dataset akan di-fetch internal dari backend, lalu metadata dikirim ke OpenRouter untuk analisis.
    
    Args:
        request (DatasetMetadataRequest): Request body berisi dataset_id dan model_type (forecasting/clustering).
        
    Returns:
        StandardResponse[OpenRouterMappingResponse]: Response berisi status, task, dan mapping kolom yang disarankan.
    """
    if not request.force_reload:
        existing_metadata = await get_dataset_feature_metadata(request.dataset_id)
        if existing_metadata and existing_metadata.get("analyze_status") not in ["processing", "error"]:
            return StandardResponse(
                code=200,
                error=False,
                message="Analisis kolom berhasil (Cached)",
                data={"status": "success", "task": request.model_type, "suggested_mapping": existing_metadata},
            )

    # Update metadata to indicate processing
    try:
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{request.dataset_id}",
            json={"analyze_status": "processing"}
        )
    except Exception as e:
        print(f"Failed to set processing status: {e}")

    background_tasks.add_task(analyze_columns, request)
    return StandardResponse(
        code=200,
        error=False,
        message="Analisis kolom sedang diproses dalam background",
        data={"status": "processing", "task": request.model_type, "suggested_mapping": None},
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
