from io import BytesIO

import pandas as pd
import numpy as np
from typing import Tuple

import requests
from app.controller.gemini import get_preprocess_from_gemini
from app.schemas.features import Feature

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

async def get_dataset(dataset_id):
    """
    Fetch dataset from backend API,
    load into pandas DataFrame,
    and return summarized dataset information.
    """

    auth_url = f"http://backend:5000/api/v1/auth/login"
    auth_response = requests.post(auth_url, json={'email': 'user@example.com', 'password': 'string'})
    print(auth_response.json())
    access_token = auth_response.json()["data"]["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    fetch_dataset_url = f"http://backend:5000/api/v1/datasets/{dataset_id}"
    fetch_dataset_response = requests.get(
        fetch_dataset_url,
        headers=headers
    )

    if fetch_dataset_response.status_code != 200:
        raise Exception(
            f"Failed to fetch dataset: "
            f"{fetch_dataset_response.status_code} - {fetch_dataset_response.text}"
        )

    csv_bytes = fetch_dataset_response.content

    df = pd.read_csv(
        BytesIO(csv_bytes)
    )

    return df

async def upload_cleaned_dataset(df: pd.DataFrame, original_dataset_id: int, model: str):
    """
    Convert processed DataFrame to CSV and upload it back to the backend.
    """
    auth_url = f"http://backend:5000/api/v1/auth/login"
    auth_response = requests.post(auth_url, json={'email': 'user@example.com', 'password': 'string'})
    access_token = auth_response.json()["data"]["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    csv_buffer = BytesIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)
    
    upload_url = "http://backend:5000/api/v1/datasets/upload" # Adjust if your endpoint URL is different
    
    files = {
        'file': (f"cleaned_dataset_{original_dataset_id}.csv", csv_buffer, "text/csv")
    }
    data = {
        'is_cleaned': 'true',
        'ori_data_id': str(original_dataset_id),
        'model': model
    }
    
    response = requests.post(upload_url, headers=headers, files=files, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Failed to upload cleaned dataset: {response.status_code} - {response.text}")
        
    return response.json()

def get_dataset_info(df: pd.DataFrame):
    dataset_summary = {
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "head": df.head().to_dict(orient="records"),
        "missing_values": df.isnull().sum().to_dict()
    }

    return dataset_summary

def extract_response(response):
    col_dt_whole = None
    is_whole = False
    col_date_time = response.col_date_time
    
    if not col_date_time.col_whole:
        col_day = col_date_time.col_day
        col_month = col_date_time.col_month
        col_year = col_date_time.col_year  
    else:
        is_whole = True
        col_dt_whole = col_date_time.col_whole
        col_day = None
        col_month = None
        col_year = None

    return {
        "cols_to_drop": response.cols_to_drop,
        "col_product": response.col_product,
        "col_target": response.col_target,
        "col_to_cat": response.col_to_categorical,
        "col_to_num": response.col_to_numerical,
        "col_pairing": response.new_feature_pairing,
        "is_whole": is_whole,
        "col_dt_whole": col_dt_whole,
        "col_day": col_day,
        "col_month": col_month,
        "col_year": col_year
    }

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
            col1 = pairing.column_1
            col2 = pairing.column_2

            op = pairing.operator.lower().strip() 
            
            if col1 in df.columns and col2 in df.columns:
                if pd.api.types.is_numeric_dtype(df[col1]) and pd.api.types.is_numeric_dtype(df[col2]):
                    
                    new_col = pairing.new_col_name
                    
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

async def temp_pipeline(dataset_id:int, model: str):
    shapes = []
    
    df: pd.DataFrame = await get_dataset(dataset_id)
    shapes.append(df.shape)

    dataset_summ = get_dataset_info(df)

    respons = await get_preprocess_from_gemini(dataset_summary=dataset_summ, model_type=model)
    print(f'Respon Gemini begini kira-kira: {respons}')

    # `respons` could be an error string or the actual Pydantic model parsed from Gemini
    if isinstance(respons, str):
        print(f"Gemini returned an error or fallback: {respons}")
        return None
        
    xtracted = extract_response(respons)

    try:
        df = (
            df.pipe(drop_cols, xtracted.get("cols_to_drop"))
        )
        
        df, updated_col_dt = adjust_date_time(
            df,
            is_whole=xtracted.get("is_whole"),
            col_day=xtracted.get("col_day"),
            col_month=xtracted.get("col_month"),
            col_year=xtracted.get("col_year"),
            col_dt_whole=xtracted.get("col_dt_whole")
        )
        xtracted["col_dt_whole"] = updated_col_dt
        
        # If you have more steps, you can resume chaining here:
        df = (
            df.pipe(adjust_data_types, xtracted.get("col_to_cat"), xtracted.get("col_product"), xtracted.get("col_to_num"))
        )

        iter_cols, categorical_cols, numerical_cols = extract_column(df, xtracted['col_dt_whole'])
        df = (
            df.pipe(enforce_types, numerical_cols, categorical_cols)
            .pipe(drop_or_impute, categorical_cols, numerical_cols, xtracted['col_dt_whole'])
        )

        df, numerical_cols = generate_new_features(
            df,
            xtracted.get('col_pairing'),
            numerical_cols
        )
        shapes.append(df.shape)
        print(f"Pipeline finished successfully. New Shape: {df.shape}")
        
        # Upload the cleaned dataset back to the backend
        if model.lower() == 'both':
            upload_forecast = await upload_cleaned_dataset(df, dataset_id, 'Forecasting')

            df = df.drop(columns=xtracted['col_dt_whole'])
            upload_cluster = await upload_cleaned_dataset(df, dataset_id, 'Clustering')
            print(f"Upload successful: {upload_forecast, upload_cluster}")
        else:
            upload_result = await upload_cleaned_dataset(df, dataset_id, model)
            print(f"Upload successful: {upload_result}")

    except Exception as e:
        print(f"Pipeline failed during transformation: {str(e)}")
        raise e
        
    return shapes
