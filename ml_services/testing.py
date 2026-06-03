from app.pipeline.model_forecasting import ForecastingPipeline

def main():
    pipeline = ForecastingPipeline()

    regressor_columns = ["Discount", "Quantity", "SalesAfterDiscount", "Profit"]

    data, regressor_columns = pipeline.load_frame_from_csv(
        csv_path="cleaned_dataset_1.csv",
        date_column="Order Date",
        target_column="Sales",
        regressor_columns=regressor_columns,
        add_calendar_features=False,
        freq="W",
        agg="mean",
    )

    pipeline.train_with_regressors(
        data=data,
        target_column="Sales",
        regressor_columns=regressor_columns,
        test_size=0.2,
    )
    _ = pipeline.forecast()
    metrics = pipeline.evaluate()

    # Summary (Prophet + regressors, weekly, mean aggregation):
    # Latest run -> R2 ~ 0.665, MAPE ~ 66.6, RMSE ~ 110.
    # Good baseline but not near 0.8+; next step is to try other models.
    print(metrics)


if __name__ == "__main__":
    main()