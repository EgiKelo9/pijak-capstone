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


async def run_forecasting(
    request: ForecastingRequest,
):
    """Controller utama untuk menjalankan forecasting per produk (dipanggil sbg background task)."""
    callback_url = request.callback_url

    try:
        logger.info(f"Step 1: Start forecasting for analysis_id {request.analysis_id}, dataset_id {request.dataset_id}")
        # 1. Load dataset from dataset_id
        df, _ = await get_dataset(request.dataset_id)
        logger.info(f"Step 1 completed: Dataset loaded with shape {df.shape}")
        
        col_date = request.col_date
        col_product = request.col_product
        col_target = request.col_target
        col_regressors = request.col_regressors
        horizon = request.horizon
        freq = request.freq

        # 2. Initialize pipeline and load/aggregate data
        logger.info("Step 2: Initializing pipeline and loading/aggregating data")
        pipeline = XGBoostForecastingPipeline(
            n_lags=horizon,
            rolling_windows=[
                int(horizon / 3),
                int(horizon / 1.5),
                horizon,
            ]
        )
        actual_regressors = [c for c in col_regressors if c in df.columns]

        try:
            df_grouped = pipeline.load_frame(
                data=df,
                date_column=col_date,
                target_column=col_target,
                regressor_columns=actual_regressors,
                freq=freq,
                agg="mean"
            )
        except Exception as e:
            raise ValueError(f"Failed to load and aggregate data: {e}")

        # Cek kelayakan data
        min_rows_needed = 10  # n_lags (6) + rolling_window (6) + beberapa baris test
        if len(df_grouped) < min_rows_needed:
            raise ValueError(f"Insufficient data for forecasting ({len(df_grouped)} rows). Minimum {min_rows_needed} rows required.")

        # 3. Jalankan pipeline (training & validation)
        logger.info("Step 3: Training pipeline for aggregated data")
        # actual_regressors sudah dihitung dan disimpan dari load_frame, gunakan ulang
        actual_regressors = [c for c in col_regressors if c in df_grouped.columns]

        metrics = pipeline.train_with_regressors(
            data=df_grouped,
            target_column=col_target,
            regressor_columns=actual_regressors,
        )
        logger.info(f"Step 3 completed: metrics = {metrics}")

        # Buat future regressors (isi 0 jika tidak ada data masa depan)
        future_index = pd.date_range(
            start=df_grouped.index[-1] + pd.tseries.frequencies.to_offset(pipeline.freq),
            periods=horizon,
            freq=pipeline.freq,
        )
        future_regressors = pd.DataFrame(
            {col: [0.0] * horizon for col in actual_regressors},
            index=future_index,
        )

        # Forecast horizon steps ke depan
        history = df_grouped[col_target]
        predictions = pipeline.forecast_with_regressors(
            steps=horizon,
            history=history,
            future_regressors=future_regressors,
        )

        # Clamp ke nilai non-negatif (qty/sales tidak bisa negatif)
        predictions = [max(0.0, round(p, 4)) for p in predictions]
        
        mae = round(metrics.get("mae", 0.0), 4)
        mape = round(metrics.get("mape", 0.0), 4)
        mse = round(metrics.get("mse", 0.0), 4)
        rmse = round(metrics.get("rmse", 0.0), 4)
        r2 = round(metrics.get("r2", 0.0), 4)
        confidence_percentage = round(metrics.get("confidence_percentage", 0.0), 4)
        confidence_value = round(metrics.get("confidence_value", 0.0), 4)

        # Build trend_data list
        trend_data_list = []
        for date, val in history.items():
            trend_data_list.append(TrendDataPoint(date=date.strftime('%Y-%m-%d'), value=float(val)))
        
        for idx, p_val in zip(future_index, predictions):
            trend_data_list.append(TrendDataPoint(date=idx.strftime('%Y-%m-%d'), value=float(p_val)))

        # Build feature importances
        feature_importances_dict = metrics.get("feature_importances", {})
        feature_details_list = []
        for col, influence in feature_importances_dict.items():
            if col in df_grouped.columns:
                series = df_grouped[col]
                mode_val = series.mode().iloc[0] if not series.mode().empty else 0.0
                mean_val = series.mean()
                max_val = series.max()
                min_val = series.min()
                
                feature_details_list.append(FeatureDetail(
                    name=col,
                    mode=float(mode_val),
                    mean=float(mean_val),
                    max=float(max_val),
                    min=float(min_val),
                    influence=float(influence)
                ))

        # Susun ringkasan untuk dikirim ke LLM
        forecast_summary = {
            "All Products": {
                "predictions": predictions,
                "mae": mae,
                "rmse": rmse,
                "r2": r2,
                "avg_prediction": round(float(np.mean(predictions)), 4),
                "trend": "naik" if predictions[-1] > predictions[0] else "turun",
            }
        }

        # 4. Kirim ringkasan ke LLM → insight_summary
        logger.info(f"Step 4: Getting insight from LLM for {len(forecast_summary)} products")
        insight = await get_insight_from_forecasting(forecast_summary)
        logger.info("Insight generated successfully")

        # 5. Kirim response sukses ke callback_url
        logger.info("Step 5: Sending success callback")
        response_payload = ForecastingResponse(
            analysis_id=request.analysis_id,
            status="completed",
            result=ForecastingResult(
                metrics=ForecastingMetrics(
                    confidence_percentage=confidence_percentage,
                    confidence_value=confidence_value,
                    mae=mae,
                    mape=mape,
                    mse=mse,
                    rmse=rmse,
                    r2=r2,
                ),
                trend_data=trend_data_list,
                feature_importances=feature_details_list,
                insight_summary=insight,
            ),
        )
        
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(callback_url, json=response_payload.model_dump(), timeout=15.0)
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
                resp = await client.patch(callback_url, json=error_payload.model_dump(), timeout=15.0)
                logger.info(f"Error callback sent, response status: {resp.status_code}")
        except Exception as callback_err:
            logger.error(f"Failed to send error callback to {callback_url}: {callback_err}")
