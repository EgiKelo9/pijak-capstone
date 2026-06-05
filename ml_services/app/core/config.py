import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Production settings class"""
    ENVIRONMENT = os.getenv("ENV", "production")
    PORT = int(os.getenv("PORT", 8000))
    FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
    CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    APP_BASE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")
    # Backend service configuration
    BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://backend:5000")
    BACKEND_USER_EMAIL = os.getenv("BACKEND_USER_EMAIL", "user@example.com")
    BACKEND_USER_PASSWORD = os.getenv("BACKEND_USER_PASSWORD", "string")
    
class DevSettings(Settings):
    """Development settings class"""
    ENVIRONMENT = os.getenv("ENV", "development")
    PORT = int(os.getenv("PORT", 8000))
    FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
    CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    APP_BASE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")
    # Backend service configuration
    BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://backend:5000")
    BACKEND_USER_EMAIL = os.getenv("BACKEND_USER_EMAIL", "user@example.com")
    BACKEND_USER_PASSWORD = os.getenv("BACKEND_USER_PASSWORD", "string")

class TestSettings(Settings):
    """Test settings class"""
    ENVIRONMENT = os.getenv("ENV", "test")
    PORT = int(os.getenv("PORT", 8000))
    FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
    CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
    LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    APP_BASE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")
    # Backend service configuration
    BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://backend:5000")
    BACKEND_USER_EMAIL = os.getenv("BACKEND_USER_EMAIL", "user@example.com")
    BACKEND_USER_PASSWORD = os.getenv("BACKEND_USER_PASSWORD", "string")

@lru_cache
def get_settings():
    """Return settings based on ENV variable"""
    env = os.getenv("ENV", "dev")
    if env == "test":
        return TestSettings()
    if env == "dev":
        return DevSettings()
    return Settings()  # Default to production settings