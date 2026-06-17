import asyncio
import pandas as pd
import numpy as np
from typing import Tuple
from app.schemas.features import Feature
from app.core.utils import get_dataset, upload_cleaned_dataset, get_dataset_feature_metadata
from app.core.websocket_manager import manager


def should_preserve_column(col_name: str) -> bool:
    name_lower = col_name.lower()
    keywords = [
        'city', 'town', 'municipality', 'district', 'kota',
        'state', 'province', 'region', 'prefecture', 'territory', 'provinsi', 'negara',
        'category', 'class', 'type', 'group', 'department', 'kategori',
        'segment', 'market', 'audience', 'segmen'
    ]
    return any(k in name_lower for k in keywords)

def ensure_clustering_columns(df: pd.DataFrame) -> pd.DataFrame:
    df_clean = df.copy()

    # Required columns and their matching / fallback priority patterns
    # We want these lowercase names to exist in the final df_cluster
    required_maps = {
        'city': ['city', 'town', 'municipality', 'district', 'city/town', 'kota', 'state', 'region', 'province', 'country'],
        'state': ['state', 'province', 'region', 'prefecture', 'territory', 'provinsi', 'negara bagian', 'city', 'country'],
        'region': ['region', 'area', 'zone', 'wilayah', 'daerah', 'state', 'country', 'city'],
        'segment': ['segment', 'market', 'audience', 'customer segment', 'segmen'],
        'category': ['category', 'class', 'type', 'group', 'department', 'kategori'],
        'sub_category': ['sub-category', 'sub_category', 'subclass', 'subtype', 'subgroup', 'sub category', 'sub-kategori', 'category']
    }

    for target_col, patterns in required_maps.items():
        # Check if target_col already exists (case-insensitive)
        found_col = None
        for col in df_clean.columns:
            if col.lower() == target_col:
                found_col = col
                break
        
        if found_col:
            if found_col != target_col:
                df_clean = df_clean.rename(columns={found_col: target_col})
            continue

        # If not found, look for matches in the patterns
        mapped = False
        for pattern in patterns:
            for col in df_clean.columns:
                # Direct match or substring match
                if pattern in col.lower() or col.lower() in pattern:
                    df_clean[target_col] = df_clean[col]
                    mapped = True
                    break
            if mapped:
                break
        
        # If still not found, fallback to any available non-numeric (categorical) column that isn't already used
        if not mapped:
            non_numeric_cols = df_clean.select_dtypes(exclude='number').columns.tolist()
            # filter out already mapped targets
            usable_cols = [c for c in non_numeric_cols if c not in required_maps.keys()]
            if usable_cols:
                df_clean[target_col] = df_clean[usable_cols[0]]
            else:
                # absolute fallback: fill with dummy string
                df_clean[target_col] = "N/A"

    return df_clean

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
    preserved_cats = [c for c in as_list(col_to_num) if should_preserve_column(c)]
    cols_to_cat = as_list(col_to_cat) + as_list(col_product) + preserved_cats
    for col in cols_to_cat:
        if col in df.columns:
            df[col] = df[col].astype(str)
            df.loc[df[col] == 'nan', col] = pd.NA 

    cols_to_num = [c for c in as_list(col_to_num) if not should_preserve_column(c)]
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

def _col_matches(col_lower: str, keywords: list) -> bool:
    """Cek apakah nama kolom (lowercase) mengandung salah satu keyword."""
    return any(kw in col_lower for kw in keywords)


def resolve_col_product(col_product, df_columns: list) -> str | None:
    """
    Resolve col_product dari list ke satu column name terbaik untuk clustering.
    Prioritas: kolom yang mengandung kata 'name/nama' lebih diutamakan daripada ID.

    Args:
        col_product: str atau list of str dari LLM.
        df_columns:  daftar kolom yang tersedia di DataFrame saat ini.
    Returns:
        Nama kolom terbaik sebagai string, atau None jika tidak ada yang tersedia.
    """
    if not col_product:
        return None
    if isinstance(col_product, str):
        return col_product if col_product in df_columns else None

    name_priority = [
        'product name', 'product_name', 'nama produk', 'nama_produk',
        'item name',    'item_name',    'nama barang', 'nama_barang',
        'nama item',    'nama_item',
        'product',      'produk',       'item',
        'goods',        'barang',       'name',        'nama',
    ]

    available = {col.lower(): col for col in col_product if col in df_columns}
    for kw in name_priority:
        for col_lower, col_orig in available.items():
            if kw in col_lower:
                return col_orig

    # Fallback: kembalikan kolom pertama yang masih ada di df
    for col in col_product:
        if col in df_columns:
            return col
    return None


