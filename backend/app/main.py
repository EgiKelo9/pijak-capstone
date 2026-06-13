import os
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.schemas.base import StandardResponse
from app.database.main import Base, engine, create_db
from app.middleware import cors, static
from app.router import auth, health, dataset, clustering_router, forecasting_router, chatbot_router

app = FastAPI(
    title="Beez - Pijak Capstone API",
    description="API Capstone Project untuk Beez - AI Business Intelligence",
    version="1.0.0"
)

if not os.getenv("ENV"):
    os.environ["ENV"] = "dev"

cors.add(app)
static.add(app)
create_db()
Base.metadata.create_all(bind=engine)

app.include_router(health.router, prefix="/api/v1", tags=["System Check"])
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(dataset.router, prefix="/api/v1", tags=["Dataset Management"])
app.include_router(clustering_router.router, prefix="/api/v1", tags=["Clustering"])
app.include_router(forecasting_router.router, prefix="/api/v1", tags=["Forecasting"])
app.include_router(chatbot_router.router, prefix="/api/v1", tags=["Chatbot"])

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

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    import logging
    logger = logging.getLogger("uvicorn.error")
    logger.error(f"❌ Validation Error on {request.url.path}: {exc.errors()}")
    try:
        body = await request.json()
        logger.error(f"❌ Invalid Request Body: {body}")
    except Exception:
        pass
    return JSONResponse(
        status_code=422,
        content=StandardResponse(
            code=422,
            error=True,
            message="Validation Error: " + str(exc.errors()),
            data=exc.errors()
        ).model_dump()
    )

@app.get("/")
def root():
    return {"message": "Welcome to Beez - Pijak Capstone API. Akses /docs untuk melihat dokumentasi interaktif."}
