import json
import httpx
import logging
import pandas as pd
from io import BytesIO
from app.schemas.base import StandardResponse
from app.schemas.features import Feature
from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")


async def call_backend_api(
    method: str,
    path: str,
    json: dict | None = None,
    files: dict | None = None,
    data: dict | None = None,
    timeout: float = 30.0,
) -> httpx.Response:
    """
    Centralized HTTP caller untuk pemanggilan endpoint ke backend internal.

    Fungsi ini menggunakan API Key (header `X-API-Key`) untuk autentikasi,
    menggantikan mekanisme login email/password sebelumnya.

    Args:
        method:  HTTP method — "GET", "POST", "DELETE", atau "PATCH".
        path:    Path endpoint tanpa base URL, contoh: "/api/v1/datasets/1".
        json:    Payload JSON untuk request body (opsional).
        files:   File dict untuk multipart/form-data upload (opsional).
        data:    Form data dict untuk multipart/form-data upload (opsional).
        timeout: Timeout request dalam detik (default 30 detik).

    Returns:
        httpx.Response dari endpoint backend.

    Raises:
        httpx.HTTPStatusError: Jika response backend mengembalikan status error.
        ValueError: Jika method HTTP tidak didukung.

    Example:
        # Fetch dataset sebagai CSV
        response = await call_backend_api("GET", f"/api/v1/datasets/{dataset_id}")
        csv_bytes = response.content

        # Upload file ke backend
        response = await call_backend_api(
            "POST",
            "/api/v1/datasets/upload",
            files={"file": ("data.csv", csv_buffer, "text/csv")},
            data={"is_cleaned": "true"},
        )

        # Soft-delete record via query params
        response = await call_backend_api(
            "DELETE",
            "/api/v1/datasets/cleaned?ori_data_id=1&model=Forecasting",
        )
    """
    settings = get_settings()
    url = f"{settings.BACKEND_BASE_URL}{path}"
    headers = {"X-API-Key": settings.ML_API_KEY}

    async with httpx.AsyncClient() as client:
        logger.info("Calling backend API: %s %s", method.upper(), url)

        if method.upper() == "GET":
            response = await client.get(url, headers=headers, timeout=timeout)
        elif method.upper() == "POST":
            response = await client.post(
                url,
                headers=headers,
                json=json,
                files=files,
                data=data,
                timeout=timeout,
            )
        elif method.upper() == "DELETE":
            response = await client.delete(url, headers=headers, timeout=timeout)
        elif method.upper() == "PATCH":
            response = await client.patch(
                url,
                headers=headers,
                json=json,
                timeout=timeout,
            )
        else:
            raise ValueError(f"Unsupported HTTP method: {method!r}. Gunakan 'GET', 'POST', 'DELETE', atau 'PATCH'.")

        logger.info(
            "Backend API response: %s %s → status_code=%s",
            method.upper(), url, response.status_code,
        )
        response.raise_for_status()
        return response

async def update_dataset_feature_metadata(dataset_id:int, feature: Feature):
    """Update feature metadata, digunakan setelah analyze column untuk menyimpan hasil analisis kolom oleh LLM"""
    feature_dump = feature.model_dump()
    response = await call_backend_api(
        "PATCH",
        f"/api/v1/datasets/feature-metadata-update/{dataset_id}",
        json=feature.model_dump()
    )

    if response.status_code != 200:
        raise Exception(
            f"Failed to fetch dataset: "
            f"{response.status_code} - {response.text}"
        )
    
    return response.json()

async def get_dataset_feature_metadata(dataset_id: int) -> dict | None:
    """
    Mengambil feature metadata yang sudah ada di database.
    """
    try:
        response = await call_backend_api("GET", f"/api/v1/datasets/feature-metadata/{dataset_id}")
        if response.status_code == 200:
            data = response.json()
            return data.get("data")
    except Exception as e:
        logger.warning(f"Could not fetch feature metadata for dataset {dataset_id}: {e}")
    return None

async def get_dataset(dataset_id: int) -> tuple[pd.DataFrame, str]:
    """
    Fetch dataset dari backend API dan kembalikan sebagai pandas DataFrame
    beserta nama file aslinya.

    Nama file diekstrak dari header Content-Disposition pada response backend
    (format: `attachment; filename=<nama_file>`).

    Args:
        dataset_id: ID dataset yang akan diambil dari backend.

    Returns:
        Tuple (df, dataset_name):
            - df: pd.DataFrame hasil parsing dari file CSV.
            - dataset_name: Nama file asli dataset (contoh: "penjualan.csv").

    Raises:
        Exception: Jika backend mengembalikan status error.
    """
    response = await call_backend_api("GET", f"/api/v1/datasets/{dataset_id}")

    if response.status_code != 200:
        raise Exception(
            f"Failed to fetch dataset: "
            f"{response.status_code} - {response.text}"
        )

    # Ekstrak nama file dari header Content-Disposition
    content_disposition = response.headers.get("Content-Disposition", "")
    dataset_name = "dataset.csv"  # fallback default
    if "filename=" in content_disposition:
        dataset_name = content_disposition.split("filename=")[-1].strip().strip('"')

    csv_bytes = response.content
    df = pd.read_csv(BytesIO(csv_bytes))
    return df, dataset_name