def auto_drop_uninformative_cols(
    df: pd.DataFrame,
    preserve_cols: list | None = None,
) -> tuple:
    """
    Otomatis mendeteksi dan mendrop kolom yang tidak informatif untuk ML.

    Aturan drop:
    1. Kolom ID generik  — row_id, customer_id, order_id, dsb. (kecuali yang dipreserve)
    2. Kolom tanggal/waktu yang bukan kolom datetime utama
    3. Kolom alamat yang terlalu rinci — postal code, street, address, zip, dsb.
    4. Kolom lokasi yang terlalu generik — country, negara, dsb. (city/state/region tetap)

    Args:
        df:            DataFrame input.
        preserve_cols: Kolom yang TIDAK boleh didrop (datetime utama, target, product, dsb.).
    Returns:
        (df_cleaned, list_of_actually_dropped_columns)
    """
    preserve_lower = {c.lower() for c in (preserve_cols or []) if c}

    # --- ID patterns ---
    ID_EXACT    = {'id'}
    ID_SUFFIXES = (' id', '_id')
    ID_CONTAINS = ['row id', 'row_id', 'rowid']

    # --- Date/time patterns (non-main date column) ---
    DATE_CONTAINS = [
        'date', 'time', 'timestamp', 'datetime',
        'tanggal', 'waktu', 'tgl',
        'created_at', 'updated_at', 'deleted_at',
    ]

    # --- Overly detailed address ---
    ADDRESS_CONTAINS = [
        'address', 'alamat', 'postal', 'zip', 'street', 'jalan', 'road',
        'avenue', 'blvd', 'lane', 'kodepos', 'kode pos', 'postcode', 'zipcode',
        'suite', 'apt ', ' unit',
    ]

    # --- Too-generic location (country-level, drop these) ---
    GENERIC_LOC_CONTAINS = ['country', 'negara', 'nation', 'countries']

    cols_to_drop = []
    for col in df.columns:
        col_lower = col.lower().strip()

        if col_lower in preserve_lower:
            continue

        # 1. Generic ID columns
        if col_lower in ID_EXACT:
            cols_to_drop.append(col); continue
        if col_lower.endswith(ID_SUFFIXES[0]) or col_lower.endswith(ID_SUFFIXES[1]):
            cols_to_drop.append(col); continue
        if _col_matches(col_lower, ID_CONTAINS):
            cols_to_drop.append(col); continue

        # 2. Date/time columns (non-main)
        if _col_matches(col_lower, DATE_CONTAINS):
            cols_to_drop.append(col); continue

        # 3. Overly detailed address columns
        if _col_matches(col_lower, ADDRESS_CONTAINS):
            cols_to_drop.append(col); continue

        # 4. Generic location columns (country-level)
        if _col_matches(col_lower, GENERIC_LOC_CONTAINS):
            cols_to_drop.append(col); continue

    actual_dropped = [c for c in cols_to_drop if c in df.columns]
    if actual_dropped:
        print(f"[INFO] auto_drop_uninformative_cols dropped: {actual_dropped}", flush=True)
        df = df.drop(columns=actual_dropped)

    return df, actual_dropped


def build_forecast_metadata(extracted: dict) -> dict:
    """
    Derivasi feature_metadata untuk cleaned forecasting dataset dari extracted raw metadata.

    Aturan:
    - col_dt_whole  → dipertahankan (wajib untuk time-series)
    - col_target    → dipertahankan
    - col_pairing   → dipertahankan (fitur baru sudah ada di df, tapi metadata tetap dicatat)
    - col_to_num    → dipertahankan
    - col_to_cat    → dipertahankan
    - col_product   → dikosongkan (sudah di-drop dari df_forecast)
    - cols_to_drop  → dikosongkan (sudah dieksekusi di raw pipeline)
    - is_whole / col_day / col_month / col_year → dipertahankan sesuai extracted
    """
    return {
        "is_whole":     extracted.get("is_whole", False),
        "col_dt_whole": extracted.get("col_dt_whole"),
        "col_day":      extracted.get("col_day"),
        "col_month":    extracted.get("col_month"),
        "col_year":     extracted.get("col_year"),
        "col_target":   extracted.get("col_target"),
        "col_to_cat":   extracted.get("col_to_cat") or [],
        "col_to_num":   extracted.get("col_to_num") or [],
        "col_pairing":  extracted.get("col_pairing") or [],
        "col_product":  None,
        "cols_to_drop": extracted.get("cols_to_drop") or [],
    }


