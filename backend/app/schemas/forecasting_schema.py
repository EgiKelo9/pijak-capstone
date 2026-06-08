from typing import Any, Optional
from pydantic import BaseModel
from app.schemas.base import StandardResponse

# ================================
# REQUEST SCHEMA
# ================================

class ForecastingRunRequest(BaseModel):
    """Request body untuk menjalankan forecasting.

    Field-field ini diteruskan langsung ke ML service:
    - dataset_id     → ID dataset yang digunakan (untuk validasi di backend)
    - col_date       → nama kolom tanggal di dataset
    - col_product    → nama kolom produk di dataset
    - col_target     → nama kolom target (qty/sales) yang akan diprediksi
    - col_regressors → kolom fitur pendukung (boleh kosong [])
    - horizon        → jumlah periode ke depan yang ingin diprediksi
    - freq           → frekuensi data: "D"=daily, "W"=weekly, "M"=monthly
    """
    dataset_id: int
    col_date: str
    col_product: str
    col_target: str
    col_regressors: list[str]
    horizon: int
    freq: str


# ================================
# RESPONSE SCHEMA
# ================================

class TrendDataPoint(BaseModel):
    date: str
    value: float


class FeatureDetail(BaseModel):
    name: str
    mode: float
    mean: float
    max: float
    min: float
    influence: float


class ForecastingMetrics(BaseModel):
    confidence_percentage: float
    confidence_value: float
    mae: float
    mape: float
    mse: float
    rmse: float
    r2: float


class ForecastingResultData(BaseModel):
    """Hasil keseluruhan forecasting dari ML service."""
    metrics: ForecastingMetrics
    trend_data: list[TrendDataPoint]
    feature_importances: list[FeatureDetail]
    insight_summary: str


class ForecastingRunResponse(BaseModel):
    """Response setelah forecasting berhasil dijalankan."""
    analysis_id: int
    status: str
    result: ForecastingResultData


class ForecastingHistoryItem(BaseModel):
    """Item riwayat forecasting dalam list history."""
    analysis_id: int
    dataset_id: Optional[int]
    status: str
    created_at: str
    result: Optional[ForecastingResultData] = None


class ForecastingCallbackRequest(BaseModel):
    """Request dari ML service untuk callback ke backend setelah selesai/gagal."""
    analysis_id: int
    status: str
    error: Optional[str] = None
    result: Optional[ForecastingResultData] = None


# StandardResponse wrappers
ForecastingSuccessResponse = StandardResponse[ForecastingRunResponse]
ForecastingErrorResponse = StandardResponse[None]
ForecastingHistoryResponse = StandardResponse[list[ForecastingHistoryItem]]
