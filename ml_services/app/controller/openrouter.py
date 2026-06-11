import json
from typing import Any
from app.core.config import get_settings
from app.core.utils import generate_from_openrouter
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse
from app.schemas.features import Feature
from app.core.utils import get_dataset, get_dataset_info, update_dataset_feature_metadata, get_dataset_feature_metadata

settings = get_settings()
LLM_MODEL = settings.LLM_MODEL

TASK_LABEL_MAP = {
    "forecasting": "forecasting penjualan produk",
    "clustering": "clustering produk",
}

async def analyze_columns(req: DatasetMetadataRequest) -> OpenRouterMappingResponse:
    """Menganalisis metadata dataset dan memberikan saran pemetaan kolom menggunakan OpenRouter."""
    try:
        # 0. Cek DB jika sudah ada dan tidak sedang force reload
        if not req.force_reload:
            try:
                existing_metadata = await get_dataset_feature_metadata(req.dataset_id)
                if existing_metadata and existing_metadata.get("analyze_status") not in ["processing", "error"]:
                    print(f"Loaded existing feature metadata from DB for dataset {req.dataset_id}", flush=True)
                    return OpenRouterMappingResponse(
                        status="success",
                        task=req.model_type,
                        suggested_mapping=Feature(**existing_metadata),
                    )
            except Exception as e:
                print(f"Failed to use existing feature metadata: {e}", flush=True)

        # 1. Fetch dataset dari backend
        df, _ = await get_dataset(req.dataset_id)
        # 2. Build metadata dari DataFrame
        dataset_info = get_dataset_info(df)
        # print(dataset_info)  # Debug: Lihat metadata yang akan dikirim ke LLM

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
        """
        
        print("Generated prompt for OpenRouter:", prompt, flush=True)  # Debug: Lihat prompt yang akan dikirim ke LLM
        # 5. Kirim ke OpenRouter
        llm_response = await generate_from_openrouter(prompt, schema=Feature)
        
        if getattr(llm_response, "error", False):
            print(f"OpenRouter returned an error: {llm_response.message}", flush=True)
            return OpenRouterMappingResponse(
                status="error",
                task=task_str,
                # suggested_mapping=Feature()  # fallback empty
                suggested_mapping=None
            )
    
        raw_text = llm_response.data.get("response", "")

        # print("Raw LLM response:", raw_text, flush=True)
        clean_json = raw_text.replace("```json", "").replace("```", "").strip()
        # print("Clean JSON:", clean_json, flush=True)
        parsed = json.loads(clean_json)
        # print("Parsed JSON:", parsed, flush=True)
        
        mapping = Feature(**parsed)
        feature_update_response = await update_dataset_feature_metadata(req.dataset_id, mapping)

        return OpenRouterMappingResponse(
            status="success",
            task=task_str,
            suggested_mapping=mapping,
        )
    except Exception as e:
        print(f"=== CRITICAL ERROR in analyze_columns ===: {str(e)}", flush=True)
        # Update metadata to error status
        try:
            from app.core.utils import call_backend_api
            await call_backend_api(
                "PATCH",
                f"/api/v1/datasets/feature-metadata-update/{req.dataset_id}",
                json={"analyze_status": "error"}
            )
        except Exception as update_e:
            print(f"Failed to update error status: {update_e}")

        return OpenRouterMappingResponse(
            status="error",
            task=req.model_type,
            suggested_mapping=None
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
        f"Berdasarkan prediksi penjualan agregat (keseluruhan) berikut:\n"
        f"{json.dumps(forecast_summary, default=str)}\n\n"
        f"Berikan insight bisnis dalam format berikut. "
        f"Jangan gunakan markdown formatting seperti ** atau *. "
        f"Gunakan plain text saja. Maksimal 15 kalimat total.\n\n"
        f"TREN KESELURUHAN: Ringkasan tren prediksi penjualan keseluruhan usaha di masa depan.\n\n"
        f"ANALISIS PERFORMA: Penjelasan singkat mengenai proyeksi penjualan dan tingkat stabilitasnya (berdasarkan data prediksi).\n\n"
        f"REKOMENDASI AKSI: 2-3 langkah konkret yang bisa dilakukan sekarang oleh UMKM (seperti alokasi modal, strategi promosi keseluruhan, atau manajemen operasional).\n\n"
        f"Gunakan bahasa Indonesia yang singkat dan mudah dipahami UMKM."
    )
    try:
        result = await generate_from_openrouter(prompt)
        if getattr(result, "error", False):
            return f"OpenRouter error: {result.message}"
        return result.data.get("response", "") if result.data else ""
    except Exception as e:
        return f"OpenRouter error: {str(e)}"
