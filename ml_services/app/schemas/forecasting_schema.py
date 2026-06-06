from pydantic import BaseModel
from typing import Any, Optional


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
    col_product: str
    col_target: str
    col_regressors: list[str]      # boleh kosong [], model fallback ke lag-only mode
    horizon: int                   # jumlah periode ke depan yang ingin diprediksi
    freq: str                      # frekuensi data: "W" = weekly, "D" = daily, "M" = monthly
    callback_url: str              # URL untuk callback setelah background task selesai


# ================================
# RESPONSE SCHEMA
# ================================

class ForecastingProductResult(BaseModel):
    """Hasil prediksi untuk satu produk"""
    product: str
    predictions: list[float]       # nilai prediksi sejumlah `horizon` periode
    mae: float
    rmse: float
    r2: float


class ForecastingResult(BaseModel):
    """Hasil forecasting yang dikembalikan pipeline"""
    product_amount: int
    horizon: int
    freq: str
    results: list[ForecastingProductResult]
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
