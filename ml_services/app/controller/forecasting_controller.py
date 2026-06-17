import numpy as np
import pandas as pd
import httpx
import logging

logger = logging.getLogger("uvicorn.error")

from app.core.utils import get_dataset
from app.pipeline.model_forecasting_xgboost import XGBoostForecastingPipeline
from app.controller.openrouter import get_insight_from_forecasting
from app.schemas.forecasting_schema import (
    ForecastingRequest,
    ForecastingResponse,
    ForecastingErrorResponse,
    TrendDataPoint,
    FeatureDetail,
    ForecastingMetrics,
    ForecastingResult,
)
from app.core.config import get_settings

# ====================================================================
# Konfigurasi kombinasi forecasting yang selalu dijalankan sekaligus
# ====================================================================
FORECASTING_COMBINATIONS = [
    {"name": "daily",   "freq": "D",  "horizon": 30},
    {"name": "weekly",  "freq": "W",  "horizon": 10},
]


def _run_single_pipeline(
    df: pd.DataFrame,
    col_date: str,
    col_target: str,
    actual_regressors: list,
    freq: str,
    horizon: int,
    forecasting_mode: str,
) -> tuple[list[TrendDataPoint], dict]:
    """
    Menjalankan satu kombinasi pipeline (frekuensi + horizon tertentu).
    Mengembalikan (trend_data_list, metrics_dict).

    trend_data mencakup:
    - Data historis: actual_value selalu ada; predicted_value juga ada (in-sample prediction)
      untuk titik yang memiliki cukup data lag. Titik awal yang tidak punya cukup lag
      hanya punya actual_value (predicted_value=None).
    - Data prediksi masa depan: actual_value=None, predicted_value=nilai prediksi
    """
    # Inisialisasi pipeline
    pipeline = XGBoostForecastingPipeline.from_mode(
        mode=forecasting_mode,
        horizon=horizon,
    )

    # Load & agregasi data
    df_grouped, valid_regressors = pipeline.load_frame(
        data=df,
        date_column=col_date,
        target_column=col_target,
        regressor_columns=actual_regressors,
        freq=freq,
        agg="mean",
    )

    # Cek kelayakan data
    min_rows_needed = 10
    if len(df_grouped) < min_rows_needed:
        raise ValueError(
            f"[{freq}] Insufficient data ({len(df_grouped)} rows). Minimum {min_rows_needed} rows required."
        )

    # Training
    metrics = pipeline.train_with_regressors(
        data=df_grouped,
        target_column=col_target,
        regressor_columns=valid_regressors,
    )

    # ----------------------------------------------------------------
    # In-sample predictions: prediksi pada rentang historis
    # Model sudah terlatih; gunakan feature_columns yang tersimpan di pipeline
    # ----------------------------------------------------------------
    hist_features = pipeline._build_features_from_frame(
        df_grouped, col_target, valid_regressors
    )
    X_hist = hist_features[pipeline.feature_columns]
    y_hist_pred_raw = pipeline.model.predict(X_hist)
    # Mapping date_str → predicted_value untuk in-sample
    insample_pred_map: dict[str, float] = {
        date_str: max(0.0, round(float(val), 4))
        for date_str, val in zip(
            hist_features.index.strftime("%Y-%m-%d"), y_hist_pred_raw
        )
    }

    # ----------------------------------------------------------------
    # Forecast masa depan
    # ----------------------------------------------------------------
    future_index = pd.date_range(
        start=df_grouped.index[-1] + pd.tseries.frequencies.to_offset(pipeline.freq),
        periods=horizon,
        freq=pipeline.freq,
    )
    future_regressors = pd.DataFrame(
        {col: [0.0] * horizon for col in valid_regressors},
        index=future_index,
    )

    history = df_grouped[col_target]
    predictions = pipeline.forecast_with_regressors(
        steps=horizon,
        history=history,
        future_regressors=future_regressors,
    )
    predictions = [max(0.0, round(p, 4)) for p in predictions]

    # ----------------------------------------------------------------
    # Build trend_data
    # ----------------------------------------------------------------
    trend_data_list: list[TrendDataPoint] = []

    # Historis: actual_value selalu ada; predicted_value dari in-sample map
    for date_idx, val in history.items():
        date_str = date_idx.strftime("%Y-%m-%d")
        trend_data_list.append(
            TrendDataPoint(
                date=date_str,
                actual_value=float(val),
                predicted_value=insample_pred_map.get(date_str),  # None jika lag tidak cukup
            )
        )

    # Masa depan: hanya predicted_value
    for date_idx, p_val in zip(future_index, predictions):
        trend_data_list.append(
            TrendDataPoint(
                date=date_idx.strftime("%Y-%m-%d"),
                actual_value=None,
                predicted_value=float(p_val),
            )
        )

    return trend_data_list, metrics


