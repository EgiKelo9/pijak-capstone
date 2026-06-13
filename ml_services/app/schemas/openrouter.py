from pydantic import BaseModel, UUID5
from typing import List, Optional, Dict, Any
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
    job_id: str


class PreprocessResponse(BaseModel):
    insight: Feature

class OpenRouterInsightRequest(BaseModel):
    target_task: str
    json_data: str

# New chatbot request/response models
class ChatbotRequest(BaseModel):
    task_id: str
    target: str  # "forecasting" or "clustering"
    message: str
    attachment: Optional[Any] = None

class ChatbotResponse(BaseModel):
    message: str
    metadata: Optional[Dict] = None

class OpenRouterInsightResponse(BaseModel):
    insight: str