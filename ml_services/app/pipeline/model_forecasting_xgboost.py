import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
from typing import Literal
 
 
# ─────────────────────────────────────────────────────────────────────────────
# Preset hyperparameter per mode
# ─────────────────────────────────────────────────────────────────────────────
 
FORECASTING_MODE_PARAMS: dict[str, dict] = {
    "conservative": {
        "learning_rate": 0.02,
        "max_depth": 3,
        "n_estimators": 350,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "min_child_weight": 5,       # [NEW] cegah overfit pada data kecil
        "reg_alpha": 0.1,            # [NEW] L1 regularization
        "reg_lambda": 2.0,           # [NEW] L2 regularization (lebih kuat)
        "objective": "reg:squarederror",
        "random_state": 42,
    },
    "balanced": {
        "learning_rate": 0.05,
        "max_depth": 4,
        "n_estimators": 400,
        "subsample": 0.9,
        "colsample_bytree": 0.9,
        "min_child_weight": 3,       # [NEW]
        "reg_alpha": 0.05,           # [NEW]
        "reg_lambda": 1.5,           # [NEW]
        "objective": "reg:squarederror",
        "random_state": 42,
    },
    "aggressive": {
        "learning_rate": 0.1,
        "max_depth": 6,
        "n_estimators": 600,
        "subsample": 0.95,
        "colsample_bytree": 0.95,
        "min_child_weight": 1,       # [NEW]
        "reg_alpha": 0.01,           # [NEW]
        "reg_lambda": 1.0,           # [NEW]
        "objective": "reg:squarederror",
        "random_state": 42,
    },
}
 
# [NEW] Preset parameter khusus untuk dataset kecil (< MIN_ROWS_FULL_PARAMS baris)
# Mencegah overfitting yang menjadi sumber utama MAPE tinggi pada data mingguan.
SMALL_DATA_PARAMS: dict = {
    "learning_rate": 0.03,
    "max_depth": 2,
    "n_estimators": 150,
    "subsample": 0.8,
    "colsample_bytree": 0.8,
    "min_child_weight": 10,
    "reg_alpha": 0.2,
    "reg_lambda": 3.0,
    "objective": "reg:squarederror",
    "random_state": 42,
}
 
# Threshold jumlah baris fitur (setelah dropna) untuk beralih ke SMALL_DATA_PARAMS
MIN_ROWS_FULL_PARAMS = 80
 
ForecastingMode = Literal["conservative", "balanced", "aggressive"]
 
 
# ─────────────────────────────────────────────────────────────────────────────
# Helper: deteksi frekuensi & konfigurasi dinamis
# ─────────────────────────────────────────────────────────────────────────────
 
def _detect_freq_from_series(index: pd.DatetimeIndex) -> str:
    """
    [NEW] Deteksi otomatis frekuensi dari DatetimeIndex berdasarkan median gap
    antar tanggal. Mengembalikan alias pandas ('D', 'W', 'ME', dst.).
    """
    if len(index) < 2:
        return "D"
    diffs = pd.Series(index).diff().dropna()
    median_days = diffs.median().days
    if median_days <= 1:
        return "D"
    elif median_days <= 8:
        return "W"
    elif median_days <= 16:
        return "W"       # bi-weekly → perlakukan sebagai mingguan
    elif median_days <= 35:
        return "ME"
    elif median_days <= 100:
        return "QE"
    else:
        return "YE"
 
 