async def run_forecasting(
    request: ForecastingRequest,
):
    """Controller utama untuk menjalankan 3 kombinasi forecasting sekaligus
    (daily/30, weekly/10, monthly/3) — dipanggil sebagai background task."""
    callback_url = request.callback_url

    try:
        logger.info(
            f"Step 1: Start forecasting for analysis_id {request.analysis_id}, dataset_id {request.dataset_id}"
        )
        # 1. Load dataset
        df, _ = await get_dataset(request.dataset_id)
        logger.info(f"Step 1 completed: Dataset loaded with shape {df.shape}")

        col_date = request.col_date
        col_product = request.col_product
        col_target = request.col_target
        col_regressors = request.col_regressors

        prod_cols = []
        if col_product:
            prod_cols = [col_product] if isinstance(col_product, str) else list(col_product)

        # Regressors aktual = semua kolom selain date, target, dan product
        actual_regressors = [
            c for c in df.columns if c not in [col_date, col_target] and c not in prod_cols
        ]

        # 2. Jalankan kombinasi pipeline secara berurutan
        logger.info("Step 2: Running forecasting combinations (daily/weekly)")

        all_trend_data: dict[str, list[TrendDataPoint]] = {}
        all_metrics: dict[str, ForecastingMetrics] = {}
        all_feature_importances: dict[str, list[FeatureDetail]] = {}
        forecast_summaries: dict = {}

        for combo in FORECASTING_COMBINATIONS:
            name = combo["name"]
            freq = combo["freq"]
            horizon = combo["horizon"]
            logger.info(f"  -> Running combination: {name} (freq={freq}, horizon={horizon})")

            try:
                trend_data_list, metrics = _run_single_pipeline(
                    df=df.copy(),
                    col_date=col_date,
                    col_target=col_target,
                    actual_regressors=list(actual_regressors),
                    freq=freq,
                    horizon=horizon,
                    forecasting_mode=request.forecasting_mode,
                )
                all_trend_data[name] = trend_data_list

                # Calculate metrics for this combo
                mae = round(metrics.get("mae", 0.0), 4)
                mape = round(metrics.get("mape", 0.0), 4)
                mse = round(metrics.get("mse", 0.0), 4)
                rmse = round(metrics.get("rmse", 0.0), 4)
                r2 = round(metrics.get("r2", 0.0), 4)
                confidence_percentage = round(metrics.get("confidence_percentage", 0.0), 4)
                confidence_value = round(metrics.get("confidence_value", 0.0), 4)
                all_metrics[name] = ForecastingMetrics(
                    confidence_percentage=confidence_percentage,
                    confidence_value=confidence_value,
                    mae=mae,
                    mape=mape,
                    mse=mse,
                    rmse=rmse,
                    r2=r2,
                    forecasting_mode=request.forecasting_mode,
                )
                # Build feature importances
                feature_importances_dict = metrics.get("feature_importances", {})
                feature_details_list: list[FeatureDetail] = []
                try:
                    pipeline_for_stats = XGBoostForecastingPipeline.from_mode(
                        mode=request.forecasting_mode, horizon=horizon
                    )
                    df_grouped_combo, _ = pipeline_for_stats.load_frame(
                        data=df.copy(),
                        date_column=col_date,
                        target_column=col_target,
                        regressor_columns=list(actual_regressors),
                        freq=freq,
                        agg="mean",
                    )
                    ohe_columns = set(pipeline_for_stats.one_hot_columns)
                    for col, influence in feature_importances_dict.items():
                        if col in df_grouped_combo.columns:
                            series = df_grouped_combo[col]
                            is_cat = col in ohe_columns
                            feature_details_list.append(
                                FeatureDetail(
                                    name=col,
                                    mode=float(series.mode().iloc[0]) if not series.mode().empty else 0.0,
                                    mean=float(series.mean()),
                                    max=float(series.max()),
                                    min=float(series.min()),
                                    influence=float(influence),
                                    is_categorical=is_cat,
                                )
                            )
                except Exception as fi_err:
                    logger.warning(f"Feature importance stats failed for {name}: {fi_err}")
                all_feature_importances[name] = feature_details_list

                preds = [
                    p.predicted_value
                    for p in trend_data_list
                    if p.actual_value is None and p.predicted_value is not None
                ]
                forecast_summaries[name] = {
                    "predictions": preds,
                    "mae": mae,
                    "rmse": rmse,
                    "r2": r2,
                    "avg_prediction": round(float(np.mean(preds)), 4) if preds else 0.0,
                    "trend": "naik" if preds and preds[-1] > preds[0] else "turun",
                    "freq": freq,
                    "horizon": horizon,
                    "forecasting_mode": request.forecasting_mode,
                }

                logger.info(f"  -> Combination {name} completed. MAE={mae:.4f}")

            except Exception as combo_err:
                logger.warning(f"  -> Combination {name} failed: {combo_err}. Skipping.")
                all_trend_data[name] = []
                all_metrics[name] = ForecastingMetrics(
                    confidence_percentage=0.0,
                    confidence_value=0.0,
                    mae=0.0,
                    mape=0.0,
                    mse=0.0,
                    rmse=0.0,
                    r2=0.0,
                    forecasting_mode=request.forecasting_mode,
                )
                all_feature_importances[name] = []

        # 3. Kirim ke LLM untuk insight
        logger.info(f"Step 3: Getting insight from LLM for {len(forecast_summaries)} combinations")
        insight = await get_insight_from_forecasting(forecast_summaries)
        logger.info("Insight generated successfully")

        # 4. Kirim response sukses ke callback_url
        logger.info("Step 4: Sending success callback")
        response_payload = ForecastingResponse(
            analysis_id=request.analysis_id,
            status="completed",
            result=ForecastingResult(
                metrics=all_metrics,
                trend_data=all_trend_data,
                feature_importances=all_feature_importances,
                insight_summary=insight,
            ),
        )

        try:
            async with httpx.AsyncClient() as client:
                settings = get_settings()
                resp = await client.patch(
                    f"{settings.BACKEND_BASE_URL}{callback_url}", json=response_payload.model_dump(), timeout=15.0
                )
                logger.info(f"Success callback sent, response status: {resp.status_code}")
        except Exception as callback_err:
            logger.error(f"Failed to send success callback to {callback_url}: {callback_err}")

    except Exception as e:
        logger.error(f"Error during forecasting: {e}", exc_info=True)
        error_payload = ForecastingErrorResponse(
            analysis_id=request.analysis_id,
            status="failed",
            error=str(e),
        )
        try:
            logger.info("Attempting to send error callback")
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    callback_url, json=error_payload.model_dump(), timeout=15.0
                )
                logger.info(f"Error callback sent, response status: {resp.status_code}")
        except Exception as callback_err:
            logger.error(f"Failed to send error callback to {callback_url}: {callback_err}")
