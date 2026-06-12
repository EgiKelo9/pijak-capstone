import json
from app.core.config import get_settings
from app.core.utils import generate_from_openrouter

from app.core.utils import generate_from_openrouter
settings = get_settings()

async def get_insight_from_gemma(forecast_data: dict) -> str:
    """Helper function to get forecast insight via OpenRouter."""
    prompt = (
        f"Kamu adalah Business Analyst untuk wirausaha retail. "
        f"Berdasarkan prediksi penjualan produk berikut:\n"
        f"{json.dumps(forecast_data, default=str)}\n\n"
        f"Berikan insight bisnis dalam format berikut. "
        f"Jangan gunakan markdown formatting seperti ** atau *. "
        f"Gunakan plain text saja. Maksimal 15 kalimat total.\n\n"
        f"TREN PENJUALAN: Ringkasan tren secara keseluruhan.\n\n"
        f"PRODUK PRIORITAS:\n"
        f"- Produk yang perlu RESTOCK segera\n"
        f"- Produk dengan tren NAIK yang perlu dipertahankan\n"
        f"- Produk dengan tren TURUN yang perlu dievaluasi\n\n"
        f"REKOMENDASI AKSI: 2-3 langkah konkret yang bisa dilakukan sekarang.\n\n"
        f"Gunakan bahasa Indonesia yang singkat dan mudah dipahami UMKM."
    )
    result = await generate_from_openrouter(prompt)
    if result.error or not result.data:
        return "Insight tidak tersedia saat ini. Coba lagi nanti."
    return result.data.get("response", "Insight tidak tersedia.")

async def get_insight_from_clustering(cluster_summary: dict) -> str:
    """Helper function to get clustering insight via OpenRouter."""
    prompt = (
        f"Kamu adalah Business Analyst untuk wirausaha retail. "
        f"Berdasarkan hasil segmentasi produk berikut (rata-rata fitur per klaster):\n"
        f"{json.dumps(cluster_summary, default=str)}\n\n"
        f"Berikan insight bisnis dalam format berikut. "
        f"Jangan gunakan markdown formatting seperti ** atau *. "
        f"Gunakan plain text saja. Maksimal 15 kalimat total.\n\n"
        f"KATEGORI CLUSTER: Kategorikan tiap cluster sebagai Fast Moving, "
        f"Medium Moving, atau Slow Moving berdasarkan Sales dan Quantity.\n\n"
        f"INSIGHT PER CLUSTER (maks 2 kalimat per cluster): "
        f"Sebutkan karakteristik utama dan 1 rekomendasi aksi.\n\n"
        f"PRIORITAS AKSI BISNIS:\n"
        f"- Produk yang perlu RESTOCK\n"
        f"- Produk yang perlu DISKON\n"
        f"- Produk yang perlu DIEVALUASI\n\n"
        f"Gunakan bahasa Indonesia yang singkat dan mudah dipahami UMKM."
    )
    result = await generate_from_openrouter(prompt)
    if result.error or not result.data:
        return "Insight tidak tersedia saat ini. Coba lagi nanti."
    return result.data.get("response", "Insight tidak tersedia.")

async def check_gemma_health() -> dict:
    """Health check via OpenRouter."""
    result = await generate_from_openrouter("Balas hanya dengan kata 'OK'")
    if result.error:
        return {
            "status": "error",
            "model": settings.LLM_MODEL,
            "detail": result.message
        }
    return {
        "status": "healthy",
        "model": settings.LLM_MODEL,
        "detail": (result.data.get("response") or "").strip()
    }