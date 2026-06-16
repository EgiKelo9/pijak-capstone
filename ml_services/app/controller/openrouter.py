import json
from typing import Any
from app.core.config import get_settings
from app.core.utils import generate_from_openrouter
from app.schemas.openrouter import DatasetMetadataRequest, OpenRouterMappingResponse
from app.schemas.features import Feature
from app.core.utils import get_dataset, get_dataset_info, update_dataset_feature_metadata, get_dataset_feature_metadata, call_backend_api

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
        # 0. Cek DB jika sudah ada dan tidak sedang force reload.
        # PENTING: Harus skip jika analyze_status adalah "processing" atau "error"
        # agar background task ini tidak crash saat mencoba Feature(**{"analyze_status": "processing"})
        if not req.force_reload:
            try:
                existing_metadata = await get_dataset_feature_metadata(req.dataset_id)
                existing_status = existing_metadata.get("analyze_status") if existing_metadata else None
                if existing_metadata and existing_status not in ["processing", "error", None]:
                    print(f"[analyze_columns] Loaded existing feature metadata from DB for dataset {req.dataset_id}", flush=True)
                    # Hapus analyze_status sebelum dimasukkan ke Feature agar tidak crash
                    cleaned_metadata = {k: v for k, v in existing_metadata.items() if k != "analyze_status"}
                    return OpenRouterMappingResponse(
                        status="success",
                        task=req.model_type,
                        suggested_mapping=Feature(**cleaned_metadata),
                    )
            except Exception as e:
                print(f"[analyze_columns] Failed to use existing feature metadata: {e}", flush=True)

        # 1. Fetch dataset dari backend
        df, _ = await get_dataset(req.dataset_id)
        # 2. Build metadata dari DataFrame
        dataset_info = get_dataset_info(df)

        # 3. Handle model_type map (Clustering, Forecasting, or Both)
        task_str = req.model_type
        if task_str.lower() == "both":
            task_str = "Both"

        # Build prompt
        prompt = f"""Task: {task_str} (Clustering and/or Forecasting on retail sales data).
            Map dataset columns to the correct roles. Return ONLY a valid JSON object using JSON schema below, no explanation.

            Field definitions:
            - cols_to_drop: list of ID/name/irrelevant columns
            - col_date_time: {{"col_whole":"<col>","col_day":null,"col_month":null,"col_year":null}} — use col_whole if date is combined
            - col_product: single target column of product/category name columns (e.g. Product_Name, Item_Name)
            - col_target: single target column (e.g. Sales, Revenue)
            - col_to_numerical: list of columns to cast as numeric (null if none)
            - col_to_categorical: list of columns to cast as categorical (null if none)
            - new_feature_pairing: list of {{"column_1":"","operator":"divide|multiply|subtract|add","column_2":"","new_col_name":""}} or null
            - reasonings: one short sentence explaining key decisions

            Dataset info:
            {dataset_info}

            Respond with JSON only."""

        # Kirim ke OpenRouter
        llm_response = await generate_from_openrouter(prompt, schema=Feature)
        
        if getattr(llm_response, "error", False):
            print(f"[analyze_columns] OpenRouter returned an error: {llm_response.message}", flush=True)
            raise Exception(f"OpenRouter error: {llm_response.message}")
    
        raw_text = (llm_response.data or {}).get("response", "")
        if not raw_text:
            raise Exception("LLM returned empty response — model may have exhausted tokens on reasoning. Try again or use a different model.")
        
        # Robustly extract JSON object
        start_idx = raw_text.find('{')
        end_idx = raw_text.rfind('}')
        if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
            clean_json = raw_text[start_idx:end_idx + 1]
        else:
            clean_json = raw_text.replace("```json", "").replace("```", "").strip()
            
        parsed = json.loads(clean_json)
        
        mapping = Feature(**parsed)

        # Simpan hasil analisis ke DB dengan analyze_status: "done"
        # agar polling frontend bisa berhenti dan mendeteksi keberhasilan
        mapping_dict = mapping.model_dump()
        mapping_dict["analyze_status"] = "done"
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{req.dataset_id}",
            json=mapping_dict
        )
        print(f"[analyze_columns] Successfully saved feature metadata for dataset {req.dataset_id}", flush=True)

        return OpenRouterMappingResponse(
            status="success",
            task=task_str,
            suggested_mapping=mapping,
        )

    except Exception as e:
        print(f"[analyze_columns] Error: {e}", flush=True)
        # PENTING: Update status ke error agar polling frontend bisa berhenti
        try:
            await call_backend_api(
                "PATCH",
                f"/api/v1/datasets/feature-metadata-update/{req.dataset_id}",
                json={"analyze_status": "error"}
            )
        except Exception as patch_err:
            print(f"[analyze_columns] Failed to update error status: {patch_err}", flush=True)
        return OpenRouterMappingResponse(
            status="error",
            task=req.model_type,
            suggested_mapping=FALLBACK_FEATURE
        )


