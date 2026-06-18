from typing import Optional, Literal
from pydantic import BaseModel
from app.schemas.base import StandardResponse

# ================================
# REQUEST SCHEMA
# ================================

class ForecastingRunRequest(BaseModel):
    """Request body untuk menjalankan forecasting.

    Field-field ini mencerminkan output Feature dari /preprocess/run:
    - col_product    → Feature.col_product
    - col_target     → Feature.col_target
    - col_date       → Feature.col_date_time.col_whole (sudah di-merge oleh preprocessing)
    - col_regressors → kolom numerik hasil preprocessing (selain target & date)
    - data           → data cleaned yang sudah disimpan/diteruskan dari backend

    Catatan: horizon dan freq tidak perlu dikirim dari frontend karena sudah di-hardcode
    di ML service (daily=30, weekly=10, monthly=3).
    """
    dataset_id: int
    col_date: str
    col_product: Optional[str] = None
    col_target: str
    col_regressors: list[str]
    forecasting_mode: Literal["conservative", "balanced", "aggressive"] = "balanced"


# ================================
# RESPONSE SCHEMA
# ================================

class TrendDataPoint(BaseModel):
    date: str
    actual_value: Optional[float] = None      # nilai historis asli (null untuk titik prediksi)
    predicted_value: Optional[float] = None   # nilai prediksi (null untuk titik historis)


class FeatureDetail(BaseModel):
    name: str
    mode: float
    mean: float
    max: float
    min: float
    influence: float
    is_categorical: bool = False


class ForecastingMetrics(BaseModel):
    confidence_percentage: float
    confidence_value: float
    mae: float
    mape: float
    mse: float
    rmse: float
    r2: float
    forecasting_mode: str = "balanced"


class ForecastingResultData(BaseModel):
    """Hasil keseluruhan forecasting dari ML service."""
    metrics: dict[str, ForecastingMetrics]        # {"daily": ..., "weekly": ...}
    trend_data: dict[str, list[TrendDataPoint]]   # {"daily": [...], "weekly": [...]}
    feature_importances: dict[str, list[FeatureDetail]]
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
