import json
from typing import Any
from app.core.config import get_settings
from app.core.utils import generate_from_openrouter
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse
from app.schemas.features import Feature
from app.core.utils import get_dataset, get_dataset_info

settings = get_settings()
LLM_MODEL = settings.LLM_MODEL

TASK_LABEL_MAP = {
    "forecasting": "forecasting penjualan produk",
    "clustering": "clustering produk",
}


async def analyze_columns(req: DatasetMetadataRequest) -> OpenRouterMappingResponse:
    """Menganalisis metadata dataset dan memberikan saran pemetaan kolom menggunakan OpenRouter."""
    try:
        # 1. Fetch dataset dari backend
        df, _ = await get_dataset(req.dataset_id)
        
        # 2. Build metadata dari DataFrame
        dataset_info = get_dataset_info(df)
        columns = list(df.columns)
        data_types = {col: str(dtype) for col, dtype in df.dtypes.items()}
        sample_rows = df.head(2).to_dict(orient="records")
        
        # 3. Handle model_type map (Clustering, Forecasting, or Both)
        task_str = req.model_type
        if task_str.lower() == "both":
            task_str = "Both"

        # 4. Build prompt identik dengan gemini.py, ditambah instruksi skema JSON
        prompt = f"""
            Please extract features(columns) from the following dataset.
            The user wants to do {task_str} option from the available service of Clustering and Forecasting.
            Dataset:
            {dataset_info}

            Respond ONLY with a valid JSON object that strictly matches the following JSON schema. Do not add markdown blocks or explanations:
            {json.dumps(Feature.model_json_schema(), indent=2)}
        """
        
        # 5. Kirim ke OpenRouter
        llm_response = await generate_from_openrouter(prompt)
        
        if getattr(llm_response, "error", False):
            return OpenRouterMappingResponse(
                status="error",
                task=task_str,
                suggested_mapping=Feature()  # fallback empty
            )
    
        raw_text = llm_response.data.get("response", "")
        clean_json = raw_text.replace("```json", "").replace("```", "").strip()
        parsed = json.loads(clean_json)
        
        mapping = Feature(**parsed)
        
        return OpenRouterMappingResponse(
            status="success",
            task=task_str,
            suggested_mapping=mapping,
        )
    except Exception as e:
        # Fallback ke empty feature jika parsing gagal
        try:
            fallback_mapping = Feature()
        except:
            fallback_mapping = None

        return OpenRouterMappingResponse(
            status="error",
            task=req.model_type,
            suggested_mapping=fallback_mapping
        )        
    
        
async def get_insight_from_data(target_task: str, json_data: Any) -> str:
    """Mendapatkan insight bisnis dari OpenRouter berdasarkan data yang diberikan."""
    prompt = f"""
    Kamu adalah Business Analyst non-teknis untuk wirausaha retail.

    Task Machine Learning saat ini: "{target_task}"

    Berdasarkan data prediksi berikut:
    {json.dumps(json_data, default=str)}

    Berikan insight bisnis yang konkret, singkat, dan mudah dipahami.
    Fokus pada stok, barang tak laku, peluang promo, dan tindakan prioritas yang relevan dengan task.

    Balas hanya dengan teks insight, tanpa markdown berlebihan.
    """

    try:
        insight_response = await generate_from_openrouter(prompt)

        if getattr(insight_response, "error", False):
            return f"OpenRouter error: {insight_response.message}"

        return insight_response.data.get("response", "") if insight_response.data else ""

    except Exception as e:
        return f"OpenRouter error: {str(e)}"
        

async def get_insight_from_clustering(cluster_summary: dict) -> str:
    """Mendapatkan insight bisnis dari hasil clustering via OpenRouter.
    
    Diadaptasi dari gemma.py::get_insight_from_clustering.
    Semua caller harus menggunakan fungsi ini (bukan dari gemma.py).
    """
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
    try:
        result = await generate_from_openrouter(prompt)
        if getattr(result, "error", False):
            return f"OpenRouter error: {result.message}"
        return result.data.get("response", "") if result.data else ""
    except Exception as e:
        return f"OpenRouter error: {str(e)}"


async def get_insight_from_forecasting(forecast_summary: dict) -> str:
    """Mendapatkan insight bisnis dari hasil forecasting via OpenRouter.
    
    Diadaptasi dari gemma.py::get_insight_from_gemma.
    Semua caller harus menggunakan fungsi ini (bukan dari gemma.py).
    """
    prompt = (
        f"Kamu adalah Business Analyst untuk wirausaha retail. "
        f"Berdasarkan prediksi penjualan produk berikut:\n"
        f"{json.dumps(forecast_summary, default=str)}\n\n"
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
    try:
        result = await generate_from_openrouter(prompt)
        if getattr(result, "error", False):
            return f"OpenRouter error: {result.message}"
        return result.data.get("response", "") if result.data else ""
    except Exception as e:
        return f"OpenRouter error: {str(e)}"
