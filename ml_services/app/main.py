import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.schemas.base import StandardResponse
from app.router import openrouter, model, health, gemini, preprocess
from app.middleware import cors

app = FastAPI(
    title="Beez - Pijak Capstone ML Service",
    description="API Capstone Project untuk Machine Learning & Generative AI Service (Port 8000)",
    version="1.0.0"
)

if not os.getenv("ENV"):
    os.environ["ENV"] = "dev"

cors.add(app)

app.include_router(health.router, prefix="/ml/v1", tags=["Health Endpoints"])
app.include_router(preprocess.router, prefix="/ml/v1", tags=["Preprocess Endpoints"])
app.include_router(openrouter.router, prefix="/ml/v1", tags=["OpenRouter Endpoints"])
app.include_router(gemini.router, prefix="/ml/v1", tags=["Gemini Endpoints"])
app.include_router(model.router, prefix="/ml/v1", tags=["Model Endpoints"])

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=StandardResponse(
            code=exc.status_code,
            error=True,
            message=exc.detail,
            data=None
        ).model_dump()
    )

@app.get("/")
def root():
    return {"message": "Welcome to Beez - Pijak Capstone ML Service."}