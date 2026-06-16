import os
import httpx
import logging
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.shared.transaction_manager import TransactionManager
from app.models.analysis_history import AnalysisHistory
from app.models.clustering_result import ClusteringResult
from app.models.ml_model import MLModel
from app.models.dataset import Dataset_Bin
from app.schemas.clustering_schema import ClusteringRunRequest, ClusteringCallbackRequest
from app.schemas.base import StandardResponse
from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")
settings = get_settings()

async def run_clustering(request: ClusteringRunRequest, user_id: int, db: Session):
    """Controller untuk menjalankan clustering secara background."""
    transaction_manager = TransactionManager(db)

    # 1. Cek dataset exists
    dataset = db.query(Dataset_Bin).filter(
        Dataset_Bin.id == request.dataset_id,
        Dataset_Bin.is_cleaned == True,
        Dataset_Bin.model == "Clustering",
        Dataset_Bin.deleted_at == None
    ).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset tidak ditemukan")

    # 2. Cek ml_model untuk clustering
    ml_model = db.query(MLModel).filter(
        MLModel.type == "clustering",
        MLModel.deleted_at == None
    ).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="ML model clustering tidak ditemukan")

    # 3. Insert analysis_history dengan status menunggu
    with transaction_manager.transaction() as session:
        analysis = AnalysisHistory(
            user_id=user_id,
            dataset_id=request.dataset_id,
            model_id=ml_model.id,
            status="menunggu"
        )
        session.add(analysis)
        session.flush()
        analysis_id = analysis.id

    # 4. Hit ML service
    backend_base = os.getenv("BACKEND_BASE_URL", "http://localhost:5000")
    callback_url = f"{backend_base}/api/v1/clustering/callback"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=f"{settings.ML_SERVICE_URL}/ml/v1/model/clustering",
                json={
                    "analysis_id": str(analysis_id),
                    "dataset_id": request.dataset_id,
                    "col_product": request.col_product,
                    "col_fitur": request.col_fitur,
                    "n_clusters": request.n_clusters,
                    "callback_url": callback_url
                },
                timeout=15.0  # Timeout singkat karena ML service akan merespons 202 Accepted
            )
            response.raise_for_status()

    except Exception as e:
        # Jika gagal mengirim request ke ML Service
        with transaction_manager.transaction() as session:
            analysis = session.query(AnalysisHistory).filter(
                AnalysisHistory.id == analysis_id
            ).first()
            analysis.status = "gagal"
        
        error_detail = str(e)
        if isinstance(e, httpx.HTTPStatusError):
            error_detail = e.response.json().get("detail", str(e))
            
        raise HTTPException(status_code=502, detail=f"Gagal menghubungi ML service: {error_detail}")

    return StandardResponse(
        code=202,
        error=False,
        message="Clustering sedang diproses di background",
        data={
            "analysis_id": analysis_id,
            "status": "menunggu"
        }
    )


async def handle_clustering_callback(request: ClusteringCallbackRequest, db: Session):
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
            analysis.status = "gagal"
        logger.error(f"Clustering analysis {analysis_id} failed: {request.error}")
        return StandardResponse(code=200, error=False, message="Callback failed status processed")
        
    # Jika success
    result_data = request.result
    if not result_data:
        raise HTTPException(status_code=400, detail="Result data is missing on success")
    
    with transaction_manager.transaction() as session:
        clustering_result = ClusteringResult(
            analysis_id=analysis_id,
            cluster_amount=result_data.cluster_amount,
            optimal_k=result_data.optimal_k,
            silhouette_score=result_data.silhouette_score,
            wcss_score=result_data.wcss_score,
            cluster_data=result_data.cluster_data,
            insight_summary=result_data.insight_summary,
            wcss_list=result_data.wcss_list,
            silhouette_list=result_data.silhouette_list,
            k_range=result_data.k_range
        )
        session.add(clustering_result)
        
        # Update status
        analysis = session.query(AnalysisHistory).filter(AnalysisHistory.id == analysis_id).first()
        analysis.status = "berhasil"

    logger.info(f"Clustering analysis {analysis_id} completed successfully")
    return StandardResponse(code=200, error=False, message="Callback success status processed")


