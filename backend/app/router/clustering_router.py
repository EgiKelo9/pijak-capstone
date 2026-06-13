from typing import Any, Dict
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.clustering_schema import ClusteringRunRequest, ClusteringCallbackRequest
from app.controller.clustering_controller import run_clustering, get_clustering_result, get_clustering_history, handle_clustering_callback
from app.shared.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/clustering")

@router.post(
    "/run",
    response_model=StandardResponse[dict],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        404: {"model": StandardResponse[dict], "description": "Dataset atau Model tidak ditemukan"},
        502: {"model": StandardResponse[dict], "description": "ML Service Error"}
    }
)
async def run_clustering_endpoint(
    request: ClusteringRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menjalankan clustering produk."""
    return await run_clustering(request, current_user.id, db)


@router.patch(
    "/callback",
    response_model=StandardResponse[dict],
)
async def clustering_callback_endpoint(
    request: ClusteringCallbackRequest,
    db: Session = Depends(get_db)
):
    """Menerima callback dari ML service setelah proses clustering selesai/gagal."""
    return await handle_clustering_callback(request, db)


@router.get(
    "/result/{analysis_id}",
    response_model=StandardResponse[dict],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        404: {"model": StandardResponse[dict], "description": "Hasil tidak ditemukan"}
    }
)
async def get_result_endpoint(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil hasil clustering berdasarkan analysis_id."""
    return await get_clustering_result(analysis_id, current_user.id, db)


@router.get(
    "/history",
    response_model=StandardResponse[list],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def get_history_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil semua riwayat clustering milik user."""
    return await get_clustering_history(current_user.id, db)