def _dynamic_horizon_config(
    n_rows_raw: int,
    freq: str,
    requested_horizon: int,
) -> dict:
    """
    [NEW] Hitung n_lags, rolling_windows, dan horizon yang disarankan secara
    dinamis berdasarkan:
      - Jumlah baris data mentah
      - Frekuensi (harian, mingguan, bulanan …)
      - Horizon yang diminta pengguna
 
    Prinsip:
      - n_lags ≈ 1 siklus musiman penuh sesuai frekuensi, minimal 2x horizon.
      - Rolling windows dipilih untuk menangkap tren jangka pendek, menengah,
        dan panjang (25%, 50%, 100% dari n_lags).
      - Jika data terlalu sedikit, n_lags dikecilkan agar sisa baris setelah
        dropna tetap ≥ MIN_ROWS_FULL_PARAMS.
      - Horizon dikap agar tidak melebihi 20% panjang data (forecast terlalu
        jauh ke depan cenderung tidak akurat).
    """
    # Siklus musiman alami per frekuensi
    _SEASONAL_CYCLE = {
        "D":  7,    # 1 minggu
        "W":  8,    # ~2 bulan (8 minggu) — cukup untuk tren bulanan
        "ME": 6,    # setengah tahun
        "QE": 4,    # 1 tahun
        "YE": 3,
    }
    base_freq = freq.upper().split("-")[0]
    seasonal_cycle = _SEASONAL_CYCLE.get(base_freq, 7)
 
    # n_lags: terbesar antara 2x horizon dan 1 siklus musiman
    n_lags_ideal = max(requested_horizon * 2, seasonal_cycle)
 
    # Estimasi baris yang hilang akibat dropna = n_lags + max_window
    # max_window ≈ n_lags itu sendiri (rolling window terbesar = n_lags)
    rows_lost = n_lags_ideal * 2
    rows_remaining = n_rows_raw - rows_lost
 
    # Jika sisa baris < 30 (minimum untuk model yang berarti), kurangi n_lags
    if rows_remaining < 30:
        # Cari n_lags terbesar yang menyisakan ≥ 30 baris
        n_lags_ideal = max(2, (n_rows_raw - 30) // 3)
 
    # Kap horizon agar ≤ 20% data (prediksi jauh ke depan = error kumulatif besar)
    max_safe_horizon = max(1, int(n_rows_raw * 0.20))
    recommended_horizon = min(requested_horizon, max_safe_horizon)
 
    n_lags = n_lags_ideal
    rolling_windows = [
        max(2, n_lags // 4),
        max(3, n_lags // 2),
        n_lags,
    ]
 
    return {
        "n_lags": n_lags,
        "rolling_windows": rolling_windows,
        "recommended_horizon": recommended_horizon,
        "capped": recommended_horizon < requested_horizon,
    }
 
 
# ─────────────────────────────────────────────────────────────────────────────
# Pipeline utama
# ─────────────────────────────────────────────────────────────────────────────
 
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
 
    # ── [NEW] Factory dari mode + auto-config ─────────────────────────────────
    @classmethod
    def from_mode(
        cls,
        mode: ForecastingMode,
        horizon: int,
        test_size: float = 0.2,
        n_rows_hint: int | None = None,
        freq_hint: str | None = None,
    ) -> "XGBoostForecastingPipeline":
        """
        Membuat instance pipeline dengan konfigurasi yang disesuaikan secara
        dinamis terhadap ukuran dataset dan frekuensi data.
 
        Parameter baru:
          n_rows_hint  – jumlah baris data mentah (sebelum resample).
                         Jika diberikan, n_lags & rolling_windows dihitung
                         secara otomatis agar tidak membuang terlalu banyak data.
          freq_hint    – frekuensi data ('D', 'W', 'ME', …).
                         Digunakan untuk menentukan siklus musiman yang tepat.
 
        Mengembalikan instance siap pakai. Properti `horizon_config` pada
        instance berisi detail konfigurasi yang dipilih (untuk keperluan debug).
        """
        if mode not in FORECASTING_MODE_PARAMS:
            raise ValueError(
                f"Mode '{mode}' tidak valid. Pilih salah satu dari: "
                f"{list(FORECASTING_MODE_PARAMS.keys())}"
            )
 
        freq = freq_hint or "D"
        n_rows = n_rows_hint or 200  # asumsi default jika tidak diketahui
 
        cfg = _dynamic_horizon_config(n_rows, freq, horizon)
        n_lags = cfg["n_lags"]
        rolling_windows = cfg["rolling_windows"]
 
        instance = cls(
            n_lags=n_lags,
            rolling_windows=rolling_windows,
            test_size=test_size,
            model_params=FORECASTING_MODE_PARAMS[mode],
            forecasting_mode=mode,
        )
        # Simpan info konfigurasi agar bisa diinspeksi setelah training
        instance.horizon_config = cfg
        return instance
 
    # ── Adaptive encoding ─────────────────────────────────────────────────────
 
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
                    mapped = [
                        le.transform([v])[0] if v in known_classes else -1
                        for v in df[col].astype(str)
                    ]
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
 
    # ── load_frame ────────────────────────────────────────────────────────────
 
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
        # Normalisasi alias frekuensi deprecated di pandas ≥ 2.2
        _FREQ_ALIAS_MAP = {"M": "ME", "Q": "QE", "Y": "YE", "A": "YE"}
        freq = _FREQ_ALIAS_MAP.get(freq.upper().split("-")[0], freq)
 
        df = data.copy()
        df[date_column] = pd.to_datetime(df[date_column], errors="coerce")
        df[target_column] = pd.to_numeric(df[target_column], errors="coerce")
        df = df.dropna(subset=[date_column, target_column])
 
        df, encoded_regressors = self._apply_adaptive_encoding(
            df, regressor_columns, is_training=True
        )
 
        for col in encoded_regressors:
            if col not in self.encoding_strategies or self.encoding_strategies.get(col) != "label":
                df[col] = pd.to_numeric(df[col], errors="coerce")
 
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
 
    # ── [IMPROVED] Feature engineering ───────────────────────────────────────
 
    def _build_features_from_frame(
        self,
        data: pd.DataFrame,
        target_column: str,
        regressor_columns: list[str],
    ) -> pd.DataFrame:
        df = pd.DataFrame({"y": data[target_column]})
 
        # Lag features
        for lag in range(1, self.n_lags + 1):
            df[f"lag_{lag}"] = df["y"].shift(lag)
 
        # Rolling statistics (mean & std — sudah ada sebelumnya)
        for window in self.rolling_windows:
            shifted = df["y"].shift(1)
            df[f"roll_mean_{window}"] = shifted.rolling(window).mean()
            df[f"roll_std_{window}"] = shifted.rolling(window).std()
 
        # [NEW] Rolling median — lebih robust terhadap outlier vs mean
        for window in self.rolling_windows:
            df[f"roll_median_{window}"] = df["y"].shift(1).rolling(window).median()
 
        # [NEW] Exponential Weighted Mean — tangkap tren terkini lebih baik
        for span in self.rolling_windows:
            df[f"ewm_{span}"] = df["y"].shift(1).ewm(span=span, adjust=False).mean()
 
        # [NEW] Momentum: selisih antara nilai saat ini dan beberapa lag ke belakang
        # Membantu model mendeteksi apakah tren sedang naik atau turun.
        for lag in [1, min(3, self.n_lags), min(self.n_lags, max(self.rolling_windows))]:
            df[f"diff_{lag}"] = df["y"].diff(lag)
 
        # [NEW] Percent change (growth rate) — berguna jika target punya skala besar
        df["pct_change_1"] = df["y"].pct_change(1).replace([np.inf, -np.inf], np.nan)
        df["pct_change_short"] = df["y"].pct_change(
            min(3, self.n_lags)
        ).replace([np.inf, -np.inf], np.nan)
 
        # [NEW] Rasio lag terhadap rolling mean — fitur relatif yang skala-invariant
        # Membantu mengurangi MAPE pada deret dengan volatilitas tinggi.
        roll_mean_mid = df.get(
            f"roll_mean_{self.rolling_windows[1] if len(self.rolling_windows) > 1 else self.rolling_windows[0]}"
        )
        if roll_mean_mid is not None:
            df["lag1_vs_rollmean"] = df["lag_1"] / (roll_mean_mid + 1e-8)
 
        # Regressor columns
        for col in regressor_columns:
            df[col] = data[col]
 
        # Fitur kalender
        df["month"] = data.index.month
        df["weekofyear"] = data.index.isocalendar().week.astype(int)
        df["quarter"] = data.index.quarter
        df["dayofweek"] = data.index.dayofweek
 
        # [NEW] Fitur kalender tambahan
        df["is_month_start"] = data.index.is_month_start.astype(int)
        df["is_month_end"] = data.index.is_month_end.astype(int)
        df["is_quarter_start"] = data.index.is_quarter_start.astype(int)
        df["is_quarter_end"] = data.index.is_quarter_end.astype(int)
 
        df = df.dropna()
        return df
 
    # ── Split helpers ─────────────────────────────────────────────────────────
 
    def _split_features(self, df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
        split_index = int(len(df) * (1 - self.test_size))
        return df.iloc[:split_index], df.iloc[split_index:]
 
    def _walk_forward_splits(
        self, df: pd.DataFrame, n_splits: int = 5
    ) -> list[tuple[pd.DataFrame, pd.DataFrame]]:
        """
        Walk-Forward Cross-Validation dengan expanding window.
 
        [IMPROVED] n_splits dikurangi secara otomatis jika data terlalu sedikit,
        sekaligus memastikan setiap fold test memiliki minimal MIN_FOLD_TEST_SIZE
        baris agar metrik per-fold tidak terlalu noisy.
 
          Fold 1: Train [0%–60%]  → Test [60%–68%]
          Fold 2: Train [0%–68%]  → Test [68%–76%]
          …dst.
        """
        MIN_FOLD_TEST_SIZE = 5   # [NEW] minimal baris per test fold
 
        n = len(df)
        min_train_ratio = 1.0 - self.test_size
        min_train_size = int(n * min_train_ratio)
 
        remaining = n - min_train_size
        # Kurangi n_splits agar setiap fold punya cukup baris
        while n_splits > 1 and remaining // n_splits < MIN_FOLD_TEST_SIZE:
            n_splits -= 1
        n_splits = max(1, min(n_splits, remaining))
 
        fold_size = max(1, remaining // n_splits)
        splits = []
        for i in range(n_splits):
            train_end = min_train_size + i * fold_size
            test_end = train_end + fold_size if i < n_splits - 1 else n
            train_df = df.iloc[:train_end]
            test_df = df.iloc[train_end:test_end]
            if not train_df.empty and not test_df.empty:
                splits.append((train_df, test_df))
        return splits
 
    # ── [NEW] Adaptive model params berdasarkan ukuran data ──────────────────
 
    def _resolve_model_params(self, n_feature_rows: int) -> dict:
        """
        Jika data terlalu sedikit untuk preset mode yang dipilih, gunakan
        SMALL_DATA_PARAMS yang lebih konservatif untuk menghindari overfitting.
        Konfigurasi yang benar-benar dipakai disimpan ke self._active_params.
        """
        if n_feature_rows < MIN_ROWS_FULL_PARAMS:
            params = SMALL_DATA_PARAMS.copy()
            # Pertahankan random_state dari mode asli
            params["random_state"] = self.model_params.get("random_state", 42)
            self._params_source = "small_data_override"
        else:
            params = self.model_params.copy()
            self._params_source = self.forecasting_mode
        self._active_params = params
        return params
 
    # ── train_with_regressors ─────────────────────────────────────────────────
 
    def train_with_regressors(
        self,
        data: pd.DataFrame,
        target_column: str,
        regressor_columns: list[str],
        n_splits: int = 5,
    ) -> dict:
        """
        Melatih model menggunakan Walk-Forward Cross-Validation.
 
        [IMPROVED] Perubahan dari versi sebelumnya:
        - Model params disesuaikan secara otomatis jika data < 80 baris.
        - Feature engineering diperluas (ewm, diff, pct_change, ratio).
        - n_lags & rolling_windows sudah dihitung secara dinamis di from_mode.
        - Metrik tambahan: SMAPE (lebih robust vs MAPE untuk nilai mendekati 0).
        """
        self.original_regressor_columns = list(regressor_columns)
        if data.empty:
            raise ValueError("data kosong")
 
        features = self._build_features_from_frame(
            data, target_column, regressor_columns
        )
 
        if len(features) < 10:
            raise ValueError(
                f"Terlalu sedikit data untuk training ({len(features)} baris setelah "
                f"feature engineering). Tambah rentang data atau kurangi n_lags "
                f"(saat ini n_lags={self.n_lags})."
            )
 
        feature_columns = [col for col in features.columns if col != "y"]
        self.feature_columns = feature_columns
        self.regressor_columns = regressor_columns
 
        # [NEW] Pilih params yang sesuai ukuran data
        active_params = self._resolve_model_params(len(features))
 
        # ── Walk-Forward CV ───────────────────────────────────────────────────
        splits = self._walk_forward_splits(features, n_splits=n_splits)
 
        fold_metrics: list[dict] = []
        for fold_idx, (train_df, test_df) in enumerate(splits):
            X_tr = train_df[feature_columns]
            y_tr = train_df["y"]
            X_te = test_df[feature_columns]
            y_te = test_df["y"]
 
            fold_model = XGBRegressor(**active_params)
            fold_model.fit(X_tr, y_tr)
            y_pred_fold = fold_model.predict(X_te)
 
            m = self._evaluate(y_te, y_pred_fold)
            fold_metrics.append(m)
 
        # Rata-rata metrik dari semua fold
        numeric_keys = [
            "mae", "mse", "rmse", "mape", "smape", "r2",
            "confidence_percentage", "confidence_value",
        ]
        metrics: dict = {}
        for key in numeric_keys:
            vals = [
                fm[key]
                for fm in fold_metrics
                if not np.isnan(fm.get(key, float("nan")))
            ]
            metrics[key] = float(np.mean(vals)) if vals else float("nan")
 
        # ── Model final: latih dengan SELURUH data ───────────────────────────
        self.model = XGBRegressor(**active_params)
        self.model.fit(features[feature_columns], features["y"])
        self.is_fitted = True
        self.uses_regressors = True
 
        # ── Feature importances ───────────────────────────────────────────────
        importances = self.model.feature_importances_
        raw_importances = {}
        for col, imp in zip(feature_columns, importances):
            if col in regressor_columns:
                corr = data[col].corr(data[target_column])
                direction = 1 if pd.isna(corr) or corr >= 0 else -1
                raw_importances[col] = float(imp) * direction
 
        total_imp = sum(abs(v) for v in raw_importances.values())
        norm_importances = {}
        if total_imp > 0:
            for col, val in raw_importances.items():
                norm_importances[col] = round((val / total_imp) * 100, 2)
        else:
            for col in regressor_columns:
                norm_importances[col] = 0.0
 
        metrics["feature_importances"] = norm_importances
        metrics["n_folds"] = len(splits)
        metrics["n_feature_rows"] = len(features)
        metrics["params_source"] = self._params_source  # [NEW] debug info
        metrics["active_n_lags"] = self.n_lags           # [NEW] debug info
        return metrics
 
    # ── forecast_with_regressors ──────────────────────────────────────────────
 
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
 
        future_regressors, _ = self._apply_adaptive_encoding(
            future_regressors, self.original_regressor_columns, is_training=False
        )
 
        preds = []
        series = history.copy()
 
        for idx in range(steps):
            row = future_regressors.iloc[[idx]]
            next_date = series.index[-1] + pd.tseries.frequencies.to_offset(self.freq)
 
            max_window = max(self.rolling_windows) if self.rolling_windows else 1
            needed = self.n_lags + max_window + 1
            buf = series.iloc[-needed:].values
 
            feat: dict = {}
 
            # Lag features
            for lag in range(1, self.n_lags + 1):
                pos = len(buf) - lag
                feat[f"lag_{lag}"] = float(buf[pos]) if pos >= 0 else np.nan
 
            # Rolling features (mean, std, median)
            shifted = buf[:-1]
            for window in self.rolling_windows:
                if len(shifted) >= window:
                    wv = shifted[-window:]
                    feat[f"roll_mean_{window}"] = float(np.mean(wv))
                    feat[f"roll_std_{window}"] = float(np.std(wv, ddof=1)) if window > 1 else 0.0
                    feat[f"roll_median_{window}"] = float(np.median(wv))
                else:
                    sv = shifted if len(shifted) > 0 else np.array([0.0])
                    feat[f"roll_mean_{window}"] = float(np.mean(sv))
                    feat[f"roll_std_{window}"] = float(np.std(sv, ddof=1)) if len(sv) > 1 else 0.0
                    feat[f"roll_median_{window}"] = float(np.median(sv))
 
            # [NEW] EWM features (rekonstruksi secara iteratif dari buf)
            for span in self.rolling_windows:
                alpha = 2.0 / (span + 1)
                ewm_val = float(buf[0])
                for v in buf[1:]:
                    ewm_val = alpha * v + (1 - alpha) * ewm_val
                # Gunakan ewm dari shifted (tanpa nilai terbaru) agar konsisten dengan training
                ewm_shifted = float(buf[-2]) if len(buf) >= 2 else ewm_val
                feat[f"ewm_{span}"] = ewm_shifted
 
            # [NEW] Momentum & percent change
            for lag_d in [1, min(3, self.n_lags), min(self.n_lags, max_window)]:
                pos = len(buf) - 1
                pos_prev = pos - lag_d
                feat[f"diff_{lag_d}"] = float(buf[pos] - buf[pos_prev]) if pos_prev >= 0 else 0.0
 
            last_val = float(buf[-1]) if len(buf) > 0 else 0.0
            prev_val = float(buf[-2]) if len(buf) > 1 else last_val
            short_prev = float(buf[-(min(3, self.n_lags) + 1)]) if len(buf) > min(3, self.n_lags) else last_val
 
            feat["pct_change_1"] = (last_val - prev_val) / (abs(prev_val) + 1e-8)
            feat["pct_change_short"] = (last_val - short_prev) / (abs(short_prev) + 1e-8)
 
            # [NEW] Rasio lag1 vs rolling mean
            mid_window = self.rolling_windows[1] if len(self.rolling_windows) > 1 else self.rolling_windows[0]
            roll_mid_key = f"roll_mean_{mid_window}"
            feat["lag1_vs_rollmean"] = feat["lag_1"] / (feat.get(roll_mid_key, 1.0) + 1e-8)
 
            # Fitur kalender
            feat["month"] = next_date.month
            feat["weekofyear"] = next_date.isocalendar()[1]
            feat["quarter"] = next_date.quarter
            feat["dayofweek"] = next_date.dayofweek
            feat["is_month_start"] = int(next_date.is_month_start)
            feat["is_month_end"] = int(next_date.is_month_end)
            feat["is_quarter_start"] = int(next_date.is_quarter_start)
            feat["is_quarter_end"] = int(next_date.is_quarter_end)
 
            # Regressor features
            for col in self.regressor_columns:
                feat[col] = row[col].values[0] if col in row.columns else 0.0
 
            X_latest = pd.DataFrame([feat])[self.feature_columns]
 
            y_pred = self.model.predict(X_latest)[0]
            y_pred = max(0.0, float(y_pred))
            preds.append(y_pred)
 
            series = pd.concat([series, pd.Series([y_pred], index=[next_date])])
 
        return preds
 
    # ── Evaluasi metrik ───────────────────────────────────────────────────────
 
    def _evaluate(self, y_true: pd.Series, y_pred: np.ndarray) -> dict:
        mae = mean_absolute_error(y_true, y_pred)
        mse = mean_squared_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        r2 = r2_score(y_true, y_pred)
 
        # MAPE (skip nilai 0 agar tidak inf)
        non_zero_mask = y_true != 0
        if non_zero_mask.any():
            mape = float(
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
 
        # [NEW] SMAPE — Symmetric MAPE, lebih stabil dari MAPE ketika nilai aktual
        # mendekati 0. Formula: 2*|A-F| / (|A|+|F|+ε) * 100
        denom = np.abs(y_true.values) + np.abs(y_pred) + 1e-8
        smape = float(np.mean(2 * np.abs(y_true.values - y_pred) / denom) * 100)
 
        # Bootstrapping confidence level
        n_size = len(y_true)
        if n_size > 0:
            rng = np.random.default_rng(42)  # [NEW] reproducible bootstrap
            n_iterations = 1000
            bootstrapped_cv_rmses, bootstrapped_rmses = [], []
            y_t_arr = y_true.values
 
            for _ in range(n_iterations):
                idx = rng.integers(0, n_size, size=n_size)
                s_true, s_pred = y_t_arr[idx], y_pred[idx]
                s_rmse = np.sqrt(mean_squared_error(s_true, s_pred))
                s_mean = np.mean(s_true)
                if s_mean > 0:
                    bootstrapped_cv_rmses.append(s_rmse / s_mean)
                bootstrapped_rmses.append(s_rmse)
 
            cv = float(np.mean(bootstrapped_cv_rmses)) if bootstrapped_cv_rmses else 1.0
            confidence_percentage = max(0.0, min(1.0, 1.0 - cv))
            confidence_value = float(np.mean(bootstrapped_rmses))
        else:
            confidence_percentage = 0.0
            confidence_value = 0.0
 
        return {
            "mae": float(mae),
            "mse": float(mse),
            "rmse": float(rmse),
            "mape": float(mape),
            "smape": float(smape),   # [NEW]
            "r2": float(r2),
            "confidence_percentage": float(confidence_percentage),
            "confidence_value": float(confidence_value),
        }