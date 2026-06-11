import pandas as pd
import numpy as np
from typing import Tuple
from pydantic import UUID5
from app.schemas.features import Feature
from app.core.utils import get_dataset, get_dataset_info, upload_cleaned_dataset, get_dataset_feature_metadata
from app.core.utils import get_dataset, get_dataset_info, upload_cleaned_dataset, get_dataset_feature_metadata
from app.controller.openrouter import analyze_columns
from app.schemas.openrouter import DatasetMetadataRequest
from app.core.websocket_manager import manager

import asyncio

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

# ------------------------------------- Baroe --------------------------------------------

def drop_cols(df: pd.DataFrame, cols_to_drop: list[str] | str | None = None) -> pd.DataFrame:
    if not cols_to_drop:
        return df
        
    if isinstance(cols_to_drop, str):
        cols_to_drop = [cols_to_drop]
        
    # Production safety: only drop columns that actually exist in the dataframe
    cols_to_drop = [col for col in cols_to_drop if col in df.columns]

    return df.drop(columns=cols_to_drop).drop_duplicates()

def parser(series):
    s = series.astype(str).str.strip()
    s = s.str.replace(r'\.0$', '', regex=True)

    return s

def adjust_date_time(df, is_whole, col_day, col_month, col_year, col_dt_whole):
    if not is_whole:
        # Guard against hallucinated columns
        if all(col in df.columns for col in [col_day, col_month, col_year]):
            col_dt_whole = 'TheDate'
            df[col_dt_whole] = (
                parser(df[col_year]) + ' ' +
                parser(df[col_month]) + ' ' +
                parser(df[col_day]) + ' '
            )

    if col_dt_whole and col_dt_whole in df.columns:
        df[col_dt_whole] = pd.to_datetime(df[col_dt_whole], errors="coerce")

    return df, col_dt_whole

def as_list(item):
    if not item: return []
    return [item] if isinstance(item, str) else item

def adjust_data_types(df, col_to_cat, col_product, col_to_num):

    cols_to_cat = as_list(col_to_cat) + as_list(col_product)
    for col in cols_to_cat:
        if col in df.columns:
            df[col] = df[col].astype(str)
            df.loc[df[col] == 'nan', col] = pd.NA 

    cols_to_num = as_list(col_to_num)
    for col in cols_to_num:
        if col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).str.replace(r'[$,]', '', regex=True)
            df[col] = pd.to_numeric(df[col], errors='coerce')

    return df

def extract_column(df, col_dt_whole):
    iter_cols = df.columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    numeric_cols = df.select_dtypes(include='number').columns.tolist()

    if col_dt_whole in categorical_cols:
        categorical_cols.remove(col_dt_whole)
    if col_dt_whole in numeric_cols:
        numeric_cols.remove(col_dt_whole)

    return iter_cols, categorical_cols, numeric_cols

def enforce_types(df, numeric_cols, categorical_cols):
    if numeric_cols:
        df[numeric_cols] = df[numeric_cols].astype(float)

    if categorical_cols:
        for col in categorical_cols:
            df[col] = df[col].astype(str).str.strip()
            
            ghost_nulls = ['nan', '', 'None', 'null']
            
            df.loc[df[col].isin(ghost_nulls), col] = pd.NA

    return df

def drop_or_impute(df, categorical_cols, numeric_cols, col_dt_whole=None, drop_threshold=0.3):
    original_len = len(df.index)

    for col in list(df.columns):
        missing_ratio = df[col].isna().sum() / original_len
        
        if missing_ratio == 0:
            continue
            
        if missing_ratio < drop_threshold:
            if col in categorical_cols:
                df[col] = df[col].fillna(df[col].mode()[0])
                
            elif col in numeric_cols:
                df[col] = df[col].fillna(df[col].mean())
            
        else:
            if col != col_dt_whole: # Never drop the main date column
                df = df.drop(columns=[col])
    
    return df

def generate_new_features(df, col_pairing, numeric_cols):
    if col_pairing:
        for pairing in col_pairing:
            col1 = pairing['column_1']
            col2 = pairing['column_2']

            op = pairing['operator'].lower().strip() 
            
            if col1 in df.columns and col2 in df.columns:
                if pd.api.types.is_numeric_dtype(df[col1]) and pd.api.types.is_numeric_dtype(df[col2]):
                    
                    new_col = pairing['new_col_name']
                    
                    if op == 'add':
                        df[new_col] = df[col1] + df[col2]
                        
                    elif op in ['substract', 'subtract']:
                        df[new_col] = df[col1] - df[col2]
                        
                    elif op in ['times', 'multiply']:
                        df[new_col] = df[col1] * df[col2]
                        
                    elif op == 'divide':
                        df[new_col] = np.where(df[col2] == 0, 0, df[col1] / df[col2])
                    
                    if new_col in df.columns and new_col not in numeric_cols:
                        numeric_cols.append(new_col)

    return df, numeric_cols

