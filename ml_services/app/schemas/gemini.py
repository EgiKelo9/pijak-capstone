from pydantic import BaseModel
from typing import Optional
from app.schemas.features import Feature

class GeminiHealthResponse(BaseModel):
    status: str
    model: str
    detail: Optional[str] = None

class GeminiInsightRequest(BaseModel):
    forecast_data: str

class GeminiInsightResponse(BaseModel):
    insight: str

class GeminiPreprocessResponse(BaseModel):
    insight: Feature

class GeminiPreprocessRequest(BaseModel):
    dataset_id: int
    model_type: str