async def get_insight_from_data(target_task: str, json_data: Any) -> str:
    """Mendapatkan insight bisnis dari OpenRouter berdasarkan data yang diberikan."""
    # Prompt ringkas: role + task + data + output spec dalam satu blok
    prompt = f"""Analyst retail UMKM. Task: {target_task}.
        Data: {json.dumps(json_data, default=str)}
        Tulis insight bisnis plain text, max 8 kalimat. Fokus: stok, promo, prioritas aksi. Tanpa markdown."""
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
    cluster_ids = []
    if cluster_summary:
        first_feature = next(iter(cluster_summary.values()))
        if isinstance(first_feature, dict):
            try:
                cluster_ids = sorted(list(first_feature.keys()), key=lambda x: int(x))
            except Exception:
                cluster_ids = sorted(list(first_feature.keys()))
            
    klaster_templates_kategori = ""
    klaster_templates_insight = ""
    for i in range(len(cluster_ids)):
        klaster_templates_kategori += f"Klaster {i+1}: [Kategori Klaster {i+1}]\n"
        klaster_templates_insight += f"Klaster {i+1}: [Insight Klaster {i+1}]\n"
        
    prompt = (
        f"Kamu adalah Business Analyst untuk wirausaha retail.\n"
        f"Berdasarkan hasil segmentasi produk berikut (rata-rata fitur per klaster):\n"
        f"{json.dumps(cluster_summary, default=str)}\n\n"
        f"PENTING: Berikan insight bisnis dengan mengikuti format di bawah ini secara persis.\n"
        f"Jangan gunakan markdown formatting seperti ** atau *. Gunakan plain text saja.\n\n"
        f"Format output yang WAJIB diikuti secara paten:\n\n"
        f"KATEGORI CLUSTER:\n"
        f"{klaster_templates_kategori}\n"
        f"INSIGHT PER CLUSTER:\n"
        f"{klaster_templates_insight}\n"
        f"PRIORITAS AKSI BISNIS:\n"
        f"- Produk yang perlu RESTOCK: [Rekomendasi aksi restock]\n"
        f"- Produk yang perlu DISKON: [Rekomendasi aksi diskon]\n"
        f"- Produk yang perlu DIEVALUASI: [Rekomendasi aksi evaluasi]\n\n"
        f"Penjelasan format:\n"
        f"1. KATEGORI CLUSTER: Kategorikan tiap Klaster 1 s.d. Klaster {len(cluster_ids)} sebagai Fast Moving, "
        f"Medium Moving, atau Slow Moving berdasarkan nilai Sales dan Quantity yang ada pada data.\n"
        f"2. INSIGHT PER CLUSTER: Berikan 1-2 kalimat deskripsi karakteristik utama dan rekomendasi aksi untuk masing-masing Klaster.\n"
        f"3. PRIORITAS AKSI BISNIS: Berikan 1 rekomendasi aksi spesifik untuk masing-masing dari ketiga poin tersebut menggunakan bahasa Indonesia yang mudah dimengerti UMKM."
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
        f"Kamu adalah Business Analyst untuk wirausaha retail.\n"
        f"Berdasarkan prediksi penjualan agregat (keseluruhan) berikut:\n"
        f"{json.dumps(forecast_summary, default=str)}\n\n"
        f"PENTING: Berikan insight bisnis dengan mengikuti format di bawah ini secara persis.\n"
        f"Jangan gunakan markdown formatting seperti ** atau *. Gunakan plain text saja.\n\n"
        f"Format output yang WAJIB diikuti secara paten:\n\n"
        f"TREN KESELURUHAN:\n"
        f"[Isi ringkasan tren prediksi penjualan keseluruhan usaha di masa depan]\n\n"
        f"ANALISIS PERFORMA:\n"
        f"[Isi penjelasan singkat mengenai proyeksi penjualan dan tingkat stabilitasnya]\n\n"
        f"REKOMENDASI AKSI:\n"
        f"- Optimalisasi Stok & Ketersediaan: [Isi rekomendasi konkret terkait stok, ketersediaan barang, atau restock]\n"
        f"- Promosi & Program Loyalitas: [Isi rekomendasi konkret terkait promosi penjualan, diskon, atau program loyalitas]\n"
        f"- Evaluasi & Perbaikan Proses: [Isi rekomendasi konkret terkait evaluasi proses bisnis, operasional, atau pemesanan]\n\n"
        f"Keterangan:\n"
        f"1. Gunakan bahasa Indonesia yang singkat, jelas, dan mudah dipahami oleh UMKM.\n"
        f"2. Pada bagian REKOMENDASI AKSI, wajib ada 3 rekomendasi dengan diawali tanda hubung (-) dan nama kategorinya secara persis seperti contoh di atas (Optimalisasi Stok & Ketersediaan:, Promosi & Program Loyalitas:, Evaluasi & Perbaikan Proses:)."
    )
    try:
        result = await generate_from_openrouter(prompt)
        if getattr(result, "error", False):
            return f"OpenRouter error: {result.message}"
        return result.data.get("response", "") if result.data else ""
    except Exception as e:
        return f"OpenRouter error: {str(e)}"