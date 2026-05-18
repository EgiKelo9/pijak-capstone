import httpx
from app.schemas.base import StandardResponse
from app.core.config import get_settings

settings = get_settings()

def check_health() -> StandardResponse[dict]:
    """Health check untuk memastikan layanan berjalan dengan baik."""
    return StandardResponse(
        code=200,
        error=False,
        message="ML Model is healthy",
        data={"status": "ok"}
    )
    
async def check_gemma_health() -> StandardResponse[dict]:
    """Health check untuk memastikan Gemma (LLM) berjalan dengan baik melalui Ollama."""
    try:
        payload = {
            "model": settings.LLM_MODEL,
            "prompt": "Balas hanya dengan kata 'OK' atau 'Healthy'.",
            "stream": False
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(settings.OLLAMA_BASE_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return StandardResponse(
                code=200,
                error=False,
                message="Gemma is healthy",
                data={"status": data.get("response", "").strip()}
            )
    except Exception as e:
        return StandardResponse(
            code=500,
            error=True,
            message=f"Gemma health check failed: {str(e)}",
            data={"status": "error"}
        )
