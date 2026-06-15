from typing import Any, Optional
from pydantic import BaseModel
from app.schemas.base import StandardResponse


# REQUEST SCHEMA
class ClusteringRunRequest(BaseModel):
    dataset_id: int
    col_product: str
    col_fitur: list[str]
    data: list[dict[str, Any]]
    n_clusters: Optional[int] = None  # None = sistem otomatis cari K optimal, int = user tentukan sendiri


# RESPONSE SCHEMA
class ClusteringResultData(BaseModel):
    cluster_amount: int
    optimal_k: int
    silhouette_score: float
    silhouette_list: list[float]
    wcss_score: float
    wcss_list: list[float]
    k_range: list[int]
    cluster_data: list[dict[str, Any]]
    insight_summary: str

class ClusteringRunResponse(BaseModel):
    analysis_id: int
    status: str
    result: ClusteringResultData


ClusteringSuccessResponse = StandardResponse[ClusteringRunResponse]
ClusteringErrorResponse = StandardResponse[None]
