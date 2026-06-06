import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor


class XGBoostForecastingPipeline:

    def __init__(
        self,
        n_lags: int = 6,
        rolling_windows: list[int] | None = None,
        test_size: float = 0.2,
        model_params: dict | None = None,
    ):
        self.n_lags = n_lags
        self.rolling_windows = rolling_windows or [3, 6]
        self.test_size = test_size

        self.model_params = model_params or {
            "n_estimators": 400,
            "max_depth": 4,
            "learning_rate": 0.05,
            "subsample": 0.9,
            "colsample_bytree": 0.9,
            "objective": "reg:squarederror",
            "random_state": 42,
        }

        self.model = XGBRegressor(**self.model_params)
        self.is_fitted = False
        self.freq = None
        self.feature_columns = None
        self.regressor_columns = None
        self.uses_regressors = False

    def load_frame(
        self,
        data: pd.DataFrame,
        date_column: str,
        target_column: str,
        regressor_columns: list[str],
        freq: str = "W",
        agg: str = "sum",
        fill_missing: float = 0.0,
    ) -> pd.DataFrame:
        df = data.copy()
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
        for col in regressor_columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")
        df = df.dropna(subset=[date_column, target_column])

        # Set index tanggal sebelum groupby
        df = df.set_index(date_column)

        if agg == "sum":
            grouped = (
                df[[target_column] + regressor_columns]
                .resample(freq)
                .sum()
                .sort_index()
            )
        elif agg == "mean":
            grouped = (
                df[[target_column] + regressor_columns]
                .resample(freq)
                .mean()
                .sort_index()
            )
        else:
            raise ValueError("agg harus 'sum' atau 'mean'")

        grouped[target_column] = grouped[target_column].fillna(fill_missing)
        grouped[regressor_columns] = grouped[regressor_columns].fillna(0.0)
        self.freq = freq
        return grouped

    def _build_features_from_frame(
        self,
        data: pd.DataFrame,
        target_column: str,
        regressor_columns: list[str],
    ) -> pd.DataFrame:
        df = pd.DataFrame({"y": data[target_column]})

        for lag in range(1, self.n_lags + 1):
            df[f"lag_{lag}"] = df["y"].shift(lag)

        for window in self.rolling_windows:
            df[f"roll_mean_{window}"] = (
                df["y"].shift(1).rolling(window).mean()
            )
            df[f"roll_std_{window}"] = df["y"].shift(1).rolling(window).std()

        for col in regressor_columns:
            df[col] = data[col]

        df["month"] = data.index.month
        df["weekofyear"] = data.index.isocalendar().week.astype(int)

        df = df.dropna()
        return df

    def _split_features(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        split_index = int(len(df) * (1 - self.test_size))
        train_df = df.iloc[:split_index]
        test_df = df.iloc[split_index:]
        return train_df, test_df

    def train_with_regressors(
        self,
        data: pd.DataFrame,
        target_column: str,
        regressor_columns: list[str],
    ) -> dict:
        if data.empty:
            raise ValueError("data kosong")

        features = self._build_features_from_frame(
            data, target_column, regressor_columns
        )
        train_df, test_df = self._split_features(features)

        feature_columns = [col for col in train_df.columns if col != "y"]
        self.feature_columns = feature_columns
        self.regressor_columns = regressor_columns

        X_train = train_df[feature_columns]
        y_train = train_df["y"]
        X_test = test_df[feature_columns]
        y_test = test_df["y"]

        self.model.fit(X_train, y_train)
        self.is_fitted = True
        self.uses_regressors = True

        y_pred = self.model.predict(X_test)
        return self._evaluate(y_test, y_pred)

    def forecast_with_regressors(
        self,
        steps: int,
        history: pd.Series,
        future_regressors: pd.DataFrame,
    ) -> list:
        if not self.is_fitted:
            raise ValueError("Model belum dilatih")
        if self.regressor_columns is None:
            raise ValueError("regressor_columns belum tersedia")
        if steps != len(future_regressors):
            raise ValueError("steps harus sama dengan panjang future_regressors")

        preds = []
        series = history.copy()

        for idx in range(steps):
            row = future_regressors.iloc[[idx]]
            frame = pd.DataFrame({"y": series})

            for lag in range(1, self.n_lags + 1):
                frame[f"lag_{lag}"] = frame["y"].shift(lag)

            for window in self.rolling_windows:
                frame[f"roll_mean_{window}"] = (
                    frame["y"].shift(1).rolling(window).mean()
                )
                frame[f"roll_std_{window}"] = (
                    frame["y"].shift(1).rolling(window).std()
                )

            frame["month"] = series.index.month
            frame["weekofyear"] = series.index.isocalendar().week.astype(int)

            for col in self.regressor_columns:
                frame[col] = np.nan

            for col in self.regressor_columns:
                frame.iloc[-1, frame.columns.get_loc(col)] = row[col].values[0]

            frame = frame.dropna()

            if frame.empty:
                raise ValueError(f"Frame kosong pada iterasi ke-{idx}.")

            X_latest = frame[self.feature_columns].iloc[-1:].copy()
            y_pred = self.model.predict(X_latest)[0]
            preds.append(float(y_pred))

            next_index = series.index[-1] + pd.tseries.frequencies.to_offset(
                self.freq
            )
            series = pd.concat(
                [series, pd.Series([y_pred], index=[next_index])]
            )

        return preds

    def _evaluate(self, y_true: pd.Series, y_pred: np.ndarray) -> dict:
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)

        non_zero_mask = y_true != 0
        if non_zero_mask.any():
            mape = (
                np.mean(
                    np.abs(
                        (y_true[non_zero_mask] - y_pred[non_zero_mask])
                        / y_true[non_zero_mask]
                    )
                )
                * 100
            )
        else:
            mape = float("nan")

        return {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "mape": float(mape),
            "r2": float(r2),
        }