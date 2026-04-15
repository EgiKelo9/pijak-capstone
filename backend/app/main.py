import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import predict, health

# Environment variables untuk konfigurasi service
ML_SERVICE_URL  = os.getenv("ML_SERVICE_URL",  "http://ml_services:8000")
DATABASE_URL    = os.getenv("DATABASE_URL",    "")

# Inisiasi FastAPI app
app = FastAPI(
    title="Pijak Capstone API",
    description="API Capstone Project untuk AI Business Intelligence",
    version="1.0.0"
)

# Konfigurasi CORS untuk mengizinkan frontend React (port 3000) dan domain produksi
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://0.0.0.0:3000",
    "https://pijak-capstone.aryadanabaraja.my.id"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(predict.router, prefix="/api", tags=["Prediction"])
app.include_router(health.router, prefix="/api", tags=["System Check"])

@app.get("/")
def root():
    return {"message": "Welcome to Pijak Capstone API. Akses /docs untuk melihat dokumentasi interaktif."}
