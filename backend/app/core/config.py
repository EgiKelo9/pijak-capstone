import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Production settings class"""
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "example_prod")
    SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key_here")
    ALGORITHM = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 1440))
    ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

class DevSettings(Settings):
    """Development settings class"""
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "example_dev")
    ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

class TestSettings(Settings):
    """Test settings class"""
    DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db/")
    DATABASE_NAME = os.getenv("DATABASE_NAME", "example_test")
    ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://localhost:8000")

@lru_cache
def get_settings():
    """Return settings based on ENV variable"""
    env = os.getenv("ENV", "dev")
    if env == "test":
        return TestSettings()
    if env == "dev":
        return DevSettings()
    return Settings()
