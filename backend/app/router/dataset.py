
import json
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse, DatasetFetchResponse, DatasetFetchByUserResponse, DatasetFeatureMetadataUpdateResponse, ProcessDatasetRequest
from app.controller.dataset import upload_bin, fetch_dataset_bin, fetch_datasets_bin_by_user, soft_delete_cleaned_datasets, fetch_analysis_history_by_user, update_dataset_feature, analyze_dataset_columns, preprocess_dataset_run, fetch_dataset_feature_metadata, preprocess_websocket_handler, fetch_cleaned_dataset_ids
from app.shared.dependencies import get_current_user, get_api_key_or_user
from app.models.user import User
from fastapi import WebSocket
from app.core.config import get_settings

settings = get_settings()

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
    feature_metadata: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_api_key_or_user)
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
    parsed_metadata = None
    if feature_metadata:
        try:
            parsed_metadata = json.loads(feature_metadata)
        except json.JSONDecodeError:
            pass

    return await upload_bin(file, current_user, db, is_cleaned, ori_data_id, model, parsed_metadata)

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
    current_user = Depends(get_api_key_or_user)
):
    """
    Fetch a dataset for the authenticated user.

    Args:
        dataset_id (int): The ID of the dataset to fetch.
        db (Session, optional): Database session injected by FastAPI.
        current_user: Currently authenticated user (JWT) or ML service sentinel.

    Returns:
        StandardResponse[DatasetFetchResponse]: Dataset containing metadata and data_url.

    Raises:
        HTTPException: 400 if the dataset ID is invalid.
        HTTPException: 401 if not authenticated.
        HTTPException: 404 if the dataset is not found.
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
    current_user = Depends(get_api_key_or_user)
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
    current_user = Depends(get_api_key_or_user)
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
    current_user = Depends(get_api_key_or_user)
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

@router.post(
    "/analyze-columns",
    response_model=StandardResponse[Dict[str, Any]],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        404: {"model": StandardResponse[dict], "description": "Not Found"},
        500: {"model": StandardResponse[dict], "description": "Internal Server Error"}
    }
)
async def analyze_columns(
    request: ProcessDatasetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Proxy request to ML Services for preprocessing.
    """
    return await analyze_dataset_columns(request.dataset_id, request.model_type, current_user, db, request.force_reload)

@router.post("/preprocess/run")
async def run_preprocess_proxy(
    payload: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Proxy request to ML Services for preprocessing.
    """
    dataset_id = payload.get("dataset_id")
    model_type = payload.get("model_type")
    job_id = payload.get("job_id")
    return await preprocess_dataset_run(dataset_id, model_type, current_user, db, job_id)

@router.websocket("/preprocess/ws/{job_id}")
async def preprocess_websocket_proxy(websocket: WebSocket, job_id: str):
    await preprocess_websocket_handler(websocket, job_id)

@router.get(
    "/{raw_dataset_id}/cleaned",
    response_model=StandardResponse[Any],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        403: {"model": StandardResponse[dict], "description": "Forbidden"},
        404: {"model": StandardResponse[dict], "description": "Not Found"},
        500: {"model": StandardResponse[dict], "description": "Internal Server Error"}
    }
)
async def get_cleaned_dataset_ids_route(
    raw_dataset_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the forecasting and clustering cleaned dataset IDs associated with a raw dataset.
    """
    return await fetch_cleaned_dataset_ids(raw_dataset_id, current_user, db)

