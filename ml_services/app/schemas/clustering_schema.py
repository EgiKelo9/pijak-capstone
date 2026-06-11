from pydantic import BaseModel
from typing import Any, Optional

# ================================
# REQUEST SCHEMA
# ================================

class ClusteringRequest(BaseModel):
    """Schema input yang diterima dari frontend/controller"""
    analysis_id: str
    col_product: str
    col_fitur: list[str]
    data: list[dict[str, Any]]
    n_clusters: Optional[int] = None  # None = sistem otomatis cari K optimal, int = user tentukan sendiri


# ================================
# RESPONSE SCHEMA
# ================================

class ProductClusterDetail(BaseModel):
    """Detail satu produk beserta cluster-nya"""
    product: str
    cluster: int


class ClusteringResult(BaseModel):
    """Hasil clustering yang dikembalikan pipeline"""
    cluster_amount: int
    optimal_k: int
    silhouette_score: float
    silhouette_list: list[float]
    wcss_score: float
    wcss_list: list[float]
    k_range: list[int]
    cluster_data: list[dict[str, Any]]
    insight_summary: str


class ClusteringResponse(BaseModel):
    """Response akhir yang dikirim ke frontend"""
    analysis_id: str
    status: str
    result: ClusteringResult


class ClusteringErrorResponse(BaseModel):
    """Response kalau clustering gagal"""
    analysis_id: str
    status: str
    error: str
