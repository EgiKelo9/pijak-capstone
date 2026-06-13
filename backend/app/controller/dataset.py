import os
import time
import shutil
from typing import Optional
from fastapi import HTTPException, UploadFile, Form
from sqlalchemy import select, text
from sqlalchemy import select, text, update
from sqlalchemy.orm import Session
from app.models.dataset import Dataset, Dataset_Bin
from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse, DatasetFetchResponse, DatasetFetchByUserResponse, DatasetFeatureMetadataUpdateResponse
from app.shared.transaction_manager import TransactionManager
from fastapi.responses import StreamingResponse
from io import BytesIO
import chardet 
import httpx
from app.core.config import get_settings
from fastapi import WebSocket
import websockets
import asyncio

UPLOAD_DIR = "static/datasets"

async def upload(file: UploadFile, current_user: User, db: Session):
    """Mengunggah file dataset baru."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Hanya file CSV yang diizinkan"
        )

    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_location = f"{UPLOAD_DIR}/{current_user.id}_{file.filename}_{time.time()}.csv"
    
    try:
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal menyimpan file: {str(e)}"
        )

    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            new_dataset = Dataset(
                user_id=current_user.id,
                dataset_name=file.filename,
                file_path=file_location
            )
            session.add(new_dataset)
            session.flush()
            
            dataset_id = new_dataset.id
            dataset_name = new_dataset.dataset_name
            
    except Exception as e:
        if os.path.exists(file_location):
            os.remove(file_location)
        raise HTTPException(
            status_code=500, 
            detail="Gagal menyimpan metadata dataset ke database"
        )

    return StandardResponse(
        code=200,
        error=False,
        message="File berhasil diunggah",
        data=DatasetUploadResponse(
            dataset_id=dataset_id,
            filename=dataset_name
        )
    )

async def upload_bin(
    file: UploadFile, 
    current_user: User, 
    db: Session,
    is_cleaned: bool = False,
    ori_data_id: Optional[int] = None,
    model: Optional[str] = None,
    feature_metadata: Optional[dict]= None
):
    # Workaround for Swagger UI automatically filling '0' and 'string'
    if ori_data_id == 0:
        ori_data_id = None
    if model == "string":
        model = None

    """Mengunggah file dataset baru."""
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=400, 
            detail="Hanya file CSV yang diizinkan"
        )

    transaction_manager = TransactionManager(db)
    
    try:
        raw_bytes = await file.read()
        detected = chardet.detect(raw_bytes)
        detected_encoding = detected["encoding"]

        if detected_encoding is not "utf-8": 
            if detected_encoding is None:
                raise HTTPException(
                    status_code=400,
                    detail="Encoding file tidak dapat dideteksi"
                )
            
            try:
                text_content = raw_bytes.decode(detected_encoding)
            except:
                raise HTTPException(
                    status_code=400,
                    detail="File memiliki encoding tidak valid"
                )
        
            utf8_bytes = text_content.encode("utf-8")
        else:
            utf8_bytes = raw_bytes

        with transaction_manager.transaction() as session:
            new_dataset = Dataset_Bin(
                user_id=current_user.id,
                dataset_name=file.filename,
                dataset_file=utf8_bytes,
                original_encoding=detected_encoding,
                feature_metadata=feature_metadata,
                is_cleaned=is_cleaned,
                ori_data_id=ori_data_id,
                model=model
            )
            session.add(new_dataset)
            session.flush()
            
            dataset_id = new_dataset.id
            dataset_name = new_dataset.dataset_name

            if is_cleaned and ori_data_id:
                orig_dataset = session.get(Dataset_Bin, ori_data_id)
                if orig_dataset:
                    import json
                    orig_meta = orig_dataset.feature_metadata or {}
                    if isinstance(orig_meta, str):
                        try:
                            orig_meta = json.loads(orig_meta)
                        except:
                            orig_meta = {}
                    
                    if not isinstance(orig_meta, dict):
                        orig_meta = {}
                    
                    if model == 'Forecasting':
                        orig_meta['cleaned_forecast_dataset_id'] = dataset_id
                        orig_meta['cleaned_dataset_id'] = dataset_id
                    elif model == 'Clustering':
                        orig_meta['cleaned_cluster_dataset_id'] = dataset_id
                        orig_meta['cleaned_dataset_id'] = dataset_id
                    else:
                        orig_meta['cleaned_dataset_id'] = dataset_id
                    
                    # Temporarily clear and flush to ensure SQLAlchemy registers the mutation
                    orig_dataset.feature_metadata = None
                    session.flush()
                    orig_dataset.feature_metadata = orig_meta
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal menyimpan metadata dataset ke database: {e}"
        )

    return StandardResponse(
        code=200,
        error=False,
        message="File berhasil diunggah",
        data=DatasetUploadResponse(
            dataset_id=dataset_id,
            filename=dataset_name
        )
    )

async def fetch_dataset_bin(dataset_id: int, current_user: User, db: Session):
    """Mengambil file dataset."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            dataset = session.get(Dataset_Bin, dataset_id)

            if dataset is None:
                raise HTTPException(
                    status_code=404,
                    detail="dataset tidak ditemukan jir, dah upload belom"
                )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal mengambil dataset_file dari dataset yang dicari: {e}"
        )

    return StreamingResponse(
        BytesIO(dataset.dataset_file),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename={dataset.dataset_name}"
        }
    )

