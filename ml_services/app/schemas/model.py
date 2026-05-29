from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional, Union

class ForecastItem(BaseModel):
    product_id: str
    product_name: str
    historical_sales: List[float] = Field(default_factory=list)

class PredictRequestData(BaseModel):
    store_id: str = "UNKNOWN"
    horizon_days: int = 7
    items: List[ForecastItem] = Field(default_factory=list)

class PredictRequest(BaseModel):
    data: PredictRequestData

class ForecastDay(BaseModel):
    date: str
    predicted_qty: float
    lower_ci: float
    upper_ci: float

class ForecastResult(BaseModel):
    product_id: Optional[str]
    product_name: Optional[str]
    forecast: List[ForecastDay]
    trend: str
    restock_alert: bool

class PredictResponseForecast(BaseModel):
    store_id: str
    horizon_days: int
    results: List[ForecastResult]
    used_model: str
    note: str

class FullPredictResponse(BaseModel):
    ml_forecast: PredictResponseForecast
    gemini_insight: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    model: Optional[str] = None

# class TestRun(BaseModel):
#     dataset_id: int
#     model: str
