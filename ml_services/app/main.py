import os
from typing import Any, Dict
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api import gemini, model

app = FastAPI(
    title="Pijak Capstone ML Service",
    description="Machine Learning & Generative AI Service (Port 8000)",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(gemini.router, tags=["Gemini Endpoints"])
app.include_router(model.router, tags=["Model Endpoints"])

@app.get("/")
def root():
    return {"message": "Welcome to Pijak Capstone ML Service. Akses /docs untuk melihat dokumentasi interaktif."}