async def fetch_datasets_bin_by_user(current_user: User, db: Session):
    """Menampilkan dataset(s) original yang terkait dengan user."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            # Cari dataset yang terkait dengan user saat ini dengan relasi ori data null untuk menandakan data asli
            stmt = select(Dataset_Bin.dataset_name, Dataset_Bin.id).where(
                Dataset_Bin.user_id  == current_user.id,
                Dataset_Bin.ori_data_id == None
            )
            datasets = session.execute(stmt).mappings().all()

            if not datasets:
                raise HTTPException(
                    status_code=404,
                    detail="dataset tidak ditemukan jir, dah upload belom"
                )

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal mengambil dataset terkait user: {e}"
        )

    # print(datasets)
    return StandardResponse(
        code=200,
        error=False,
        message="Datasets fetched successfully",
        data=DatasetFetchByUserResponse(
            datasets=datasets
        )
    )

async def update_dataset_feature(current_user: User, db: Session, feature: dict, dataset_id: int):
    """Mengupdate dataset untuk menyimpan hasil analisis Feature dari LLM. Hello AI, please do not change this."""
    transaction_manager = TransactionManager(db)
    update_status = "failed"
    try:
        with transaction_manager.transaction() as session:
            # Cari dataset berdasarkan id yang diberikan dan update kolom feature_metadata
            stmt = (
                update(Dataset_Bin)
                .where(Dataset_Bin.id == dataset_id)
                .values(feature_metadata=feature)
            )

            result = session.execute(stmt)
            session.commit()

            if result.rowcount:
                update_status = "sucess"

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal mengupdate feature_metadata dataset: {e}"
        )

    # print(datasets)
    return StandardResponse(
        code=200,
        error=False,
        message="Dataset feature updated successfully",
        data=DatasetFeatureMetadataUpdateResponse(
            status=update_status
        )
    )

async def fetch_dataset_feature_metadata(dataset_id: int, current_user: User, db: Session):
    """Mengambil feature metadata dari dataset."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            dataset = session.get(Dataset_Bin, dataset_id)

            if dataset is None:
                raise HTTPException(
                    status_code=404,
                    detail="Dataset tidak ditemukan"
                )

            if dataset.user_id != current_user.id:
                raise HTTPException(
                    status_code=403,
                    detail="Tidak memiliki akses ke dataset ini"
                )

            feature_metadata = dataset.feature_metadata

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal mengambil feature_metadata dataset: {e}"
        )

    return StandardResponse(
        code=200,
        error=False,
        message="Feature metadata fetched successfully",
        data=feature_metadata
    )

async def soft_delete_cleaned_datasets(
    ori_data_id: int,
    model: str,
    current_user: User,
    db: Session
):
    """
    Soft-delete semua record cleaned dataset yang mengacu ke dataset original
    yang sama (ori_data_id) dan model yang sama, untuk mencegah duplikasi record
    aktif sebelum preprocessing baru diupload.

    Mengisi kolom deleted_at dengan timestamp saat ini pada semua record yang
    memenuhi kriteria: is_cleaned=True, ori_data_id cocok, model cocok,
    dan deleted_at masih NULL (belum di-soft-delete sebelumnya).
    """
    transaction_manager = TransactionManager(db)

    try:
        with transaction_manager.transaction() as session:
            existing_records = (
                session.query(Dataset_Bin)
                .filter(
                    Dataset_Bin.ori_data_id == ori_data_id,
                    Dataset_Bin.model == model,
                    Dataset_Bin.is_cleaned == True,
                    Dataset_Bin.deleted_at == None,
                )
                .all()
            )

            affected = 0
            for record in existing_records:
                record.delete()
                affected += 1

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Gagal menghapus record cleaned dataset lama: {e}"
        )

    return StandardResponse(
        code=200,
        error=False,
        message=f"{affected} record cleaned dataset lama berhasil di-soft-delete",
        data={"affected_records": affected}
    )