def extract_response(response):
    col_dt_whole = None
    is_whole = False

    col_date_time = response.get("col_date_time")

    col_day, col_month, col_year = None, None, None

    if isinstance(col_date_time, str):
        is_whole = True
        col_dt_whole = col_date_time

    elif isinstance(col_date_time, dict):
        if col_date_time.get("col_whole"):
            is_whole = True
            col_dt_whole = col_date_time["col_whole"]
        else:
            col_day = col_date_time.get("col_day")
            col_month = col_date_time.get("col_month")
            col_year = col_date_time.get("col_year")

    return {
        "cols_to_drop": response.get("cols_to_drop", []),
        "col_product": response.get("col_product", []),
        "col_target": response.get("col_target"),
        "col_to_cat": response.get("col_to_categorical", []),
        "col_to_num": response.get("col_to_numerical", []),
        "col_pairing": response.get("new_feature_pairing", []),
        "is_whole": is_whole,
        "col_dt_whole": col_dt_whole,
        "col_day": col_day,
        "col_month": col_month,
        "col_year": col_year
    }

async def temp_pipeline(dataset_id:int, model: str, job_id: str):
    shapes = []
    
    df, _ = await get_dataset(dataset_id)
    shapes.append(df.shape)

    mapping_res = await get_dataset_feature_metadata(dataset_id)
    # print(mapping_res)
    extracted = extract_response(mapping_res.get("data"))
    # print(extracted)

    await manager.send(job_id, {"message": "Menyiapkan worker: memindai anomali dan membersihkan noise data..."})
    await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
    try:
        df = (
            df.pipe(drop_cols, extracted.get("cols_to_drop"))
        )
        await manager.send(job_id, {"message": "Mengekstraksi fitur temporal: menyelaraskan format matriks waktu..."})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        df, updated_col_dt = adjust_date_time(
            df,
            is_whole=extracted.get("is_whole"),
            col_day=extracted.get("col_day"),
            col_month=extracted.get("col_month"),
            col_year=extracted.get("col_year"),
            col_dt_whole=extracted.get("col_dt_whole")
        )
        extracted["col_dt_whole"] = updated_col_dt
        
        # If you have more steps, you can resume chaining here:
        await manager.send(job_id, {"message": "Validasi skema: menormalisasi tipe variabel numerik dan kategorikal..."})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        df = (
            df.pipe(adjust_data_types, extracted.get("col_to_cat"), extracted.get("col_product"), extracted.get("col_to_num"))
        )
        await manager.send(job_id, {"message": "Reduksi dimensi: memangkas vektor kolom yang redundan..."})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        iter_cols, categorical_cols, numerical_cols = extract_column(df, extracted['col_dt_whole'])
        df = (
            df.pipe(enforce_types, numerical_cols, categorical_cols)
            .pipe(drop_or_impute, categorical_cols, numerical_cols, extracted['col_dt_whole'])
        )
        
        await manager.send(job_id, {"message": "Inisiasi rekayasa fitur: mensintesis metrik prediktif baru..."})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        try:
            df, numerical_cols = generate_new_features(
                    df,
                    extracted.get('col_pairing'),
                    numerical_cols
                )
        except Exception as e:
            print(f"Error occurred while generating new features: {str(e)}")
            raise e
        shapes.append(df.shape)
        print(f"Pipeline finished successfully. New Shape: {df.shape}")
        
        # Upload the cleaned dataset back to the backend
        await manager.send(job_id, {"message": "Kompilasi selesai: mengonversi dan merekam matriks teroptimasi ke server..."})
        if model.lower() == 'both':
            upload_forecast = await upload_cleaned_dataset(df, dataset_id, 'Forecasting', extracted)

            df = df.drop(columns=extracted['col_dt_whole'])
            upload_cluster = await upload_cleaned_dataset(df, dataset_id, 'Clustering', extracted)
            print(f"Upload successful: {upload_forecast, upload_cluster}")
            cleaned_dataset_id = upload_forecast.get("data", {}).get("dataset_id") if isinstance(upload_forecast, dict) else None
        else:
            upload_result = await upload_cleaned_dataset(df, dataset_id, model, extracted)
            print(f"Upload successful: {upload_result}")
            cleaned_dataset_id = upload_result.get("data", {}).get("dataset_id") if isinstance(upload_result, dict) else None

        # Update the mapping with the new datetime column if changed
        if hasattr(mapping, 'col_date_time'):
            if isinstance(mapping.col_date_time, str):
                mapping.col_date_time = xtracted["col_dt_whole"]
            else:
                if hasattr(mapping.col_date_time, 'col_whole'):
                    mapping.col_date_time.col_whole = xtracted["col_dt_whole"]
                
    except Exception as e:
        print(f"Pipeline failed during transformation: {str(e)}")
        raise e
        
    return shapes

async def test_ws(job_id: str):
    await manager.send(job_id, {"message": "skibidi"})
    await asyncio.sleep(5)
    await manager.send(job_id, {"message": "5 second has passed"})
    await asyncio.sleep(3)
    await manager.send(job_id, {"message": "3 second has passed"})
    return
