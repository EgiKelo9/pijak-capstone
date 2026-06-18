from fastapi import APIRouter, BackgroundTasks
from app.controller.clustering import run_clustering
from app.controller.forecasting import run_forecasting
from app.schemas.clustering import ClusteringRequest
from app.schemas.forecasting import ForecastingRequest

router = APIRouter(prefix="/model")


@router.post(
    "/clustering",
)
async def clustering(request: ClusteringRequest, background_tasks: BackgroundTasks):
    """
    Endpoint untuk menjalankan clustering produk secara background.
    """
    background_tasks.add_task(run_clustering, request)
    return {"status": "processing", "analysis_id": request.analysis_id}

@router.post(
    "/forecasting",
)
async def forecasting(request: ForecastingRequest, background_tasks: BackgroundTasks):
    """
    Endpoint untuk menjalankan forecasting penjualan per produk secara background.
    Menerima dataset cleaned dari preprocessing beserta konfigurasi kolom,
    menjalankan prediksi secara asinkron, dan mengembalikan 202.
    """
    background_tasks.add_task(run_forecasting, request)

    return {"status": "processing", "analysis_id": request.analysis_id}