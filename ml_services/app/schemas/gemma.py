from pydantic import BaseModel
from typing import Optional

class GemmaHealthResponse(BaseModel):
    status: str
    model: str
    detail: Optional[str] = None

class GemmaInsightRequest(BaseModel):
    forecast_data: str

class GemmaInsightResponse(BaseModel):
    insight: str
