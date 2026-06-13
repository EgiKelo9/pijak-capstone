import traceback
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
        # Convert request schema 
        input_json = {
            "col_product": request.col_product,
            "col_fitur": request.col_fitur,
            "data": request.data,
            "n_clusters": request.n_clusters
        }
        # Jalankan pipeline
        result = await pipeline.run(input_json)
        # Return response sukses
        return ClusteringResponse(
            analysis_id=request.analysis_id,
            status="completed",
            result=result
        )
    except Exception as e:
        print(f"[CLUSTERING ERROR] {str(e)}")
        traceback.print_exc()
        return ClusteringErrorResponse(
            analysis_id=request.analysis_id,
            status="failed",
            error=str(e)
        )