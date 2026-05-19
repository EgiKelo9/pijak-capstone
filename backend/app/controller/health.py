from app.schemas.base import StandardResponse


def check_health() -> StandardResponse[dict]:
    """Health check untuk memastikan layanan berjalan dengan baik."""
    return StandardResponse(
        code=200,
        error=False,
        message="System is healthy",
        data={"status": "ok"}
    )
