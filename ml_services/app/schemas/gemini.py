from pydantic import BaseModel
from typing import Optional

class GeminiHealthResponse(BaseModel):
    status: str
    model: str
    detail: Optional[str] = None

class GeminiInsightRequest(BaseModel):
    forecast_data: str

class GeminiInsightResponse(BaseModel):
    insight: str