def build_cluster_metadata(extracted: dict, col_product_resolved: str | None = None) -> dict:
    """
    Derivasi feature_metadata untuk cleaned clustering dataset dari extracted raw metadata.

    Aturan:
    - col_product   → di-resolve ke SATU kolom nama produk terbaik (str, bukan list)
    - col_target    → dipertahankan (Sales / Revenue sebagai fitur numerik clustering)
    - col_to_cat    → dipertahankan
    - col_to_num    → dipertahankan
    - col_pairing   → dipertahankan (fitur baru sudah ada di df)
    - col_dt_whole  → dikosongkan (sudah di-drop dari df_cluster)
    - is_whole / col_day / col_month / col_year → di-reset (tidak relevan untuk clustering)
    - cols_to_drop  → record semua kolom yang di-drop selama pipeline
    """
    return {
        "is_whole":     False,
        "col_dt_whole": None,
        "col_day":      None,
        "col_month":    None,
        "col_year":     None,
        "col_target":   None,
        "col_product":  col_product_resolved or "",
        "col_to_cat":   extracted.get("col_to_cat") or [],
        "col_to_num":   extracted.get("col_to_num") or [],
        "col_pairing":  extracted.get("col_pairing") or [],
        "cols_to_drop": extracted.get("cols_to_drop") or [],
    }


