import os
import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.shared.transaction_manager import TransactionManager
from app.models.analysis_history import AnalysisHistory
from app.models.forecasting_result import ForecastingResult
from app.models.ml_model import MLModel
from app.models.dataset import Dataset_Bin
from app.schemas.forecasting_schema import ForecastingRunRequest, ForecastingCallbackRequest
from app.schemas.base import StandardResponse
from app.core.config import get_settings
import logging

logger = logging.getLogger("uvicorn.error")

settings = get_settings()


async def run_forecasting(request: ForecastingRunRequest, user_id: int, db: Session):
    """Controller untuk menjalankan forecasting dan menyimpan hasilnya ke DB."""

    transaction_manager = TransactionManager(db)

    # 1. Cek dataset exists
    dataset = db.query(Dataset_Bin).filter(
        Dataset_Bin.id == request.dataset_id,
        Dataset_Bin.is_cleaned == True,
        Dataset_Bin.model == "forecasting",
        Dataset_Bin.deleted_at == None
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    # 2. Cek ml_model untuk forecasting
    ml_model = db.query(MLModel).filter(
        MLModel.type == "forecasting",
        MLModel.deleted_at == None
    ).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="ML model forecasting tidak ditemukan")

    # 3. Insert analysis_history dengan status pending
    with transaction_manager.transaction() as session:
        analysis = AnalysisHistory(
            user_id=user_id,
            dataset_id=request.dataset_id,
            model_id=ml_model.id,
            status="pending"
        )
        session.add(analysis)
        session.flush()
        analysis_id = analysis.id

    # 4. Hit ML service
    # Backend web url from environment or default
    backend_base = os.getenv("BACKEND_BASE_URL", "http://localhost:5000")
    callback_url = f"{backend_base}/api/v1/forecasting/callback"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=f"{settings.ML_SERVICE_URL}/ml/v1/model/forecasting",
                json={
                    "analysis_id": str(analysis_id),
                    "dataset_id": request.dataset_id,
                    "col_date": request.col_date,
                    "col_product": request.col_product,
                    "col_target": request.col_target,
                    "col_regressors": request.col_regressors,
                    "horizon": request.horizon,
                    "freq": request.freq,
                    "callback_url": callback_url
                },
                timeout=15.0 # Timeout singkat karena ML service akan merespons 202 Accepted
            )
            response.raise_for_status()

    except Exception as e:
        # Jika gagal mengirim request ke ML Service
        with transaction_manager.transaction() as session:
            analysis = session.query(AnalysisHistory).filter(
                AnalysisHistory.id == analysis_id
            ).first()
            analysis.status = "failed"
        
        error_detail = str(e)
        if isinstance(e, httpx.HTTPStatusError):
            error_detail = e.response.json().get("detail", str(e))
            
        raise HTTPException(status_code=502, detail=f"Gagal menghubungi ML service: {error_detail}")

    return StandardResponse(
        code=202,
        error=False,
        message="Forecasting sedang diproses di background",
        data={
            "analysis_id": analysis_id,
            "status": "pending"
        }
    )

async def handle_forecasting_callback(request: ForecastingCallbackRequest, db: Session):
    """Menangani callback dari ML service setelah proses selesai atau gagal."""
    transaction_manager = TransactionManager(db)
    
    analysis_id = request.analysis_id
    
    # Cek apakah analysis_history ada
    analysis = db.query(AnalysisHistory).filter(AnalysisHistory.id == analysis_id).first()
    if not analysis:
        logger.error(f"Callback received for unknown analysis_id: {analysis_id}")
        raise HTTPException(status_code=404, detail="Analysis tidak ditemukan")
        
    if request.status == "failed":
        with transaction_manager.transaction() as session:
            analysis = session.query(AnalysisHistory).filter(AnalysisHistory.id == analysis_id).first()
            analysis.status = "failed"
            # Optional: save the error message somewhere if needed
        logger.error(f"Forecasting analysis {analysis_id} failed: {request.error}")
        return StandardResponse(code=200, error=False, message="Callback failed status processed")
        
    # Jika success
    result_data = request.result
    if not result_data:
        raise HTTPException(status_code=400, detail="Result data is missing on success")
        
    trend_data = {
        "product_amount": result_data.product_amount,
        "horizon": result_data.horizon,
        "freq": result_data.freq,
        "results": [p.model_dump() for p in result_data.results],
    }
    
    with transaction_manager.transaction() as session:
        forecasting_result = ForecastingResult(
            analysis_id=analysis_id,
            trend_data=trend_data,
            insight_summary=result_data.insight_summary
        )
        session.add(forecasting_result)
        
        # Update status
        analysis = session.query(AnalysisHistory).filter(AnalysisHistory.id == analysis_id).first()
        analysis.status = "completed"

    logger.info(f"Forecasting analysis {analysis_id} completed successfully")
    return StandardResponse(code=200, error=False, message="Callback success status processed")


async def get_forecasting_result(analysis_id: int, user_id: int, db: Session):
    """Ambil hasil forecasting berdasarkan analysis_id."""

    # 1. Cek analysis_history milik user
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.deleted_at == None
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis tidak ditemukan")

    # 2. Ambil hasil forecasting
    result = db.query(ForecastingResult).filter(
        ForecastingResult.analysis_id == analysis_id
    ).first()
    if not result:
        if analysis.status in ["pending", "processing"]:
            return StandardResponse(
                code=200,
                error=False,
                message="Forecasting sedang diproses",
                data={
                    "analysis_id": analysis_id,
                    "status": analysis.status,
                    "result": None
                }
            )
        elif analysis.status == "failed":
            return StandardResponse(
                code=200,
                error=False,
                message="Forecasting gagal diproses",
                data={
                    "analysis_id": analysis_id,
                    "status": analysis.status,
                    "result": None
                }
            )
        raise HTTPException(status_code=404, detail="Hasil forecasting belum tersedia")

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil hasil forecasting",
        data={
            "analysis_id": analysis_id,
            "status": analysis.status,
            "result": {
                "product_amount": result.trend_data.get("product_amount"),
                "horizon": result.trend_data.get("horizon"),
                "freq": result.trend_data.get("freq"),
                "results": result.trend_data.get("results"),
                "insight_summary": result.insight_summary
            }
        }
    )


async def get_forecasting_history(user_id: int, db: Session):
    """Ambil semua riwayat forecasting milik user."""

    # 1. Ambil semua analysis_history forecasting milik user
    analyses = db.query(AnalysisHistory).join(MLModel).filter(
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.deleted_at == None,
        MLModel.type == "forecasting"
    ).order_by(AnalysisHistory.created_at.desc()).all()

    if not analyses:
        return StandardResponse(
            code=200,
            error=False,
            message="Belum ada riwayat forecasting",
            data=[]
        )

    # 2. Susun response
    history = []
    for analysis in analyses:
        result = db.query(ForecastingResult).filter(
            ForecastingResult.analysis_id == analysis.id
        ).first()

        history.append({
            "analysis_id": analysis.id,
            "dataset_id": analysis.dataset_id,
            "status": analysis.status,
            "created_at": analysis.created_at.isoformat(),
            "result": {
                "product_amount": result.trend_data.get("product_amount") if result else None,
                "horizon": result.trend_data.get("horizon") if result else None,
                "freq": result.trend_data.get("freq") if result else None,
                "results": result.trend_data.get("results") if result else None,
                "insight_summary": result.insight_summary if result else None
            } if result else None
        })

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil riwayat forecasting",
        data=history
    )
