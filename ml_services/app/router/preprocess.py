import logging
from typing import Any, Dict
from fastapi import APIRouter, BackgroundTasks
from app.schemas.base import StandardResponse
from app.pipeline.preprocess import temp_pipeline
from app.schemas.openrouter import PreprocessRequest, PreprocessResponse
from app.schemas.features import Feature
from app.core.utils import get_dataset_feature_metadata, call_backend_api

router = APIRouter(prefix="/preprocess")
logger = logging.getLogger("uvicorn.error")

async def run_temp_pipeline_bg(dataset_id: int, model: str):
    try:
        mapping, cleaned_dataset_id = await temp_pipeline(dataset_id, model)
        if not mapping or not cleaned_dataset_id:
            raise Exception("Pipeline gagal dijalankan, pastikan layanan LLM tersedia.")
            
        metadata = await get_dataset_feature_metadata(dataset_id) or {}
        if mapping:
            # If temp_pipeline returned a Feature object, dump it
            if isinstance(mapping, Feature):
                metadata.update(mapping.model_dump())
            elif isinstance(mapping, dict):
                metadata.update(mapping)
        
        metadata["preprocess_status"] = "success"
        if cleaned_dataset_id:
            metadata["cleaned_dataset_id"] = cleaned_dataset_id
            
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{dataset_id}",
            json=metadata
        )
    except Exception as e:
        logger.error(f"Error in background preprocessing: {e}")
        metadata = await get_dataset_feature_metadata(dataset_id) or {}
        metadata["preprocess_status"] = "error"
        metadata["error_detail"] = str(e)
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{dataset_id}",
            json=metadata
        )

@router.post(
    "/run", 
    response_model=PreprocessResponse | Any,
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request - Invalid Input"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def generate_preprocess(request: PreprocessRequest, background_tasks: BackgroundTasks):
    """
    Endpoint untuk menjalankan seluruh pipeline preprocessing dalam background.
    """
    existing_metadata = await get_dataset_feature_metadata(request.dataset_id) or {}
    existing_metadata["preprocess_status"] = "processing"
    
    try:
        await call_backend_api(
            "PATCH",
            f"/api/v1/datasets/feature-metadata-update/{request.dataset_id}",
            json=existing_metadata
        )
    except Exception as e:
        logger.error(f"Failed to set processing status: {e}")

    background_tasks.add_task(run_temp_pipeline_bg, request.dataset_id, request.model_type)
    
    # Return immediately, the frontend will poll getDatasetFeatureMetadata
    return PreprocessResponse(
        insight=Feature(**existing_metadata) if existing_metadata and "cols_to_drop" in existing_metadata else Feature(cols_to_drop=None, col_target=None),
        dataset_id=request.dataset_id
    )