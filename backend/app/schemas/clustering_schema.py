from typing import Any, Optional
from pydantic import BaseModel
from app.schemas.base import StandardResponse

# ================================
# REQUEST SCHEMA
# ================================

class ClusteringRunRequest(BaseModel):
    dataset_id: int
    col_product: str
    col_fitur: list[str]
    data: list[dict[str, Any]]

# ================================
# RESPONSE SCHEMA
# ================================

class ClusteringResultData(BaseModel):
    cluster_amount: int
    silhouette_score: float
    wcss_score: float
    cluster_data: list[dict[str, Any]]
    insight_summary: str

class ClusteringRunResponse(BaseModel):
    analysis_id: int
    status: str
    result: ClusteringResultData

# StandardResponse wrappers
ClusteringSuccessResponse = StandardResponse[ClusteringRunResponse]
ClusteringErrorResponse = StandardResponse[None]
