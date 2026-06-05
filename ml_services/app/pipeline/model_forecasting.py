import pandas as pd
import numpy as np
import joblib
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from prophet import Prophet
# import library yang dibutuhkan untuk peramalan harga produk

class ForecastingPipeline:
    def __init__(
        self,
        seasonality_mode: str = "additive",
        weekly_seasonality: bool = True,
        yearly_seasonality: bool = True,
        daily_seasonality: bool = False,
        changepoint_prior_scale: float = 0.1,
        seasonality_prior_scale: float = 10.0,
        use_log_transform: bool = False,
    ):
        self.scaler = StandardScaler()
        self.regressor_scaler = StandardScaler()
        self.model = None
        self.is_fitted = False

        self.train_series = None
        self.test_series = None
        self.train_regressors = None
        self.test_regressors = None
        self.uses_regressors = False
        self.last_predictions = None
        self.freq = None

        self.seasonality_mode = seasonality_mode
        self.weekly_seasonality = weekly_seasonality
        self.yearly_seasonality = yearly_seasonality
        self.daily_seasonality = daily_seasonality
        self.changepoint_prior_scale = changepoint_prior_scale
        self.seasonality_prior_scale = seasonality_prior_scale
        self.use_log_transform = use_log_transform

    def load_series_from_csv(
        self,
        csv_path: str,
        date_column: str = "Order Date",
        target_column: str = "Sales",
        freq: str = "D",
        agg: str = "sum",
        fill_missing: float = 0.0,
    ) -> pd.Series:
        """Load dan agregasi time series dari dataset statik."""
        df = pd.read_csv(csv_path)
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
        df = df.dropna(subset=[date_column, target_column])

        if agg == "sum":
            series = df.groupby(date_column)[target_column].sum().sort_index()
        elif agg == "mean":
            series = df.groupby(date_column)[target_column].mean().sort_index()
        else:
            raise ValueError("agg harus 'sum' atau 'mean'")

        if freq:
            series = series.asfreq(freq, fill_value=fill_missing)
            self.freq = freq
        else:
            inferred = pd.infer_freq(series.index)
            if inferred is None:
                raise ValueError("freq tidak dapat di-infer. Berikan freq secara eksplisit.")
            self.freq = inferred
        return series

    def load_frame_from_csv(
        self,
        csv_path: str,
        date_column: str,
        target_column: str,
        regressor_columns: list[str],
        add_calendar_features: bool = False,
        freq: str = "D",
        agg: str = "sum",
        fill_missing: float = 0.0,
    ) -> tuple[pd.DataFrame, list[str]]:
        """Load data dan agregasi time series + regressors."""
        df = pd.read_csv(csv_path)
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
        for col in regressor_columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")

        df = df.dropna(subset=[date_column, target_column])

        full_regressors = list(regressor_columns)

        if agg == "sum":
            grouped = df.groupby(date_column)[[target_column] + full_regressors].sum().sort_index()
        elif agg == "mean":
            grouped = df.groupby(date_column)[[target_column] + full_regressors].mean().sort_index()
        else:
            raise ValueError("agg harus 'sum' atau 'mean'")

        if freq:
            grouped = grouped.asfreq(freq)
            grouped[target_column] = grouped[target_column].fillna(fill_missing)
            grouped[full_regressors] = grouped[full_regressors].fillna(0.0)
            self.freq = freq
        else:
            inferred = pd.infer_freq(grouped.index)
            if inferred is None:
                raise ValueError("freq tidak dapat di-infer. Berikan freq secara eksplisit.")
            self.freq = inferred

        if add_calendar_features:
            grouped["month"] = grouped.index.month
            grouped["weekofyear"] = grouped.index.isocalendar().week.astype(int)
            full_regressors.extend(["month", "weekofyear"])

        return grouped, full_regressors

    def _split_series(self, series: pd.Series, test_size: float) -> tuple[pd.Series, pd.Series]:
        if not 0.0 < test_size < 1.0:
            raise ValueError("test_size harus di antara 0 dan 1")
        split_index = int(len(series) * (1 - test_size))
        train_series = series.iloc[:split_index]
        test_series = series.iloc[split_index:]
        return train_series, test_series

    def train(self, timeseries_data: pd.Series, test_size: float = 0.2):
        """Melatih model peramalan berdasarkan data historis."""
        if timeseries_data.empty:
            raise ValueError("timeseries_data kosong")

        self.train_series, self.test_series = self._split_series(timeseries_data, test_size)

        train_values = self.train_series.values.reshape(-1, 1)
        if self.use_log_transform:
            train_values = np.log1p(train_values)
        self.scaler.fit(train_values)
        train_scaled = self.scaler.transform(train_values).ravel()

        train_df = pd.DataFrame(
            {
                "ds": self.train_series.index,
                "y": train_scaled,
            }
        )

        self.model = Prophet(
            seasonality_mode=self.seasonality_mode,
            weekly_seasonality=self.weekly_seasonality,
            yearly_seasonality=self.yearly_seasonality,
            daily_seasonality=self.daily_seasonality,
            changepoint_prior_scale=self.changepoint_prior_scale,
            seasonality_prior_scale=self.seasonality_prior_scale,
        )
        self.model.fit(train_df)
        self.is_fitted = True
        self.uses_regressors = False
        return self

    def train_with_regressors(
        self,
        data: pd.DataFrame,
        target_column: str,
        regressor_columns: list[str],
        test_size: float = 0.2,
    ):
        """Melatih model peramalan dengan regressor eksternal."""
        if data.empty:
            raise ValueError("data kosong")

        data = data.sort_index()
        split_index = int(len(data) * (1 - test_size))
        train_df = data.iloc[:split_index]
        test_df = data.iloc[split_index:]

        self.train_series = train_df[target_column]
        self.test_series = test_df[target_column]
        self.train_regressors = train_df[regressor_columns]
        self.test_regressors = test_df[regressor_columns]

        train_values = self.train_series.values.reshape(-1, 1)
        if self.use_log_transform:
            train_values = np.log1p(train_values)
        self.scaler.fit(train_values)
        train_scaled = self.scaler.transform(train_values).ravel()

        self.regressor_scaler.fit(self.train_regressors.values)
        train_reg_scaled = self.regressor_scaler.transform(self.train_regressors.values)

        prophet_train = pd.DataFrame(
            {
                "ds": self.train_series.index,
                "y": train_scaled,
            }
        )
        for idx, col in enumerate(regressor_columns):
            prophet_train[col] = train_reg_scaled[:, idx]

        self.model = Prophet(
            seasonality_mode=self.seasonality_mode,
            weekly_seasonality=self.weekly_seasonality,
            yearly_seasonality=self.yearly_seasonality,
            daily_seasonality=self.daily_seasonality,
            changepoint_prior_scale=self.changepoint_prior_scale,
            seasonality_prior_scale=self.seasonality_prior_scale,
        )
        for col in regressor_columns:
            self.model.add_regressor(col)

        self.model.fit(prophet_train)
        self.is_fitted = True
        self.uses_regressors = True
        return self

    def forecast(self, steps: int | None = None) -> list:
        """Memprediksi N periode ke depan."""
        if not self.is_fitted:
            raise ValueError("Model peramalan belum dilatih!")

        if self.uses_regressors:
            return self.forecast_with_regressors(steps=steps)

        if steps is None:
            if self.test_series is None:
                raise ValueError("steps tidak diberikan dan test_series belum tersedia")
            steps = len(self.test_series)

        if self.freq is None:
            raise ValueError("freq belum tersedia. Gunakan load_series_from_csv() atau set freq.")

        future_df = self.model.make_future_dataframe(periods=steps, freq=self.freq)
        forecast_df = self.model.predict(future_df)
        forecast_scaled = forecast_df["yhat"].tail(steps).to_numpy()
        forecast_values = self.scaler.inverse_transform(forecast_scaled.reshape(-1, 1)).ravel()
        if self.use_log_transform:
            forecast_values = np.expm1(forecast_values)

        self.last_predictions = forecast_values
        return forecast_values.tolist()

    def forecast_with_regressors(
        self,
        steps: int | None = None,
        future_regressors: pd.DataFrame | None = None,
    ) -> list:
        """Forecast dengan regressor eksternal (gunakan test_regressors jika tersedia)."""
        if not self.is_fitted:
            raise ValueError("Model peramalan belum dilatih!")

        if steps is None:
            if self.test_regressors is None:
                raise ValueError("steps tidak diberikan dan test_regressors belum tersedia")
            steps = len(self.test_regressors)

        if future_regressors is None:
            if self.test_regressors is None:
                raise ValueError("future_regressors wajib jika test_regressors tidak tersedia")
            if steps != len(self.test_regressors):
                raise ValueError("steps harus sama dengan panjang test_regressors")
            reg_source = self.test_regressors
            future_ds = reg_source.index
        else:
            reg_source = future_regressors
            future_ds = future_regressors.index

        reg_scaled = self.regressor_scaler.transform(reg_source.values)
        future_df = pd.DataFrame({"ds": future_ds})
        for idx, col in enumerate(reg_source.columns):
            future_df[col] = reg_scaled[:, idx]

        forecast_df = self.model.predict(future_df)
        forecast_scaled = forecast_df["yhat"].to_numpy()
        forecast_values = self.scaler.inverse_transform(forecast_scaled.reshape(-1, 1)).ravel()
        if self.use_log_transform:
            forecast_values = np.expm1(forecast_values)

        self.last_predictions = forecast_values
        return forecast_values.tolist()

    def evaluate(self) -> dict:
        """Hitung metrik evaluasi untuk data test."""
        if self.test_series is None:
            raise ValueError("test_series belum tersedia. Jalankan train() dahulu.")

        y_true = self.test_series.values
        y_pred = self.forecast(steps=len(y_true))

        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)

        non_zero_mask = y_true != 0
        if non_zero_mask.any():
            mape = np.mean(np.abs((y_true[non_zero_mask] - np.array(y_pred)[non_zero_mask]) / y_true[non_zero_mask])) * 100
        else:
            mape = float("nan")

        return {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "mape": float(mape),
            "r2": float(r2),
        }
        
    def save(self, filepath: str):
        """Menyimpan state model ke storage (Pickle/Joblib)"""
        joblib.dump(
            {
                "model": self.model,
                "scaler": self.scaler,
                "regressor_scaler": self.regressor_scaler,
                "config": {
                    "freq": self.freq,
                    "seasonality_mode": self.seasonality_mode,
                    "weekly_seasonality": self.weekly_seasonality,
                    "yearly_seasonality": self.yearly_seasonality,
                    "daily_seasonality": self.daily_seasonality,
                    "changepoint_prior_scale": self.changepoint_prior_scale,
                    "seasonality_prior_scale": self.seasonality_prior_scale,
                    "use_log_transform": self.use_log_transform,
                    "uses_regressors": self.uses_regressors,
                },
            },
            filepath,
        )

    def load(self, filepath: str):
        """Meload state model dari storage untuk melakukan inferensi"""
        data = joblib.load(filepath)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.regressor_scaler = data["regressor_scaler"]
        self.freq = data["config"]["freq"]
        self.seasonality_mode = data["config"]["seasonality_mode"]
        self.weekly_seasonality = data["config"]["weekly_seasonality"]
        self.yearly_seasonality = data["config"]["yearly_seasonality"]
        self.daily_seasonality = data["config"]["daily_seasonality"]
        self.changepoint_prior_scale = data["config"]["changepoint_prior_scale"]
        self.seasonality_prior_scale = data["config"]["seasonality_prior_scale"]
        self.use_log_transform = data["config"]["use_log_transform"]
        self.uses_regressors = data["config"]["uses_regressors"]
        self.is_fitted = True