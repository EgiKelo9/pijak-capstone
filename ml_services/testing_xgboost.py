from app.pipeline.model_forecasting_xgboost import XGBoostForecastingPipeline


def main():
    pipeline = XGBoostForecastingPipeline(n_lags=12, rolling_windows=[4, 8, 12])

    regressor_columns = ["Discount", "Quantity", "SalesAfterDiscount", "Profit"]

    data = pipeline.load_frame_from_csv(
        csv_path="cleaned_dataset_1.csv",
        date_column="Order Date",
        target_column="Sales",
        regressor_columns=regressor_columns,
        freq="W",
        agg="mean",
    )

    metrics = pipeline.train_with_regressors(
        data=data,
        target_column="Sales",
        regressor_columns=regressor_columns,
    )

    print(metrics)


if __name__ == "__main__":
    main()