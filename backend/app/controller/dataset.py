import os
import time
import shutil
from typing import Optional
from fastapi import HTTPException, UploadFile, Form
from sqlalchemy.orm import Session
from app.models.dataset import Dataset, Dataset_Bin
from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse, DatasetFetchResponse
from app.shared.transaction_manager import TransactionManager
from fastapi.responses import StreamingResponse
from io import BytesIO
import chardet 

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
    model: Optional[str] = None
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
                is_cleaned=is_cleaned,
                ori_data_id=ori_data_id,
                model=model
            )
            session.add(new_dataset)
            session.flush()
            
            dataset_id = new_dataset.id
            dataset_name = new_dataset.dataset_name
            
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
            detail=f"Gagal menyimpan metadata dataset ke database: {e}"
        )

    return StreamingResponse(
        BytesIO(dataset.dataset_file),
        media_type="text/csv",
        headers={
            "Content-Disposition":
            f"attachment; filename={dataset.dataset_name}"
        }
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