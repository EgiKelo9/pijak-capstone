from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional

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

class PredictResponse(BaseModel):
    ml_forecast: Dict[str, Any]
    gemini_insight: Optional[str] = None
