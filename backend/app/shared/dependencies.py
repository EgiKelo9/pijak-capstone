import secrets
from typing import Optional
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.models.user import User
from app.shared.token import Token
from app.core.config import get_settings

security = HTTPBearer(auto_error=False)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), 
    db: Session = Depends(get_db)
):
    """
    Dependency untuk mengekstrak dan memvalidasi token, 
    kemudian mengembalikan objek User yang sedang login.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials / Token is invalid or expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception
    
    token_str = credentials.credentials
    token_manager = Token()
    payload = token_manager.verify_token(token_str)
    
    if payload is None:
        raise credentials_exception
        
    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception
        
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None or user.deleted_at is not None:
        raise credentials_exception
        
    return user


def get_api_key_or_user(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """
    Dependency untuk dual-auth: menerima JWT Bearer (frontend/user) ATAU
    API Key via header `X-API-Key` (ML Services / internal service).

    Urutan pengecekan:
    1. Jika header `X-API-Key` ada → verifikasi API Key.
    2. Jika header `Authorization: Bearer ...` ada → verifikasi JWT.
    3. Jika keduanya tidak ada → 401 Unauthorized.

    Returns:
        - Objek `User` jika autentikasi via JWT.
        - String `"ml_service"` jika autentikasi via API Key (sentinel value).

    Raises:
        HTTPException: 401 jika kedua auth gagal atau tidak ada.
        HTTPException: 503 jika ML_API_KEY belum dikonfigurasi.
    """
    settings = get_settings()

    # --- Cek API Key dulu ---
    api_key_header = request.headers.get("X-API-Key")
    if api_key_header is not None:
        if not settings.ML_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="ML_API_KEY belum dikonfigurasi di server.",
            )
        if not secrets.compare_digest(api_key_header, settings.ML_API_KEY):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="API Key tidak valid.",
            )
        return "ml_service"

    # --- Fallback ke JWT Bearer ---
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi diperlukan. Gunakan Bearer token atau X-API-Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials / Token is invalid or expired",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_str = credentials.credentials
    token_manager = Token()
    payload = token_manager.verify_token(token_str)

    if payload is None:
        raise credentials_exception

    user_id = payload.get("user_id")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()

    if user is None or user.deleted_at is not None:
        raise credentials_exception

    return user