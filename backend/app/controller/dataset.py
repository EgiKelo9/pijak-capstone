import os
import time
import shutil
from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session
from app.models.dataset import Dataset
from app.models.user import User
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse
from app.shared.transaction_manager import TransactionManager

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