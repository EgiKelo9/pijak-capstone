from app.pipeline.model_clustering import ClusteringPipeline
from app.schemas.clustering_schema import (
    ClusteringRequest,
    ClusteringResponse,
    ClusteringErrorResponse
)

pipeline = ClusteringPipeline()

async def run_clustering(request: ClusteringRequest) -> ClusteringResponse | ClusteringErrorResponse:
    """Controller utama untuk menjalankan clustering"""
    try:
        # 1. Convert request schema  dict untuk pipeline
        input_json = {
            "col_product": request.col_product,
            "col_fitur": request.col_fitur,
            "data": request.data
        }

        # 2. Jalankan pipeline
        result = await pipeline.run(input_json)

        # 3. Return response sukses
        return ClusteringResponse(
            analysis_id=request.analysis_id,
            status="completed",
            result=result
        )

    except Exception as e:
        # 4. Return response error
        return ClusteringErrorResponse(
            analysis_id=request.analysis_id,
            status="failed",
            error=str(e)
        )