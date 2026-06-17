from app.schemas.base import StandardResponse
from app.core.utils import generate_from_openrouter

def check_health() -> StandardResponse[dict]:
    """Health check untuk memastikan layanan berjalan dengan baik."""
    return StandardResponse(
        code=200,
        error=False,
        message="ML Model is healthy",
        data={"status": "ok"}
    )
    
async def check_llm_health() -> StandardResponse[dict]:
    """Health check untuk memastikan LLM berjalan dengan baik melalui OpenRouter."""
    try:
        llm_response = await generate_from_openrouter(
            "Balas hanya dengan kata 'OK' atau 'Healthy'."
        )

        if getattr(llm_response, "error", False):
            return StandardResponse(
                code=500,
                error=True,
                message=f"LLM health check failed: {llm_response.message}",
                data={"status": "error"}
            )

        reply = llm_response.data.get("response", "") if llm_response.data else ""
        return StandardResponse(
            code=200,
            error=False,
            message="LLM (OpenRouter) is healthy",
            data={"status": reply}
        )
    except Exception as e:
        return StandardResponse(
            code=500,
            error=True,
            message=f"LLM health check failed: {str(e)}",
            data={"status": "error"}
        )
