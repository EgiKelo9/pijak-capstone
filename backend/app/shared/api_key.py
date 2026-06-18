import secrets
from fastapi import Header, HTTPException, status
from app.core.config import get_settings


def verify_api_key(x_api_key: str = Header(..., alias="X-API-Key")):
    """
    FastAPI dependency untuk memverifikasi API Key dari header `X-API-Key`.

    Digunakan secara eksklusif oleh internal service (ML Services) untuk
    mengakses endpoint backend tanpa perlu autentikasi JWT.

    Menggunakan `secrets.compare_digest` untuk mencegah timing attack.

    Raises:
        HTTPException: 401 jika API Key tidak ada atau tidak valid.
        HTTPException: 503 jika ML_API_KEY belum dikonfigurasi di server.
    """
    settings = get_settings()

    if not settings.ML_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ML_API_KEY belum dikonfigurasi di server.",
        )

    if not secrets.compare_digest(x_api_key, settings.ML_API_KEY):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key tidak valid.",
        )

    return True
