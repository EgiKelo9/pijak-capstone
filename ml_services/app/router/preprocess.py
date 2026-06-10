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