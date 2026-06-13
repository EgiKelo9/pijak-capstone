from typing import Any, Dict
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.forecasting_schema import ForecastingRunRequest, ForecastingCallbackRequest
from app.controller.forecasting_controller import (
    run_forecasting,
    get_forecasting_result,
    get_forecasting_history,
    handle_forecasting_callback
)
from app.shared.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/forecasting")


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
async def run_forecasting_endpoint(
    request: ForecastingRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menjalankan forecasting penjualan per produk menggunakan XGBoost.

    Args:
        request (ForecastingRunRequest): Request body berisi dataset_id, col_date,
            col_product, col_target, col_regressors, horizon, freq, dan data.
        db (Session): Database session.
        current_user (User): User yang sedang login.

    Returns:
        StandardResponse[dict]: Hasil forecasting berisi product_amount, horizon,
            freq, per-produk predictions + metrics, dan insight_summary dari LLM.

    Raises:
        HTTPException: 404 jika dataset tidak ditemukan.
        HTTPException: 404 jika ML model forecasting tidak ditemukan.
        HTTPException: 502 jika ML service tidak bisa dihubungi.
    """
    return await run_forecasting(request, current_user.id, db)


@router.patch(
    "/callback",
    response_model=StandardResponse[dict],
)
async def forecasting_callback_endpoint(
    request: ForecastingCallbackRequest,
    db: Session = Depends(get_db)
):
    """Menerima callback dari ML service setelah proses forecasting selesai/gagal.
    
    Endpoint ini bersifat internal dan idealnya diproteksi, tapi untuk prototype
    langsung menerima request dan memperbarui status di database.
    """
    return await handle_forecasting_callback(request, db)


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
    """Ambil hasil forecasting berdasarkan analysis_id.

    Args:
        analysis_id (int): ID dari analysis_history yang ingin diambil hasilnya.
        db (Session): Database session.
        current_user (User): User yang sedang login.

    Returns:
        StandardResponse[dict]: Hasil forecasting lengkap beserta insight_summary.

    Raises:
        HTTPException: 404 jika analysis tidak ditemukan atau bukan milik user.
        HTTPException: 404 jika hasil forecasting belum tersedia.
    """
    return await get_forecasting_result(analysis_id, current_user.id, db)


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
    """Ambil semua riwayat forecasting milik user yang sedang login.

    Args:
        db (Session): Database session.
        current_user (User): User yang sedang login.

    Returns:
        StandardResponse[list]: List riwayat forecasting beserta status dan hasil ringkas.
    """
    return await get_forecasting_history(current_user.id, db)
