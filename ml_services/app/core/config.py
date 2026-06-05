# import os
# from functools import lru_cache
# from dotenv import load_dotenv

# load_dotenv()

# class Settings:
#     """Production settings class"""
#     ENVIRONMENT = os.getenv("ENV", "production")
#     PORT = int(os.getenv("PORT", 8000))
#     FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
#     CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
#     OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434/api/generate")
#     LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")
    
# class DevSettings(Settings):
#     """Development settings class"""
#     ENVIRONMENT = os.getenv("ENV", "development")
#     PORT = int(os.getenv("PORT", 8000))
#     FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
#     CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
#     OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434/api/generate")
#     LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")

# class TestSettings(Settings):
#     """Test settings class"""
#     ENVIRONMENT = os.getenv("ENV", "test")
#     PORT = int(os.getenv("PORT", 8000))
#     FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
#     CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
#     OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434/api/generate")
#     LLM_MODEL = os.getenv("LLM_MODEL", "gemma:2b")

# @lru_cache
# def get_settings():
#     """Return settings based on ENV variable"""
#     env = os.getenv("ENV", "dev")
#     if env == "test":
#         return TestSettings()
#     if env == "dev":
#         return DevSettings()
#     return Settings()  # Default to production settings


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
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "openrouter/auto")
    APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

class DevSettings(Settings):
    """Development settings class"""
    ENVIRONMENT = os.getenv("ENV", "development")
    PORT = int(os.getenv("PORT", 8000))
    FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
    CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "openrouter/auto")
    APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

class TestSettings(Settings):
    """Test settings class"""
    ENVIRONMENT = os.getenv("ENV", "test")
    PORT = int(os.getenv("PORT", 8000))
    FORECASTING_MODEL_PATH = os.getenv("FORECASTING_MODEL_PATH", "artifacts/model_forecasting.h5")
    CLUSTERING_MODEL_PATH = os.getenv("CLUSTERING_MODEL_PATH", "artifacts/model_clustering.h5")
    OPEN_ROUTER_BASE_URL = os.getenv("OPEN_ROUTER_BASE_URL", "https://openrouter.ai/api/v1/chat/completions")
    OPEN_ROUTER_API_KEY = os.getenv("OPEN_ROUTER_API_KEY", "")
    LLM_MODEL = os.getenv("LLM_MODEL", "openrouter/auto")
    APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")

@lru_cache
def get_settings():
    """Return settings based on ENV variable"""
    env = os.getenv("ENV", "dev")
    if env == "test":
        return TestSettings()
    if env == "dev":
        return DevSettings()
    return Settings()