async def get_clustering_result(analysis_id: int, user_id: int, db: Session):
    """Ambil hasil clustering berdasarkan analysis_id."""

    # 1. Cek analysis_history milik user
    analysis = db.query(AnalysisHistory).filter(
        AnalysisHistory.id == analysis_id,
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.deleted_at == None
    ).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis tidak ditemukan")

    # 2. Ambil hasil clustering
    result = db.query(ClusteringResult).filter(
        ClusteringResult.analysis_id == analysis_id
    ).first()
    if not result:
        if analysis.status in ["menunggu", "processing"]:
            return StandardResponse(
                code=200,
                error=False,
                message="Clustering sedang diproses",
                data={
                    "analysis_id": analysis_id,
                    "status": analysis.status,
                    "result": None
                }
            )
        elif analysis.status == "gagal":
            return StandardResponse(
                code=200,
                error=False,
                message="Clustering gagal diproses",
                data={
                    "analysis_id": analysis_id,
                    "status": analysis.status,
                    "result": None
                }
            )
        raise HTTPException(status_code=404, detail="Hasil clustering belum tersedia")

    optimal_k = result.optimal_k
    if optimal_k is None:
        optimal_k = result.cluster_amount
        if result.silhouette_list and result.k_range and len(result.silhouette_list) == len(result.k_range):
            try:
                max_idx = result.silhouette_list.index(max(result.silhouette_list))
                optimal_k = result.k_range[max_idx]
            except Exception:
                pass

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil hasil clustering",
        data={
            "analysis_id": analysis_id,
            "status": analysis.status,
            "result": {
                "cluster_amount": result.cluster_amount,
                "optimal_k": optimal_k,
                "silhouette_score": result.silhouette_score,
                "wcss_score": result.wcss_score,
                "cluster_data": result.cluster_data,
                "insight_summary": result.insight_summary,
                "wcss_list": result.wcss_list,
                "silhouette_list": result.silhouette_list,
                "k_range": result.k_range
            }
        }
    )


async def get_clustering_history(user_id: int, db: Session):
    """Ambil semua riwayat clustering milik user."""

    # 1. Ambil semua analysis_history clustering milik user
    analyses = db.query(AnalysisHistory).join(MLModel).filter(
        AnalysisHistory.user_id == user_id,
        AnalysisHistory.deleted_at == None,
        MLModel.type == "clustering"
    ).order_by(AnalysisHistory.created_at.desc()).all()

    if not analyses:
        return StandardResponse(
            code=200,
            error=False,
            message="Belum ada riwayat clustering",
            data=[]
        )

    # 2. Susun response
    history = []
    for analysis in analyses:
        result = db.query(ClusteringResult).filter(
            ClusteringResult.analysis_id == analysis.id
        ).first()

        history.append({
            "analysis_id": analysis.id,
            "dataset_id": analysis.dataset_id,
            "status": analysis.status,
            "created_at": analysis.created_at.isoformat(),
            "result": {
                "cluster_amount": result.cluster_amount if result else None,
                "optimal_k": (
                    result.optimal_k if result.optimal_k is not None
                    else (
                        result.k_range[result.silhouette_list.index(max(result.silhouette_list))]
                        if result.silhouette_list and result.k_range and len(result.silhouette_list) == len(result.k_range)
                        else result.cluster_amount
                    )
                ) if result else None,
                "silhouette_score": result.silhouette_score if result else None,
                "wcss_score": result.wcss_score if result else None,
                "cluster_data": result.cluster_data if result else None,
                "insight_summary": result.insight_summary if result else None,
                "wcss_list": result.wcss_list if result else None,
                "silhouette_list": result.silhouette_list if result else None,
                "k_range": result.k_range if result else None
            } if result else None
        })

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil riwayat clustering",
        data=history
    )