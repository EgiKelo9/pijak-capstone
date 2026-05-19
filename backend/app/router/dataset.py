from typing import Any, Dict
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.dataset import DatasetUploadResponse
from app.controller.dataset import upload
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
    file: UploadFile = File(...), 
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
    return await upload(file, current_user, db)