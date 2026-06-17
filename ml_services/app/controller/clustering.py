import httpx
import logging
from app.core.utils import get_dataset
from app.core.config import get_settings
from app.pipeline.model_clustering import ClusteringPipeline
from app.schemas.clustering import ClusteringRequest, ClusteringResponse, ClusteringErrorResponse

logger = logging.getLogger("uvicorn.error")
pipeline = ClusteringPipeline()

async def run_clustering(request: ClusteringRequest):
    """Controller utama untuk menjalankan clustering — dipanggil sebagai background task."""
    callback_url = request.callback_url
    try:
        logger.info(f"Step 1: Start clustering for analysis_id {request.analysis_id}, dataset_id {request.dataset_id}")
        # 1. Load dataset
        df, _ = await get_dataset(request.dataset_id)
        logger.info(f"Step 1 completed: Dataset loaded with shape {df.shape}")

        # Convert DataFrame to list of dicts
        data_dicts = df.to_dict(orient="records")

        # Convert request schema 
        # Filter col_fitur and col_product to only columns that exist in the loaded dataset to prevent KeyError
        existing_features = [col for col in request.col_fitur if col in df.columns]
        col_product = request.col_product
        if col_product not in df.columns:
            # Coba fallback ke kolom non-numerik yang mengandung kata 'name'/'nama'/'product'/'produk'
            non_numeric = df.select_dtypes(exclude='number').columns.tolist()
            name_keywords = ['product name', 'product_name', 'nama produk', 'nama_produk',
                             'item name', 'item_name', 'product', 'produk', 'name', 'nama', 'item']
            fallback_col = None
            for kw in name_keywords:
                for col in non_numeric:
                    if kw in col.lower():
                        fallback_col = col
                        break
                if fallback_col:
                    break
            col_product = fallback_col or (non_numeric[0] if non_numeric else df.columns[0])
            logger.warning(f"col_product '{request.col_product}' not found in dataset. Falling back to '{col_product}'")

        input_json = {
            "col_product": col_product,
            "col_fitur": existing_features,
            "data": data_dicts,
            "n_clusters": request.n_clusters
        }
        # Jalankan pipeline
        logger.info("Step 2: Running clustering pipeline")
        result = await pipeline.run(input_json)
        logger.info("Step 2 completed: Clustering pipeline success")

        # Send success callback
        logger.info("Step 3: Sending success callback")
        response_payload = ClusteringResponse(
            analysis_id=request.analysis_id,
            status="completed",
            result=result
        )
        settings = get_settings()
        headers = {"X-API-Key": settings.ML_API_KEY}
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    callback_url,
                    json=response_payload.model_dump(),
                    headers=headers,
                    timeout=15.0,
                )
                logger.info(f"Success callback sent, response status: {resp.status_code}")
        except Exception as callback_err:
            logger.error(f"Failed to send success callback to {callback_url}: {callback_err}")

    except Exception as e:
        logger.error(f"Error during clustering: {e}", exc_info=True)
        error_payload = ClusteringErrorResponse(
            analysis_id=request.analysis_id,
            status="failed",
            error=str(e)
        )
        try:
            logger.info("Attempting to send error callback")
            settings = get_settings()
            headers = {"X-API-Key": settings.ML_API_KEY}
            async with httpx.AsyncClient() as client:
                resp = await client.patch(
                    callback_url,
                    json=error_payload.model_dump(),
                    headers=headers,
                    timeout=15.0,
                )
                logger.info(f"Error callback sent, response status: {resp.status_code}")
        except Exception as callback_err:
            logger.error(f"Failed to send error callback to {callback_url}: {callback_err}")