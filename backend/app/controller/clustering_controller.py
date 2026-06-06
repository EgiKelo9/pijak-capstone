import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.shared.transaction_manager import TransactionManager
from app.models.analysis_history import AnalysisHistory
from app.models.clustering_result import ClusteringResult
from app.models.ml_model import MLModel
from app.models.dataset import Dataset
from app.schemas.clustering_schema import ClusteringRunRequest
from app.schemas.base import StandardResponse
from app.core.config import get_settings

settings = get_settings()

async def run_clustering(request: ClusteringRunRequest, user_id: int, db: Session):
    """Controller untuk menjalankan clustering dan menyimpan hasilnya ke DB."""
    transaction_manager = TransactionManager(db)

    # 1. Cek dataset exists
    dataset = db.query(Dataset).filter(
        Dataset.id == request.dataset_id,
        Dataset.deleted_at == None
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

    # 3. Insert analysis_history dengan status processing
    with transaction_manager.transaction() as session:
        analysis = AnalysisHistory(
            user_id=user_id,
            dataset_id=request.dataset_id,
            model_id=ml_model.id,
            status="processing"
        )
        session.add(analysis)
        session.flush()
        analysis_id = analysis.id

    # 4. Hit ML service
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=f"{settings.ML_SERVICE_URL}/ml/v1/model/clustering",
                json={
                    "analysis_id": str(analysis_id),
                    "col_product": request.col_product,
                    "col_fitur": request.col_fitur,
                    "data": request.data
                },
                timeout=120.0
            )
            response.raise_for_status()
            ml_result = response.json()["result"]

    except Exception as e:
        with transaction_manager.transaction() as session:
            analysis = session.query(AnalysisHistory).filter(
                AnalysisHistory.id == analysis_id
            ).first()
            analysis.status = "failed"
        raise HTTPException(status_code=502, detail=f"ML service error: {str(e)}")

    # 5. Simpan hasil ke clustering_results
    with transaction_manager.transaction() as session:
        clustering_result = ClusteringResult(
            analysis_id=analysis_id,
            cluster_amount=ml_result["cluster_amount"],
            silhouette_score=ml_result["silhouette_score"],
            wcss_score=ml_result["wcss_score"],
            cluster_data=ml_result["cluster_data"],
            insight_summary=ml_result["insight_summary"]
        )
        session.add(clustering_result)

    # 6. Update status analysis_history jadi completed
    with transaction_manager.transaction() as session:
        analysis = session.query(AnalysisHistory).filter(
            AnalysisHistory.id == analysis_id
        ).first()
        analysis.status = "completed"

    return StandardResponse(
        code=200,
        error=False,
        message="Clustering berhasil dijalankan",
        data={
            "analysis_id": analysis_id,
            "status": "completed",
            "result": ml_result
        }
    )


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
        raise HTTPException(status_code=404, detail="Hasil clustering belum tersedia")

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil hasil clustering",
        data={
            "analysis_id": analysis_id,
            "status": analysis.status,
            "result": {
                "cluster_amount": result.cluster_amount,
                "silhouette_score": result.silhouette_score,
                "wcss_score": result.wcss_score,
                "cluster_data": result.cluster_data,
                "insight_summary": result.insight_summary
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
                "silhouette_score": result.silhouette_score if result else None,
                "wcss_score": result.wcss_score if result else None,
                "cluster_data": result.cluster_data if result else None,
                "insight_summary": result.insight_summary if result else None
            } if result else None
        })

    return StandardResponse(
        code=200,
        error=False,
        message="Berhasil mengambil riwayat clustering",
        data=history
    )