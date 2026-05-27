import os
from google import genai
from fastapi import APIRouter
from app.schemas.gemini import GeminiHealthResponse, GeminiInsightRequest, GeminiInsightResponse
from app.schemas.features import Feature, FeatureEngineering, DateTime
import pandas as pd
import requests
from io import BytesIO

# Environment variables untuk Gemini API
router = APIRouter()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

_gemini_client = None
if GEMINI_API_KEY:
    _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    gemini_model = "gemini-2.5-flash-lite"

# ==================================================
# Helper function untuk memanggil Gemini dengan aman
# ==================================================

# def get_preprocess_from_gemini(forecast_data: dict) -> str:
#     """Helper function to call Gemini logic safely."""
#     if not _gemini_client:
#         return "Gemini API is not configured. Insight generated offline."
    
#     try:
#         prompt = (
#             f"Kamu adalah Business Analyst anon-teknis untuk wirausaha retail. "
#             f"Berdasarkan prediksi permintaan produk berikut:\n"
#             f"{json.dumps(forecast_data, default=str)}\n\n"
#             f"Berikan rekomendasi aksi bisnis yang konkret, singkat, dan mudah dipahami. "
#             f"Fokus pada stok, barang tak laku, dan peluang promo."
#         )
#         response = _gemini_client.generate_content(prompt)
#         return response.text
#     except Exception as e:
#         return f"Gemini error: {str(e)}"

async def get_dataset_info(dataset_id):
    """
    Fetch dataset from backend API,
    load into pandas DataFrame,
    and return summarized dataset information.
    """

    auth_url = f"http://backend:5000/api/v1/auth/login"
    auth_response = requests.post(auth_url, json={'email': 'user@example.com', 'password': 'string'})
    print(auth_response.json())
    access_token = auth_response.json()["data"]["access_token"]
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    fetch_dataset_url = f"http://backend:5000/api/v1/datasets/{dataset_id}"
    fetch_dataset_response = requests.get(
        fetch_dataset_url,
        headers=headers
    )

    if fetch_dataset_response.status_code != 200:
        raise Exception(
            f"Failed to fetch dataset: "
            f"{fetch_dataset_response.status_code} - {fetch_dataset_response.text}"
        )

    csv_bytes = fetch_dataset_response.content

    df = pd.read_csv(
        BytesIO(csv_bytes)
    )

    dataset_summary = {
        "shape": df.shape,
        "dtypes": df.dtypes.astype(str).to_dict(),
        "head": df.head().to_dict(orient="records"),
        "missing_values": df.isnull().sum().to_dict()
    }

    return dataset_summary

async def get_preprocess_from_gemini(dataset_id: int, model_type:str) -> Feature | str:
    """Helper function to call Gemini logic safely."""
    if not _gemini_client:
        return "Gemini API is not configured. Insight generated offline."
    
    dataset_info = await get_dataset_info(dataset_id)
    print(dataset_info)
    try:
        prompt = f"""
            Please extract features(columns) from the following dataset.
            The user wants to do {model_type}.
            Dataset:
            {dataset_info}
        """
        response = _gemini_client.models.generate_content(
            model=gemini_model,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": Feature,
                "temperature": 0,
            }
        )
        if response is not None:
            return response.parsed
        else:
            return "response is none broski"
    except Exception as e:
        return f"Gemini error: {str(e)}"