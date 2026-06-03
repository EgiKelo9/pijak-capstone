import os
from google import genai
from fastapi import APIRouter
from app.schemas.gemini import GeminiHealthResponse, GeminiInsightRequest, GeminiInsightResponse
from app.schemas.features import Feature, FeatureEngineering, DateTime

# Environment variables untuk Gemini API
router = APIRouter()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL   = os.getenv("GEMINI_MODEL", "gemini-2.5-flash-lite")

_gemini_client = None
if GEMINI_API_KEY:
    _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
    gemini_model = "gemini-2.5-flash-lite"

async def get_preprocess_from_gemini(model_type: str, dataset_summary: dict) -> Feature | str:
    """Helper function to call Gemini logic safely."""
    if not _gemini_client:
        return "Gemini API is not configured. Insight generated offline."
    
    print(dataset_summary)
    try:
        prompt = f"""
            Please extract features(columns) from the following dataset.
            The user wants to do {model_type} option from the available service of Clustering and Forecasting.
            Dataset:
            {dataset_summary}
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