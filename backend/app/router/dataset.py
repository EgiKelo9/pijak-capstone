from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse, DatasetFetchResponse
from app.controller.dataset import upload, upload_bin, fetch_dataset_bin
from app.shared.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/datasets")


@router.post(
    "/upload",
    response_model=StandardResponse[DatasetUploadResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)

async def upload_dataset(
    file: UploadFile = File(..., description="Pilih file dataset berformat .csv"), 
    is_cleaned: bool = Form(False),
    ori_data_id: Optional[int] = Form(None),
    model: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a CSV dataset for the authenticated user.

    Args:
        file (UploadFile, optional): CSV file to upload. The file must have a .csv extension.
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user from the access token.

    Returns:
        StandardResponse[DatasetUploadResponse]: Upload result containing dataset_id and filename.

    Raises:
        HTTPException: 400 if the uploaded file is not a CSV.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 500 if the file cannot be saved or dataset metadata fails to persist.
        HTTPException: 422 if request validation fails.
    """
    return await upload_bin(file, current_user, db, is_cleaned, ori_data_id, model)

@router.get(
    "/{dataset_id}",
    response_model=StandardResponse[DatasetFetchResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)

async def fetch_dataset(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await fetch_dataset_bin(dataset_id, current_user, db)