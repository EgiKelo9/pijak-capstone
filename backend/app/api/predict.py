import os
import httpx
from typing import Any, Dict
from fastapi import APIRouter, HTTPException
from app.schemas.predict import PredictRequest, PredictResponse

router = APIRouter()
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

@router.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Kirim payload ke ML Service (port 8000) dan kembalikan responnya.
    """
    async with httpx.AsyncClient() as client:
        try:
            # Panggil endpoint predict di ML_SERVICE_URL
            response = await client.post(
                f"{ML_SERVICE_URL}/predict",
                # The ML service expects {"data": {store_id, horizon_days, items}} based on PredictRequest
                json={"data": request.data.model_dump()},
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            return PredictResponse(
                ml_forecast=data.get("ml_forecast", {}),
                gemini_insight=data.get("gemini_insight")
            )
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail=f"ML Service error: {e.response.text}")
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Bad Gateway: Unable to connect to ML Service. {e}")