async def upload_cleaned_dataset(
    df: pd.DataFrame,
    original_dataset_id: int,
    model: str,
    feature_metadata: dict
) -> dict:
    """
    Soft-delete record cleaned lama lalu serialisasi DataFrame ke CSV dan upload ke backend.

    Urutan operasi:
    1. Panggil DELETE /api/v1/datasets/cleaned untuk men-soft-delete semua record
       cleaned aktif yang mengacu ke original_dataset_id dan model yang sama.
       Ini mencegah duplikasi record aktif di tabel datasets_bin.
    2. Serialisasi DataFrame ke CSV dengan nama file berformat:
       cleaned_{dataset_name}_{model}_{original_dataset_id}.csv
    3. Upload file ke backend via POST /api/v1/datasets/upload.

    Args:
        df:                  DataFrame hasil preprocessing yang akan diupload.
        original_dataset_id: ID dataset original sebagai referensi relasi.
        model:               Nama model target, misalnya 'Forecasting' atau 'Clustering'.

    Returns:
        dict: Response JSON dari backend setelah upload berhasil.

    Raises:
        Exception: Jika soft-delete atau upload ke backend mengembalikan status error.
    """
    # 1. Soft-delete record cleaned lama untuk ori_data_id + model yang sama
    invalidate_response = await call_backend_api(
        "DELETE",
        f"/api/v1/datasets/cleaned?ori_data_id={original_dataset_id}&model={model}",
    )
    if invalidate_response.status_code != 200:
        raise Exception(
            f"Failed to invalidate old cleaned datasets: "
            f"{invalidate_response.status_code} - {invalidate_response.text}"
        )

    # 2. Serialisasi DataFrame ke CSV
    file_name = f"cleaned_dataset_{model}_{original_dataset_id}.csv"

    csv_buffer = BytesIO()
    df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # 3. Upload hasil preprocessing ke backend
    files = {
        'file': (file_name, csv_buffer, "text/csv")
    }
    data = {
        'is_cleaned': 'true',
        'ori_data_id': str(original_dataset_id),
        'model': model,
        'feature_metadata': json.dumps(feature_metadata)
    }

    response = await call_backend_api(
        "POST",
        "/api/v1/datasets/upload",
        files=files,
        data=data,
    )

    if response.status_code != 200:
        raise Exception(f"Failed to upload cleaned dataset: {response.status_code} - {response.text}")

    return response.json()


def get_dataset_info(df: pd.DataFrame) -> dict:
    """
    Ekstrak ringkasan metadata dari sebuah DataFrame.

    Digunakan oleh berbagai controller (misalnya openrouter) untuk
    membangun konteks dataset sebelum dikirim ke LLM.

    Args:
        df: DataFrame yang akan diringkas.

    Returns:
        dict berisi shape, dtypes, sample baris pertama, dan jumlah missing values per kolom.
    """
    return {
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "head": df.head().to_dict(orient="records"),
        "missing_values": df.isnull().sum().to_dict(),
        "unique_values": df.nunique().to_dict()
    }


async def generate_from_openrouter(prompt: str, schema = None) -> StandardResponse[dict]:
    """Generate response melalui OpenRouter."""
    settings = get_settings()
    
    try:
        headers = {
            "Authorization": f"Bearer {settings.OPEN_ROUTER_API_KEY}",
            "HTTP-Referer": settings.APP_BASE_URL,
            "Content-Type": "application/json"
        }
        
        if not schema:
            payload = {
                "model": settings.LLM_MODEL,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "stream": False,
                "temperature": 0.0,
            }
        else:
            # Gunakan json_object sebagai response_format karena model free
            # tidak mendukung json_schema structured output.
            # Schema diinstruksikan via prompt agar model tetap output JSON valid.
            json_schema_str = json.dumps(Feature.model_json_schema(), indent=2)
            structured_prompt = (
                f"{prompt}\n\n"
                f"IMPORTANT: You MUST respond with ONLY a valid JSON object (no markdown, no explanation, no code fences).\n"
                f"The JSON must conform to this schema:\n{json_schema_str}"
            )
            payload = {
                "model": settings.LLM_MODEL,
                "messages": [
                    {"role": "user", "content": structured_prompt}
                ],
                "response_format": {
                    "type": "json_object",
                },
                "stream": False,
                "temperature": 0.0,
                "max_tokens": 8000,
            }
            
        logger.info("Sending request to OpenRouter with prompt: %s", prompt)
        print(payload, flush=True)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=settings.OPEN_ROUTER_BASE_URL,
                headers=headers,
                json=payload,
                timeout=180.0  # Diperpanjang menjadi 180 detik untuk model reasoning
            )

            print(f"Received response from OpenRouter: status_code={response.status_code}, response_text={response.text}", flush=True)
            
            logger.info("Received response from OpenRouter: status_code=%s, response_text=%s", response.status_code, response.text)
            response.raise_for_status()
            data = response.json()
            
            choices = data.get("choices")
            reply = ""
            if choices and len(choices) > 0:
                message = choices[0].get("message")
                if message:
                    content = message.get("content")
                    if content:
                        reply = str(content).strip()
            
            if not reply:
                logger.warning("OpenRouter returned empty content. Full response: %s", data)
                return StandardResponse(
                    code=500,
                    error=True,
                    message="OpenRouter returned empty content — model may have exhausted tokens on reasoning.",
                    data={"response": ""}
                )
            
            return StandardResponse(
                code=200,
                error=False,
                message="OpenRouter response generated successfully",
                data={"response": reply}
            )
            
    except Exception as e:
        logger.error("Error generating response from OpenRouter: %s", str(e))
        print(f"OpenRouter exception occurred: {str(e)}", flush=True)
        return StandardResponse(
            code=500,
            error=True,
            message=f"Failed to generate response from OpenRouter: {str(e)}",
            data={"response": "error"}
        )