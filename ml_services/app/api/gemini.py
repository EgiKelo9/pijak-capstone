import os
import json
import google.generativeai as genai
from fastapi import APIRouter
from app.schemas.gemini import GeminiHealthResponse, GeminiInsightRequest, GeminiInsightResponse

# Environment variables untuk Gemini API
router = APIRouter()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

_gemini_client = None
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    _gemini_client = genai.GenerativeModel(GEMINI_MODEL)
    
# ==================================================
# Helper function untuk memanggil Gemini dengan aman
# ==================================================

def get_insight_from_gemini(forecast_data: dict) -> str:
    """Helper function to call Gemini logic safely."""
    if not _gemini_client:
        return "Gemini API is not configured. Insight generated offline."
    
    try:
        prompt = (
            f"Kamu adalah Business Analyst anon-teknis untuk wirausaha retail. "
            f"Berdasarkan prediksi permintaan produk berikut:\n"
            f"{json.dumps(forecast_data, default=str)}\n\n"
            f"Berikan rekomendasi aksi bisnis yang konkret, singkat, dan mudah dipahami. "
            f"Fokus pada stok, barang tak laku, dan peluang promo."
        )
        response = _gemini_client.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Gemini error: {str(e)}"
    
# =====================
# Endpoint untuk Gemini
# =====================

@router.get("/health/gemini", response_model=GeminiHealthResponse)
def health_gemini():
    """Health check khusus Gemini."""
    if not GEMINI_API_KEY:
        return GeminiHealthResponse(
            status="not_configured",
            model=GEMINI_MODEL,
            detail="GEMINI_API_KEY is not set"
        )
    try:
        response = _gemini_client.generate_content("Balas hanya dengan kata 'OK'")
        return GeminiHealthResponse(
            status="healthy",
            model=GEMINI_MODEL,
            detail=response.text.strip()
        )
    except Exception as e:
        return GeminiHealthResponse(
            status="error",
            model=GEMINI_MODEL,
            detail=str(e)
        )
