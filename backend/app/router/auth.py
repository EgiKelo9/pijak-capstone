from typing import Any, Dict
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.auth import UserRegisterRequest, UserRegisterResponse, UserLoginRequest, UserLoginResponse
from app.controller.auth import register, login

router = APIRouter(prefix="/auth")


@router.post(
    "/register",
    response_model=StandardResponse[UserRegisterResponse],
    responses={
        422: {"model": StandardResponse[Dict[str, Any]], "description": "Validation Error"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def register_user(user: UserRegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user.

    Args:
        user (UserRegisterRequest): Registration payload containing name, email, and password.
        db (Session, optional): Database session injected by FastAPI.

    Returns:
        StandardResponse[UserRegisterResponse]: Registered user data containing id, name, and email.

    Raises:
        HTTPException: 400 if the email is already registered.
        HTTPException: 422 if request validation fails.
    """
    return await register(user, db)

@router.post(
    "/login",
    response_model=StandardResponse[UserLoginResponse],
    responses={
        422: {"model": StandardResponse[Dict[str, Any]], "description": "Validation Error"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def login_user(user: UserLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a user and return an access token.

    Args:
        user (UserLoginRequest): Login payload containing email and password.
        db (Session, optional): Database session injected by FastAPI.

    Returns:
        StandardResponse[UserLoginResponse]: Bearer access token and token type.

    Raises:
        HTTPException: 404 if the user is not found.
        HTTPException: 401 if the password is incorrect.
        HTTPException: 422 if request validation fails.
    """
    return await login(user, db)
    