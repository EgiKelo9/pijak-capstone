from pydantic import BaseModel
from typing import List, Optional
from app.schemas.features import Feature
    
class DatasetMetadataRequest(BaseModel):
    dataset_id: int
    model_type: str  # "forecasting", "clustering", atau "both"
    force_reload: bool = False
    
class OpenRouterMappingResponse(BaseModel):
    status: str
    task: str
    suggested_mapping: Optional[Feature] = None

class PreprocessRequest(BaseModel):
    dataset_id: int
    model_type: str  # "forecasting", "clustering", atau "both"
    # force_reload: bool = False


class PreprocessResponse(BaseModel):
    insight: Feature
    dataset_id: Optional[int] = None

class OpenRouterInsightRequest(BaseModel):
    target_task: str
    json_data: str

class OpenRouterInsightResponse(BaseModel):
    insight: str
