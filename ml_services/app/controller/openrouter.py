import json
from typing import Any
from app.core.config import get_settings
from app.core.utils import generate_from_openrouter
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse, ColumnMapping

settings = get_settings()
LLM_MODEL = settings.LLM_MODEL


async def analyze_columns(req: DatasetMetadataRequest) -> OpenRouterMappingResponse:
    """Menganalisis metadata dataset dan memberikan saran pemetaan kolom menggunakan OpenRouter."""
    prompt = f"""
    Kamu adalah Lead AI Data Scientist. Tugasmu adalah memetakan kolom dari dataset transaksional bisnis secara akurat untuk tahap preprocessing.

    Task Machine Learning saat ini: "{req.target_task}"

    # METADATA DATASET
    - Kolom yang tersedia: {req.columns}
    - Tipe Data: {req.data_types}
    - Contoh data: {req.sample_rows[:2]}

    # ATURAN PEMETAAN (WAJIB DIIKUTI)
    1. date_column: Pilih tepat SATU kolom yang menunjukkan waktu/tanggal transaksi (misal: Order Date, Date). Dataset ini adalah data transaksional, jadi kolom ini PASTI ada.
    2. identifier_column: Pilih tepat SATU kolom yang menjadi identitas utama (misal: Product ID, Order ID).
    3. target_metrics: 
    - Jika task adalah "sales-forecasting", isi dengan metrik yang akan diprediksi (misal: Sales, Quantity).
    - Jika task adalah "product-clustering", kosongkan array ini [] karena clustering adalah Unsupervised Learning (metrik kuantitatif akan masuk ke feature_columns).
    4. feature_columns: Array berisi kolom-kolom yang relevan untuk dianalisis (misal: Category, Segment, Discount, Profit).
    - EKSKLUSI 1: JANGAN masukkan kolom yang sudah terpilih di date_column, identifier_column, atau target_metrics.
    - EKSKLUSI 2: JANGAN masukkan teks bebas, nama orang, atau identifier sekunder yang menjadi noise (misal: Customer Name, Row ID).

    # ATURAN FORMAT
    Balas HANYA dengan JSON valid. Nama kolom harus SAMA PERSIS (case-sensitive) dengan daftar yang tersedia.

    {{
        "date_column": "nama_kolom",
        "target_metrics": ["kolom_target"] atau [],
        "identifier_column": "nama_kolom",
        "feature_columns": ["fitur1", "fitur2", "fitur3"]
    }}
    """
    
    try:
        gemma_response = await generate_from_openrouter(prompt)
        
        if getattr(gemma_response, "error", False):
            return OpenRouterMappingResponse(
                status="error",
                task=req.target_task,
                suggested_mapping=ColumnMapping()
            )
    
        raw_text = gemma_response.data.get("response", "")
        clean_json = raw_text.replace("```json", "").replace("```", "").strip()
        gemma_dict = json.loads(clean_json)
        
        mapping = ColumnMapping(
            date_column=gemma_dict.get("date_column"),
            target_metrics=gemma_dict.get("target_metrics", []),
            identifier_column=gemma_dict.get("identifier_column"),
            feature_columns=gemma_dict.get("feature_columns", [])
        )
        
        return OpenRouterMappingResponse(
            status="success",
            task=req.target_task,
            suggested_mapping=mapping,
        )
    except Exception as e:
        return OpenRouterMappingResponse(
            status="error",
            task=req.target_task,
            suggested_mapping=ColumnMapping()
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
        