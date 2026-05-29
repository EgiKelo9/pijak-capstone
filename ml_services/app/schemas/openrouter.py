from pydantic import BaseModel
from typing import List, Dict, Any, Optional

    
class DatasetMetadataRequest(BaseModel):
    file_path: str
    columns: List[str]
    data_types: Dict[str, str]
    sample_rows: List[Dict[str, Any]]
    target_task: str
    
class ColumnMapping(BaseModel):
    date_column: Optional[str] = None
    target_metrics: List[str] = []
    identifier_column: Optional[str] = None
    feature_columns: List[str] = []
    
class OpenRouterMappingResponse(BaseModel):
    status: str
    task: str
    suggested_mapping: ColumnMapping

class OpenRouterInsightRequest(BaseModel):
    target_task: str
    json_data: str

class OpenRouterInsightResponse(BaseModel):
    insight: str
    