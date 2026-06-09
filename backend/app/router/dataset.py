
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse, DatasetFetchResponse, DatasetFetchByUserResponse, DatasetFeatureMetadataUpdateResponse
from app.controller.dataset import upload, upload_bin, fetch_dataset_bin, fetch_datasets_bin_by_user, soft_delete_cleaned_datasets, fetch_analysis_history_by_user, update_dataset_feature, fetch_dataset_feature_metadata
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
    """
    Fetch a dataset for the authenticated user.

    Args:
        dataset_id (int): The ID of the dataset to fetch.
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user from the access token.

    Returns:
        StandardResponse[DatasetFetchResponse]: Dataset containing metadata and data_url.

    Raises:
        HTTPException: 400 if the dataset ID is invalid.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the dataset is not found.
        HTTPException: 500 if the dataset cannot be fetched.
        HTTPException: 422 if request validation fails.
    """
    return await fetch_dataset_bin(dataset_id, current_user, db)

@router.get(
    "/user/{current_user_id}",
    response_model=StandardResponse[DatasetFetchByUserResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def fetch_datasets_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a dataset for the authenticated user.

    Args:
        dataset_id (int): The ID of the dataset to fetch.
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user from the access token.

    Returns:
        StandardResponse[DatasetFetchResponse]: Dataset containing metadata and data_url specific to the user that requests it.

    Raises (probably):
        HTTPException: 400 if the dataset ID is invalid.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the dataset is not found.
        HTTPException: 500 if the dataset cannot be fetched.
        HTTPException: 422 if request validation fails.
    """
    return await fetch_datasets_bin_by_user(current_user, db)

@router.get(
    "/feature-metadata/{dataset_id}",
    response_model=StandardResponse[Any],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        403: {"model": StandardResponse[dict], "description": "Forbidden"},
        404: {"model": StandardResponse[dict], "description": "Not Found"}
    }
)
async def get_dataset_feature_metadata(
    dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the feature metadata analysis for a specific dataset.

    Args:
        dataset_id (int): The ID of the dataset.
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user.

    Returns:
        StandardResponse[Any]: A JSON object containing the feature metadata, or null if none exists.
    """
    return await fetch_dataset_feature_metadata(dataset_id, current_user, db)


@router.patch(
    "/feature-metadata-update/{dataset_id}",
    response_model=StandardResponse[DatasetFeatureMetadataUpdateResponse],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid File"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def update_dataset_feature_metadata(
    dataset_id: int,
    feature: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch a dataset for the authenticated user.

    Args:
        dataset_id (int): The ID of the dataset to fetch.
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user from the access token.

    Returns:
        StandardResponse[DatasetFetchResponse]: Dataset containing metadata and data_url specific to the user that requests it.

    Raises (probably):
        HTTPException: 400 if the dataset ID is invalid.
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 404 if the dataset is not found.
        HTTPException: 500 if the dataset cannot be fetched.
        HTTPException: 422 if request validation fails.
    """
    return await update_dataset_feature(current_user, db, feature, dataset_id)

@router.delete(
    "/cleaned",
    response_model=StandardResponse[dict],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        500: {"model": StandardResponse[dict], "description": "Internal Server Error"},
    }
)
async def invalidate_cleaned_datasets(
    ori_data_id: int,
    model: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Soft-delete semua record cleaned dataset aktif (deleted_at IS NULL)
    yang mengacu ke dataset original dengan ori_data_id dan model tertentu.

    Dipanggil oleh ML service sebelum mengupload hasil preprocessing baru
    untuk mencegah duplikasi record aktif di tabel datasets_bin.

    Args:
        ori_data_id (int): ID dataset original yang menjadi referensi.
        model (str): Nama model ('Forecasting' atau 'Clustering').

    Returns:
        StandardResponse[dict]: Jumlah record yang berhasil di-soft-delete.
    """
    return await soft_delete_cleaned_datasets(ori_data_id, model, current_user, db)
  
@router.get(
    "/analysis-history/user/me",
    response_model=StandardResponse[List[Dict[str, Any]]],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def get_analysis_history_by_user(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch analysis history along with insights for the authenticated user.

    Args:
        db (Session, optional): Database session injected by FastAPI.
        current_user (User, optional): Currently authenticated user from the access token.

    Returns:
        StandardResponse[List[Dict[str, Any]]]: Analysis history specific to the user that requests it.

    Raises:
        HTTPException: 401 if the user is not authenticated.
        HTTPException: 500 if the analysis history cannot be fetched.
    """
    return await fetch_analysis_history_by_user(current_user, db)