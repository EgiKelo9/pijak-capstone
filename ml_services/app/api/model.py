import random
from typing import Any, Dict, List
from datetime import date, timedelta
from fastapi import APIRouter, HTTPException
from app.api.gemini import get_insight_from_gemini
from app.schemas.model import (
    PredictRequest, 
    FullPredictResponse, 
    HealthResponse,
    PredictResponseForecast,
    ForecastResult,
    ForecastDay,
    ForecastItem
)

router = APIRouter()

# ======================================
# Helper functions untuk endpoint model
# ======================================

def _dummy_forecast(item: ForecastItem, horizon: int) -> ForecastResult:
    history = item.historical_sales or [100.0]
    base = sum(history) / len(history) if history else 100.0

    forecasts = []
    today = date.today()

    for i in range(1, horizon + 1):
        noise = random.uniform(-0.15, 0.20)
        predicted = round(max(0.0, base * (1 + noise)), 2)
        lower_ci = round(max(0.0, predicted * 0.85), 2)
        upper_ci = round(predicted * 1.15, 2)
        
        forecasts.append(ForecastDay(
            date=(today + timedelta(days=i)).isoformat(),
            predicted_qty=predicted,
            lower_ci=lower_ci,
            upper_ci=upper_ci
        ))

    # Trend logic
    if len(forecasts) >= 6:
        first3 = sum(f.predicted_qty for f in forecasts[:3]) / 3
        last3 = sum(f.predicted_qty for f in forecasts[-3:]) / 3
        if last3 > first3 * 1.05:
            trend = "up"
        elif last3 < first3 * 0.95:
            trend = "down"
        else:
            trend = "stable"
    else:
        trend = "stable"

    restock_alert = any(f.predicted_qty < base * 0.80 for f in forecasts)

    return ForecastResult(
        product_id=item.product_id,
        product_name=item.product_name,
        forecast=forecasts,
        trend=trend,
        restock_alert=restock_alert
    )
    
# =======================================
# Endpoint utama untuk prediksi & insight
# =======================================

@router.get("/health", response_model=HealthResponse)
def health_check():
    """
    Health check sederhana untuk ML service itu sendiri.
    Tidak memanggil service lain — cocok untuk load balancer / tunnel probe.
    """
    return HealthResponse(
        status="healthy",
        service="ml-service-fastapi",
        version="1.0.0",
        model="dummy-moving-average"
    )

@router.post(
    "/predict",
    response_model=FullPredictResponse,
    responses={
        422: {"description": "Validation Error — input tidak valid"},
        502: {"description": "Gemini tidak bisa dihubungi"}
    }
)
def predict(request: PredictRequest):
    """
    Endpoint utama untuk prediksi dan insight.
    """
    data = request.data
    if not data.items:
        raise HTTPException(status_code=422, detail="Minimal 1 item diperlukan.")
    if not (1 <= data.horizon_days <= 90):
        raise HTTPException(status_code=422, detail="horizon_days harus antara 1 dan 90.")

    results = [_dummy_forecast(item, data.horizon_days) for item in data.items]
    ml_forecast = PredictResponseForecast(
        store_id=data.store_id,
        horizon_days=data.horizon_days,
        results=results,
        model_used="dummy-moving-average-v0.1",
        note="Output ini adalah DUMMY digenerate via local MA."
    )
    insight_text = get_insight_from_gemini(ml_forecast.model_dump())
    return FullPredictResponse(ml_forecast=ml_forecast, gemini_insight=insight_text)
