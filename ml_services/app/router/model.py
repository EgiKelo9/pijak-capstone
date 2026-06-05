from fastapi import APIRouter, HTTPException
from app.controller.gemma import get_insight_from_gemma
from app.controller.model import generate_dummy_forecast
from app.controller.clustering_controller import run_clustering
from app.schemas.model import PredictRequest, FullPredictResponse, PredictResponseForecast
from app.schemas.clustering_schema import ClusteringRequest, ClusteringResponse, ClusteringErrorResponse

router = APIRouter(prefix="/model")


@router.post(
    "/predict",
    response_model=FullPredictResponse,
    responses={
        422: {"description": "Validation Error — input tidak valid"},
        502: {"description": "LLM tidak bisa dihubungi"}
    }
)
async def predict(request: PredictRequest):
    """
    Endpoint utama untuk prediksi dan insight.
    """
    data = request.data
    if not data.items:
        raise HTTPException(status_code=422, detail="Minimal 1 item diperlukan.")
    if not (1 <= data.horizon_days <= 90):
        raise HTTPException(status_code=422, detail="horizon_days harus antara 1 dan 90.")

    results = [generate_dummy_forecast(item, data.horizon_days) for item in data.items]
    ml_forecast = PredictResponseForecast(
        store_id=data.store_id,
        horizon_days=data.horizon_days,
        results=results,
        used_model="dummy-moving-average-v0.1",
        note="Output ini adalah DUMMY digenerate via local MA."
    )
    insight_text = await get_insight_from_gemma(ml_forecast.model_dump())
    return FullPredictResponse(ml_forecast=ml_forecast, gemini_insight=insight_text)


# clustering endpoint

@router.post(
    "/clustering",
    responses={
        200: {"model": ClusteringResponse, "description": "Clustering berhasil"},
        400: {"model": ClusteringErrorResponse, "description": "Clustering gagal"}
    }
)
async def clustering(request: ClusteringRequest):
    """
    Endpoint untuk menjalankan clustering produk.
    Menerima dataset dan konfigurasi kolom,
    mengembalikan hasil cluster beserta insight dari LLM.
    """
    result = await run_clustering(request)

    if result.status == "failed":
        raise HTTPException(status_code=400, detail=result.error)

    return result