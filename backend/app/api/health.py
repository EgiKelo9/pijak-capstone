import os
import httpx
from typing import Any, Dict
from fastapi import APIRouter
from app.schemas.health import BasicHealthResponse, FullHealthResponse, DependencyStatus, HealthMLServiceResponse, HealthGeminiResponse

router = APIRouter()
ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

# ==============================================
# Helper functions untuk cek status dependencies
# ==============================================

async def check_ml_dependency() -> DependencyStatus:
    status_dict = {"status": "unreachable", "url": ML_SERVICE_URL}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{ML_SERVICE_URL}/health", timeout=5.0)
            resp.raise_for_status()
            status_dict["status"] = "healthy"
            status_dict["detail"] = resp.json()
        except httpx.TimeoutException:
            status_dict["status"] = "timeout"
            status_dict["detail"] = "ML service did not respond within 5s"
        except Exception as e:
            status_dict["status"] = "error"
            status_dict["detail"] = str(e)
    return DependencyStatus(**status_dict)

async def check_gemini_dependency() -> DependencyStatus:
    status_dict = {"status": "unreachable", "url": f"{ML_SERVICE_URL}/health/gemini"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{ML_SERVICE_URL}/health/gemini", timeout=10.0)
            resp.raise_for_status()
            status_dict["status"] = "healthy"
            data = resp.json()
            status_dict["model"] = data.get("model")
            status_dict["detail"] = data.get("detail")
        except httpx.TimeoutException:
            status_dict["status"] = "timeout"
            status_dict["detail"] = "Gemini endpoint did not respond within 10s"
        except Exception as e:
            status_dict["status"] = "error"
            status_dict["detail"] = str(e)
    return DependencyStatus(**status_dict)


# ======================================
# Endpoint health check untuk ML service
# ======================================

@router.get("/health", response_model=BasicHealthResponse)
def health_check():
    """
    Health check sederhana untuk backend itu sendiri.
    Tidak memanggil service lain — cocok untuk load balancer / tunnel probe.
    """
    return BasicHealthResponse(
        status="healthy",
        service="backend-fastapi",
        version="1.0.0"
    )

@router.get("/health/full", response_model=FullHealthResponse)
async def health_full():
    """
    Health check menyeluruh: backend + custom ML service (termasuk gemini yang via ML service).
    """
    ml_status = await check_ml_dependency()
    gemini_status = await check_gemini_dependency()
    all_healthy = (ml_status.status == "healthy" and gemini_status.status == "healthy")

    response_data = FullHealthResponse(
        status="healthy" if all_healthy else "degraded",
        service="backend-fastapi",
        dependencies={
            "ml_service": ml_status,
            "gemini": gemini_status
        }
    )
    if not all_healthy:
        raise HTTPException(status_code=503, detail=response_data.model_dump())
    return response_data
    
@router.get("/health/ml", response_model=HealthMLServiceResponse)
async def health_ml_service():
    """
    Endpoint ini dipanggil oleh backend untuk cek kesehatan ML service.
    ML service akan melakukan self-check dan mengembalikan statusnya.
    """
    ml_status = await check_ml_dependency()
    if ml_status.status != "healthy":
        raise HTTPException(
            status_code=503,
            detail={"status": ml_status.status, "url": ml_status.url, "detail": ml_status.detail}
        )
    return HealthMLServiceResponse(
        status=ml_status.status,
        url=ml_status.url,
        detail=ml_status.detail
    )
    
@router.get("/health/gemini", response_model=HealthGeminiResponse)
async def health_gemini():
    """
    Endpoint ini dipanggil oleh backend untuk cek kesehatan Gemini via ML service.
    ML service akan mencoba akses Gemini dan mengembalikan statusnya.
    """
    gemini_status = await check_gemini_dependency()
    if gemini_status.status != "healthy":
        raise HTTPException(
            status_code=503,
            detail={"status": gemini_status.status, "model": gemini_status.model, "detail": gemini_status.detail}
        )
    return HealthGeminiResponse(
        status=gemini_status.status,
        model=gemini_status.model,
        detail=gemini_status.detail
    )
