from pydantic import BaseModel
from typing import Any, Optional, Literal


# ================================
# REQUEST SCHEMA
# ================================

class ForecastingRequest(BaseModel):
    """Schema input yang diterima dari frontend/backend setelah preprocessing.

    Field-field ini mencerminkan output Feature dari /preprocess/run:
    - col_product    → Feature.col_product
    - col_target     → Feature.col_target
    - col_date       → Feature.col_date_time.col_whole (sudah di-merge oleh preprocessing)
    - col_regressors → kolom numerik hasil preprocessing (selain target & date)
    - data           → data cleaned yang sudah disimpan/diteruskan dari backend
    """
    analysis_id: str
    dataset_id: int
    col_date: str
    col_product: Optional[str] = None
    col_target: str
    col_regressors: list[str]      # boleh kosong [], model fallback ke lag-only mode
    horizon: int                   # jumlah periode ke depan yang ingin diprediksi
    freq: str                      # frekuensi data: "W" = weekly, "D" = daily, "M" = monthly
    callback_url: str              # URL untuk callback setelah background task selesai
    forecasting_mode: Literal["conservative", "balanced", "aggressive"] = "balanced"  # mode forecasting


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
    forecasting_mode: str = "balanced"  # mode yang digunakan saat training


class ForecastingResult(BaseModel):
    """Hasil forecasting yang dikembalikan pipeline"""
    metrics: ForecastingMetrics
    trend_data: list[TrendDataPoint]
    feature_importances: list[FeatureDetail]
    insight_summary: str


class ForecastingResponse(BaseModel):
    """Response akhir yang dikirim ke frontend"""
    analysis_id: str
    status: str
    result: ForecastingResult


class ForecastingErrorResponse(BaseModel):
    """Response kalau forecasting gagal"""
    analysis_id: str
    status: str
    error: str
