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

FALLBACK_FEATURE = Feature(
    cols_to_drop=None,
    col_date_time=None,
    col_product=None,
    col_target=None,
    col_to_numerical=None,
    col_to_categorical=None,
    new_feature_pairing=None,
    reasonings="Fallback: gagal menganalisis kolom."
)

async def analyze_columns(req: DatasetMetadataRequest) -> OpenRouterMappingResponse:
    """Menganalisis metadata dataset dan memberikan saran pemetaan kolom menggunakan OpenRouter."""
    try:
        # Fetch dataset dari backend
        df, _ = await get_dataset(req.dataset_id)
        
        # Build metadata dari DataFrame
        dataset_info = get_dataset_info(df)

        # Handle model_type map (Clustering, Forecasting, or Both)
        task_str = req.model_type
        if task_str.lower() == "both":
            task_str = "Both"

        # Build prompt
        prompt = f"""
            Please extract features(columns) from the following dataset.
            The user wants to do {task_str} option from the available service of Clustering and Forecasting.
            Dataset:
            {dataset_info}
        """
                
        # Kirim ke OpenRouter
        llm_response = await generate_from_openrouter(prompt, schema=Feature)
        
        if getattr(llm_response, "error", False):
            return OpenRouterMappingResponse(
                status="error",
                task=task_str,
                suggested_mapping=FALLBACK_FEATURE
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
        print(f"[analyze_columns] Error: {e}")
        return OpenRouterMappingResponse(
            status="error",
            task=req.model_type,
            suggested_mapping=FALLBACK_FEATURE
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