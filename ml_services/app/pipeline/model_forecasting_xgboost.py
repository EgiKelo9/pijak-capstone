import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
from typing import Literal


FORECASTING_MODE_PARAMS: dict[str, dict] = {
    "conservative": {
        "learning_rate": 0.02,
        "max_depth": 3,
        "n_estimators": 350,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "objective": "reg:squarederror",
        "random_state": 42
    },
    "balanced": {
        "learning_rate": 0.05,
        "max_depth": 4,
        "n_estimators": 400,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "objective": "reg:squarederror",
        "random_state": 42
    },
    "aggressive": {
        "learning_rate": 0.1,
        "max_depth": 6,
        "n_estimators": 600,
        "subsample": 0.95,
        "colsample_bytree": 0.95,
        "objective": "reg:squarederror",
        "random_state": 42
    },
}

ForecastingMode = Literal["conservative", "balanced", "aggressive"]


class XGBoostForecastingPipeline:

    def __init__(
        self,
        n_lags: int = 6,
        rolling_windows: list[int] | None = None,
        test_size: float = 0.2,
        model_params: dict | None = None,
        forecasting_mode: ForecastingMode = "balanced",
    ):
        self.n_lags = n_lags
        self.rolling_windows = rolling_windows or [3, 6]
        self.test_size = test_size
        self.forecasting_mode = forecasting_mode

        # Jika model_params diberikan eksplisit gunakan itu,
        # jika tidak gunakan preset berdasarkan mode.
        self.model_params = model_params or FORECASTING_MODE_PARAMS[forecasting_mode]

        self.model = XGBRegressor(**self.model_params)
        self.is_fitted = False
        self.freq = None
        self.feature_columns = None
        self.regressor_columns = None
        self.uses_regressors = False
        
        # Adaptive encoding properties
        self.encoding_strategies = {}
        self.label_encoders = {}
        self.one_hot_columns = []

    def _apply_adaptive_encoding(
        self, df: pd.DataFrame, regressor_columns: list[str], is_training: bool = True
    ) -> tuple[pd.DataFrame, list[str]]:
        from sklearn.preprocessing import LabelEncoder

        new_regressors = list(regressor_columns)

        if is_training:
            self.encoding_strategies = {}
            self.label_encoders = {}
            self.one_hot_columns = []

            for col in regressor_columns:
                if df[col].dtype == "object" or pd.api.types.is_categorical_dtype(df[col]):
                    n_unique = df[col].nunique()
                    if n_unique <= 10:
                        self.encoding_strategies[col] = "one_hot"
                    elif n_unique <= 50:
                        self.encoding_strategies[col] = "label"
                    else:
                        self.encoding_strategies[col] = "drop"

            cols_to_drop = []
            cols_to_add = []

            for col, strategy in self.encoding_strategies.items():
                if strategy == "one_hot":
                    dummies = pd.get_dummies(df[col], prefix=col, dummy_na=False)
                    df = pd.concat([df, dummies], axis=1)
                    cols_to_drop.append(col)
                    cols_to_add.extend(dummies.columns.tolist())
                elif strategy == "label":
                    le = LabelEncoder()
                    df[col] = le.fit_transform(df[col].astype(str))
                    self.label_encoders[col] = le
                elif strategy == "drop":
                    cols_to_drop.append(col)

            if cols_to_drop:
                df = df.drop(columns=cols_to_drop)
                new_regressors = [c for c in new_regressors if c not in cols_to_drop]
                new_regressors.extend(cols_to_add)

            self.one_hot_columns = cols_to_add
            return df, new_regressors

        else:
            cols_to_drop = []
            for col, strategy in self.encoding_strategies.items():
                if col not in df.columns:
                    continue
                if strategy == "one_hot":
                    dummies = pd.get_dummies(df[col], prefix=col, dummy_na=False)
                    df = pd.concat([df, dummies], axis=1)
                    cols_to_drop.append(col)
                elif strategy == "label":
                    le = self.label_encoders[col]
                    known_classes = set(le.classes_)
                    mapped = []
                    for val in df[col].astype(str):
                        if val in known_classes:
                            mapped.append(le.transform([val])[0])
                        else:
                            mapped.append(-1)
                    df[col] = mapped
                elif strategy == "drop":
                    cols_to_drop.append(col)

            if cols_to_drop:
                df = df.drop(columns=cols_to_drop)

            for ohe_col in self.one_hot_columns:
                if ohe_col not in df.columns:
                    df[ohe_col] = 0

            new_regressors = [c for c in regressor_columns if c not in cols_to_drop]
            new_regressors.extend(self.one_hot_columns)

            return df, new_regressors

    @classmethod
    def from_mode(
        cls,
        mode: ForecastingMode,
        horizon: int,
        test_size: float = 0.2,
    ) -> "XGBoostForecastingPipeline":
        """Membuat instance pipeline dengan konfigurasi XGBoost berdasarkan mode."""
        if mode not in FORECASTING_MODE_PARAMS:
            raise ValueError(
                f"Mode '{mode}' tidak valid. Pilih salah satu dari: {list(FORECASTING_MODE_PARAMS.keys())}"
            )

        return cls(
            n_lags=horizon,
            rolling_windows=[
                max(1, int(horizon / 3)),
                max(1, int(horizon / 1.5)),
                horizon,
            ],
            test_size=test_size,
            model_params=FORECASTING_MODE_PARAMS[mode],
            forecasting_mode=mode,
        )

    def load_frame(
        self,
        data: pd.DataFrame,
        date_column: str,
        target_column: str,
        regressor_columns: list[str],
        freq: str = "W",
        agg: str = "sum",
        fill_missing: float = 0.0,
    ) -> tuple[pd.DataFrame, list[str]]:
        df = data.copy()
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
        df = df.dropna(subset=[date_column, target_column])
        
        # Apply adaptive encoding
        df, encoded_regressors = self._apply_adaptive_encoding(df, regressor_columns, is_training=True)

        for col in encoded_regressors:
            if col not in self.encoding_strategies or self.encoding_strategies.get(col) != "label":
                df[col] = pd.to_numeric(df[col], errors="coerce")

        # Set index tanggal sebelum groupby
        df = df.set_index(date_column)

        agg_dict = {target_column: agg}
        for col in encoded_regressors:
            if col in self.encoding_strategies and self.encoding_strategies[col] == "label":
                agg_dict[col] = lambda x: x.mode()[0] if not x.mode().empty else np.nan
            else:
                agg_dict[col] = agg
                
        grouped = df.resample(freq).agg(agg_dict).sort_index()

        grouped[target_column] = grouped[target_column].fillna(fill_missing)
        grouped[encoded_regressors] = grouped[encoded_regressors].fillna(0.0)
        self.freq = freq
        return grouped, encoded_regressors

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
        self.original_regressor_columns = list(regressor_columns)
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
        metrics = self._evaluate(y_test, y_pred)

        # Calculate feature importances with Pearson Correlation direction
        importances = self.model.feature_importances_
        raw_importances = {}
        for col, imp in zip(feature_columns, importances):
            if col in regressor_columns:
                # Calculate correlation with target to determine positive/negative influence
                corr = data[col].corr(data[target_column])
                direction = 1 if pd.isna(corr) or corr >= 0 else -1
                raw_importances[col] = float(imp) * direction
                
        # Normalize to 100% among regressors
        total_imp = sum(abs(v) for v in raw_importances.values())
        norm_importances = {}
        if total_imp > 0:
            for col, val in raw_importances.items():
                norm_importances[col] = round((val / total_imp) * 100, 2)
        else:
            for col in regressor_columns:
                norm_importances[col] = 0.0
                
        metrics["feature_importances"] = norm_importances
        return metrics

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

        # Apply encoding on future data
        future_regressors, _ = self._apply_adaptive_encoding(
            future_regressors, self.original_regressor_columns, is_training=False
        )

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

        # Bootstrapping for Confidence Level (CV of RMSE)
        n_iterations = 1000
        n_size = len(y_true)
        
        if n_size > 0:
            bootstrapped_cv_rmses = []
            bootstrapped_rmses = []
            
            y_t_arr = y_true.values
            y_p_arr = y_pred
            
            for _ in range(n_iterations):
                indices = np.random.choice(n_size, size=n_size, replace=True)
                sample_true = y_t_arr[indices]
                sample_pred = y_p_arr[indices]
                
                sample_mse = mean_squared_error(sample_true, sample_pred)
                sample_rmse = np.sqrt(sample_mse)
                sample_mean_true = np.mean(sample_true)
                
                if sample_mean_true > 0:
                    cv_rmse = sample_rmse / sample_mean_true
                    bootstrapped_cv_rmses.append(cv_rmse)
                    
                bootstrapped_rmses.append(sample_rmse)
                
            if bootstrapped_cv_rmses:
                cv = float(np.mean(bootstrapped_cv_rmses))
                confidence_percentage = max(0.0, min(1.0, 1.0 - cv))
            else:
                confidence_percentage = 0.0
                
            confidence_value = float(np.mean(bootstrapped_rmses))
        else:
            confidence_percentage = 0.0
            confidence_value = 0.0

        return {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "mape": float(mape),
            "r2": float(r2),
            "confidence_percentage": float(confidence_percentage),
            "confidence_value": float(confidence_value),
        }