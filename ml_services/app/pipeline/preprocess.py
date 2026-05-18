import pandas as pd
from typing import Tuple

def drop_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """Membersihkan raw data dari missing values"""
    return df.dropna().reset_index(drop=True)

def preprocess_dates(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
    """Mengubah format string menjadi datetime object"""
    df_clean = df.copy()
    df_clean[date_column] = pd.to_datetime(df_clean[date_column])
    return df_clean

# Tambahkan lagi fungsi preprocessing khusus untuk clustering, forecasting, dsb. sesuai kebutuhan

def prepare_clustering_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fungsi wrapper untuk menjalankan beberapa preprocessing
    secara berurutan khusus untuk clustering.
    """
    df = drop_missing_values(df)
    # Lakukan agregasi atau fitur engineering spesifik untuk clustering
    return df

def prepare_forecasting_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Fungsi wrapper untuk preprocessing data time-series.
    """
    df = drop_missing_values(df)
    df = preprocess_dates(df, 'date')
    # Set index ke datetime, resampling harian/mingguan, dsb.
    return df