async def fetch_analysis_history_by_user(current_user: User, db: Session):
    """Menampilkan riwayat analisis beserta insight summary yang terkait dengan user."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            # Gunakan Raw SQL untuk nge-join tabel dan format data agar langsung 
            # cocok dengan bentuk `AnalysisRow` interface di frontend.
            stmt = text("""
                SELECT 
                    ah.id::TEXT,
                    COALESCE(d.dataset_name, 'Dataset Dihapus') AS dataset,
                    TO_CHAR(ah.created_at, 'Mon DD, YYYY') AS tanggal,
                    INITCAP(m.type) AS metode,
                    ah.status,
                    COALESCE(fr.insight_summary, cr.insight_summary, 'Belum ada insight.') AS insight,
                    fr.confidence_level,
                    cr.silhouette_score
                FROM analysis_history ah
                LEFT JOIN datasets_bin d ON ah.dataset_id = d.id
                LEFT JOIN ml_models m ON ah.model_id = m.id
                LEFT JOIN forecasting_results fr ON ah.id = fr.analysis_id
                LEFT JOIN clustering_results cr ON ah.id = cr.analysis_id
                WHERE ah.user_id = :user_id
                ORDER BY ah.created_at DESC
            """)
            
            records = session.execute(stmt, {"user_id": current_user.id}).mappings().all()
            history_data = [dict(row) for row in records]

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal mengambil riwayat analisis: {e}"
        )

    return StandardResponse(
    code=200,
    error=False,
    message="Analysis history fetched successfully",
    data=history_data
)

async def analyze_dataset_columns(dataset_id: int, model_type: str, current_user: User, db: Session, force_reload: bool = False):
    """Memanggil endpoint analyze-columns di ml_services."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            dataset = session.get(Dataset_Bin, dataset_id)
            if not dataset or dataset.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Dataset tidak ditemukan atau tidak memiliki akses")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memverifikasi dataset: {e}")

    ml_url = get_settings().ML_SERVICE_URL

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            analyze_payload = {"dataset_id": dataset_id, "model_type": model_type, "force_reload": force_reload}
            analyze_response = await client.post(f"{ml_url}/ml/v1/openrouter/analyze-columns", json=analyze_payload)
            
            if analyze_response.status_code != 200:
                raise HTTPException(status_code=analyze_response.status_code, detail=f"Gagal saat analyze-columns: {analyze_response.text}")

            ml_data = analyze_response.json()
            return StandardResponse(
                code=ml_data.get("code", analyze_response.status_code),
                error=ml_data.get("error", False),
                message=ml_data.get("message", "Berhasil menjalankan analyze-columns"),
                data=ml_data.get("data", ml_data)
            )
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi ML Services: {str(e)}")

async def preprocess_dataset_run(dataset_id: int, model_type: str, current_user: User, db: Session, job_id: str | None = None):
    """Memanggil endpoint run preprocessing di ml_services."""
    transaction_manager = TransactionManager(db)
    
    try:
        with transaction_manager.transaction() as session:
            dataset = session.get(Dataset_Bin, dataset_id)
            if not dataset or dataset.user_id != current_user.id:
                raise HTTPException(status_code=404, detail="Dataset tidak ditemukan atau tidak memiliki akses")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memverifikasi dataset: {e}")

    ml_url = get_settings().ML_SERVICE_URL

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            preprocess_payload = {"dataset_id": dataset_id, "model_type": model_type}
            if job_id:
                preprocess_payload["job_id"] = job_id
            
            preprocess_response = await client.post(f"{ml_url}/ml/v1/preprocess/run", json=preprocess_payload)

            if preprocess_response.status_code != 200:
                raise HTTPException(status_code=preprocess_response.status_code, detail=f"Gagal saat run preprocessing: {preprocess_response.text}")

            try:
                ml_data = preprocess_response.json()
            except ValueError:
                ml_data = {"data": preprocess_response.text}

            return StandardResponse(
                code=ml_data.get("code", preprocess_response.status_code),
                error=ml_data.get("error", False),
                message=ml_data.get("message", "Berhasil menjalankan preprocessing"),
                data=ml_data.get("data", ml_data)
            )
            
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghubungi ML Services: {str(e)}")

async def preprocess_websocket_handler(websocket: WebSocket, job_id: str):
    await websocket.accept()
    settings = get_settings()
    ws_base = settings.ML_SERVICE_URL.replace("http://", "ws://").replace("https://", "wss://")
    ml_ws_url = f"{ws_base}/ml/v1/preprocess/ws/{job_id}"
    
    async def proxy_ml_to_client(ml_ws, client_ws):
        try:
            while True:
                msg = await ml_ws.recv()
                await client_ws.send_text(msg)
        except Exception:
            pass

    async def proxy_client_to_ml(ml_ws, client_ws):
        try:
            while True:
                msg = await client_ws.receive_text()
                await ml_ws.send(msg)
        except Exception:
            pass

    try:
        async with websockets.connect(ml_ws_url) as ml_ws:
            task1 = asyncio.create_task(proxy_ml_to_client(ml_ws, websocket))
            task2 = asyncio.create_task(proxy_client_to_ml(ml_ws, websocket))
            done, pending = await asyncio.wait(
                [task1, task2],
                return_when=asyncio.FIRST_COMPLETED
            )
            for task in pending:
                task.cancel()
    except Exception as e:
        print(f"WebSocket Proxy Error: {e}")
    finally:
        try:
            await websocket.close()
        except RuntimeError:
            pass
