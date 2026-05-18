import json
import httpx
from app.core.config import get_settings

settings = get_settings()

OLLAMA_BASE_URL = settings.OLLAMA_BASE_URL
LLM_MODEL = settings.LLM_MODEL

async def get_insight_from_gemma(forecast_data: dict) -> str:
    """Helper function to call local Gemma logic safely via Ollama."""
    try:
        prompt = (
            f"Kamu adalah Business Analyst anon-teknis untuk wirausaha retail. "
            f"Berdasarkan prediksi permintaan produk berikut:\n"
            f"{json.dumps(forecast_data, default=str)}\n\n"
            f"Berikan rekomendasi aksi bisnis yang konkret, singkat, dan mudah dipahami. "
            f"Fokus pada stok, barang tak laku, dan peluang promo."
        )
        
        payload = {
            "model": LLM_MODEL,
            "prompt": prompt,
            "stream": False
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_BASE_URL, json=payload, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            return data.get("response", "")
            
    except Exception as e:
        return f"Gemma error: {str(e)}"
        
async def check_gemma_health() -> dict:
    """Health check for local Gemma via Ollama."""
    try:
        payload = {
            "model": LLM_MODEL,
            "prompt": "Balas hanya dengan kata 'OK'",
            "stream": False
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(OLLAMA_BASE_URL, json=payload, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            return {
                "status": "healthy",
                "model": LLM_MODEL,
                "detail": data.get("response", "").strip()
            }
    except Exception as e:
        return {
            "status": "error",
            "model": LLM_MODEL,
            "detail": str(e)
        }