from fastapi import APIRouter, HTTPException
from app.controller.gemma import get_insight_from_gemma
from app.controller.model import generate_dummy_forecast
from app.schemas.model import PredictRequest, FullPredictResponse, PredictResponseForecast

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
