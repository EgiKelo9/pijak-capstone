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
    data: Optional[list[dict[str, Any]]] = None
    n_clusters: Optional[int] = None  # None = sistem otomatis cari K optimal, int = user tentukan sendiri

# ================================
# RESPONSE SCHEMA
# ================================

class ClusteringResultData(BaseModel):
    cluster_amount: int
    optimal_k: Optional[int] = None
    silhouette_score: float
    wcss_score: float
    cluster_data: list[dict[str, Any]]
    insight_summary: str
    wcss_list: Optional[list[float]] = None
    silhouette_list: Optional[list[float]] = None
    k_range: Optional[list[int]] = None

class ClusteringRunResponse(BaseModel):
    analysis_id: int
    status: str
    result: ClusteringResultData

class ClusteringCallbackRequest(BaseModel):
    analysis_id: int
    status: str
    error: Optional[str] = None
    result: Optional[ClusteringResultData] = None

# StandardResponse wrappers
ClusteringSuccessResponse = StandardResponse[ClusteringRunResponse]
ClusteringErrorResponse = StandardResponse[None]
