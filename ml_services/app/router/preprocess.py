import logging
from typing import Any, Dict
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.base import StandardResponse
from app.pipeline.preprocess import temp_pipeline, test_ws
from app.schemas.openrouter import PreprocessRequest, PreprocessResponse
from app.schemas.features import Feature
from app.core.websocket_manager import manager
from pydantic import UUID5
# from app.schemas.model import TestRun

router = APIRouter(prefix="/preprocess")
logger = logging.getLogger("uvicorn.error")

async def run_temp_pipeline_bg(dataset_id: int, model: str):
    try:
        mapping, cleaned_dataset_id = await temp_pipeline(dataset_id, model)
        if not mapping or not cleaned_dataset_id:
            raise Exception("Pipeline gagal dijalankan, pastikan layanan LLM tersedia.")
            
        metadata = await get_dataset_feature_metadata(dataset_id) or {}
        if mapping:
            # If temp_pipeline returned a Feature object, dump it
            if isinstance(mapping, Feature):
                metadata.update(mapping.model_dump())
            elif isinstance(mapping, dict):
                metadata.update(mapping)
        
        metadata["preprocess_status"] = "success"
        if cleaned_dataset_id:
            metadata["cleaned_dataset_id"] = cleaned_dataset_id
            
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{dataset_id}",
            json=metadata
        )
    except Exception as e:
        logger.error(f"Error in background preprocessing: {e}")
        metadata = await get_dataset_feature_metadata(dataset_id) or {}
        metadata["preprocess_status"] = "error"
        metadata["error_detail"] = str(e)
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{dataset_id}",
            json=metadata
        )

@router.post(
    "/run", 
    response_model=PreprocessResponse | Any,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_preprocess(request: PreprocessRequest, background_tasks: BackgroundTasks):
    """
    Endpoint untuk menjalankan seluruh pipeline preprocessing, berdasarkan dataset_id tertentu, Keluaran akan langsung disimpan pada database, namun akan diberikan beberapa informasi untuk logging.

    Args:
        request (PreprocessRequest): Request body yang berisi dataset id, serta pendekatan preprocessing yang diinginkan (Cluster/Forecast/Both).

    Returns:
        GemmaInsightResponse: Logging hasil preprocessing.
    """
    insight = await temp_pipeline(request.dataset_id, request.model_type, request.job_id)
    if type(insight) is Feature:
        return
    else:
        return f"idk: {insight}"
    
@router.websocket("/ws/{job_id}")
async def websocket_endpoint(websocket: WebSocket, job_id: str):
    await manager.connect(job_id, websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(job_id)