async def temp_pipeline(dataset_id:int, model: str, job_id: str):
    shapes = []
    
    df, _ = await get_dataset(dataset_id)
    shapes.append(df.shape)

    mapping_res = await get_dataset_feature_metadata(dataset_id)
    if mapping_res is None:
        print(f"[WARN] feature_metadata for dataset {dataset_id} returned None — preprocessing will use empty defaults. Check if ML service has access to this dataset's feature-metadata endpoint.", flush=True)
    else:
        print(f"[INFO] feature_metadata fetched: {mapping_res}", flush=True)
    extracted = extract_response(mapping_res or {})
    print(f"[INFO] extracted: {extracted}", flush=True)

    step1_id = f"{job_id}-step1"
    await manager.send(job_id, {"stepId": step1_id, "text": "Menyiapkan worker: memindai anomali dan membersihkan noise data...", "status": "loading"})
    await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
    try:
        raw_cols = extracted.get("cols_to_drop") or []
        cols_to_drop = [col for col in (raw_cols if isinstance(raw_cols, list) else [raw_cols]) if not should_preserve_column(col)]
        df = (
            df.pipe(drop_cols, cols_to_drop)
        )

        # Auto-drop: kolom ID generik, tanggal non-utama, alamat rinci, lokasi terlalu generik
        # Preserve: datetime utama, target, serta semua product columns agar tersedia untuk fork clustering
        preserve_always = list(filter(None, [
            extracted.get("col_dt_whole"),
            extracted.get("col_target"),
            extracted.get("col_day"),
            extracted.get("col_month"),
            extracted.get("col_year"),
        ] + as_list(extracted.get("col_product"))))
        df, auto_dropped = auto_drop_uninformative_cols(df, preserve_cols=preserve_always)

        # Hapus kolom yang sudah di-drop dari col_to_cat dan col_to_num agar metadata konsisten
        auto_dropped_set = set(auto_dropped)
        if extracted.get("col_to_cat"):
            extracted["col_to_cat"] = [c for c in extracted["col_to_cat"] if c not in auto_dropped_set]
        if extracted.get("col_to_num"):
            extracted["col_to_num"] = [c for c in (extracted["col_to_num"] or []) if c not in auto_dropped_set]

        # Update record lengkap semua kolom yang di-drop (LLM-recommended + auto-drop)
        all_dropped = list(dict.fromkeys(cols_to_drop + auto_dropped))
        extracted["cols_to_drop"] = all_dropped

        await manager.send(job_id, {"stepId": step1_id, "text": "Anomali dan noise data berhasil dibersihkan.", "status": "success"})

        step2_id = f"{job_id}-step2"
        await manager.send(job_id, {"stepId": step2_id, "text": "Mengekstraksi fitur temporal: menyelaraskan format matriks waktu...", "status": "loading"})
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
        await manager.send(job_id, {"stepId": step2_id, "text": "Fitur temporal berhasil diekstraksi.", "status": "success"})
        
        # If you have more steps, you can resume chaining here:
        step3_id = f"{job_id}-step3"
        await manager.send(job_id, {"stepId": step3_id, "text": "Validasi skema: menormalisasi tipe variabel numerik dan kategorikal...", "status": "loading"})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        df = (
            df.pipe(adjust_data_types, extracted.get("col_to_cat"), extracted.get("col_product"), extracted.get("col_to_num"))
        )
        await manager.send(job_id, {"stepId": step3_id, "text": "Skema variabel berhasil dinormalisasi.", "status": "success"})

        step4_id = f"{job_id}-step4"
        await manager.send(job_id, {"stepId": step4_id, "text": "Reduksi dimensi: memangkas vektor kolom yang redundan...", "status": "loading"})
        await asyncio.sleep(np.random.uniform(4.2, 6.7))  # Simulate time-consuming task
        iter_cols, categorical_cols, numerical_cols = extract_column(df, extracted['col_dt_whole'])
        df = (
            df.pipe(enforce_types, numerical_cols, categorical_cols)
            .pipe(drop_or_impute, categorical_cols, numerical_cols, extracted['col_dt_whole'])
        )
        await manager.send(job_id, {"stepId": step4_id, "text": "Reduksi dimensi selesai.", "status": "success"})
        
        step5_id = f"{job_id}-step5"
        await manager.send(job_id, {"stepId": step5_id, "text": "Inisiasi rekayasa fitur: mensintesis metrik prediktif baru...", "status": "loading"})
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
        await manager.send(job_id, {"stepId": step5_id, "text": "Rekayasa fitur berhasil diselesaikan.", "status": "success"})

        shapes.append(df.shape)
        print(f"Pipeline finished successfully. New Shape: {df.shape}")
        
        # Upload the cleaned dataset back to the backend
        step6_id = f"{job_id}-step6"
        await manager.send(job_id, {"stepId": step6_id, "text": "Kompilasi selesai: mengonversi dan merekam matriks teroptimasi ke server...", "status": "loading"})
        
        cleaned_forecast_id = None
        cleaned_cluster_id = None

        if model.lower() == 'both':
            prod_cols = as_list(extracted.get("col_product"))
            df_forecast = df.drop(columns=[col for col in prod_cols if col in df.columns])
            forecast_metadata = build_forecast_metadata(extracted)
            upload_forecast = await upload_cleaned_dataset(df_forecast, dataset_id, 'Forecasting', forecast_metadata)
            cleaned_forecast_id = upload_forecast.get("data", {}).get("dataset_id")

            df_cluster = df.drop(columns=[extracted['col_dt_whole']] if extracted.get('col_dt_whole') and extracted['col_dt_whole'] in df.columns else [])
            df_cluster = ensure_clustering_columns(df_cluster)
            # Resolve col_product ke satu string nama produk terbaik setelah ensure_clustering_columns
            col_product_single = resolve_col_product(prod_cols, list(df_cluster.columns))
            cluster_metadata = build_cluster_metadata(extracted, col_product_resolved=col_product_single)
            upload_cluster = await upload_cleaned_dataset(df_cluster, dataset_id, 'Clustering', cluster_metadata)
            cleaned_cluster_id = upload_cluster.get("data", {}).get("dataset_id")
            print(f"Upload successful: forecast_id={cleaned_forecast_id}, cluster_id={cleaned_cluster_id}")
        elif model.lower() == 'forecasting':
            prod_cols = as_list(extracted.get("col_product"))
            df_forecast = df.drop(columns=[col for col in prod_cols if col in df.columns])
            forecast_metadata = build_forecast_metadata(extracted)
            upload_result = await upload_cleaned_dataset(df_forecast, dataset_id, 'Forecasting', forecast_metadata)
            cleaned_forecast_id = upload_result.get("data", {}).get("dataset_id")
            print(f"Upload successful: forecast_id={cleaned_forecast_id}")
        else:
            prod_cols = as_list(extracted.get("col_product"))
            df_cluster = df.drop(columns=[extracted['col_dt_whole']] if extracted.get('col_dt_whole') and extracted['col_dt_whole'] in df.columns else [])
            df_cluster = ensure_clustering_columns(df_cluster)
            # Resolve col_product ke satu string nama produk terbaik setelah ensure_clustering_columns
            col_product_single = resolve_col_product(prod_cols, list(df_cluster.columns))
            cluster_metadata = build_cluster_metadata(extracted, col_product_resolved=col_product_single)
            upload_result = await upload_cleaned_dataset(df_cluster, dataset_id, 'Clustering', cluster_metadata)
            cleaned_cluster_id = upload_result.get("data", {}).get("dataset_id")
            print(f"Upload successful: cluster_id={cleaned_cluster_id}")

        await manager.send(job_id, {"stepId": step6_id, "text": "Dataset bersih berhasil disimpan ke database.", "status": "success"})
        await manager.send(job_id, {
            "stepId": f"{job_id}-done",
            "text": "Pipeline preprocessing selesai. Dataset siap untuk analisis.",
            "status": "success",
            "cleaned_forecast_id": cleaned_forecast_id,
            "cleaned_cluster_id": cleaned_cluster_id,
            "feature_metadata": extracted
        })

    except Exception as e:
        print(f"Pipeline failed during transformation: {str(e)}")
        await manager.send(job_id, {"stepId": f"{job_id}-error", "text": f"Pipeline gagal: {str(e)}", "status": "error"})
        raise e
        
    return shapes

async def test_ws(job_id: str):
    await manager.send(job_id, {"message": "skibidi"})
    await asyncio.sleep(5)
    await manager.send(job_id, {"message": "5 second has passed"})
    await asyncio.sleep(3)
    await manager.send(job_id, {"message": "3 second has passed"})
    return