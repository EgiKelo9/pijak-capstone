# from typing import Any, Dict
# from sqlalchemy.orm import Session
# from fastapi import Depends, APIRouter
# from app.database.main import get_db
# from app.schemas.base import StandardResponse
# from app.schemas.clustering_schema import ClusteringRunRequest
# from app.controller.clustering_controller import run_clustering
# from app.shared.dependencies import get_current_user
# from app.models.user import User

# router = APIRouter(prefix="/clustering")

# @router.post(
#     "/run",
#     response_model=StandardResponse[dict],
#     responses={
#         400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request"},
#         401: {"model": StandardResponse[dict], "description": "Unauthorized"},
#         404: {"model": StandardResponse[dict], "description": "Dataset atau Model tidak ditemukan"},
#         502: {"model": StandardResponse[dict], "description": "ML Service Error"}
#     }
# )
# async def run_clustering_endpoint(
#     request: ClusteringRunRequest,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):
#     """
#     Menjalankan clustering produk berdasarkan dataset yang diberikan.

#     Args:
#         request (ClusteringRunRequest): Request body berisi dataset_id, col_product, col_fitur, dan data.
#         db (Session): Database session.
#         current_user (User): User yang sedang login.

#     Returns:
#         StandardResponse[dict]: Hasil clustering berisi cluster_amount, silhouette_score, wcss_score, cluster_data, dan insight_summary.

#     Raises:
#         HTTPException: 404 jika dataset tidak ditemukan.
#         HTTPException: 502 jika ML service tidak bisa dihubungi.
#     """
#     return await run_clustering(request, current_user.id, db)
from typing import Any, Dict
from sqlalchemy.orm import Session
from fastapi import Depends, APIRouter
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.clustering_schema import ClusteringRunRequest
from app.controller.clustering_controller import run_clustering, get_clustering_result, get_clustering_history
from app.shared.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/clustering")

@router.post(
    "/run",
    response_model=StandardResponse[dict],
    responses={
        400: {"model": StandardResponse[Dict[str, Any]], "description": "Bad Request"},
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        404: {"model": StandardResponse[dict], "description": "Dataset atau Model tidak ditemukan"},
        502: {"model": StandardResponse[dict], "description": "ML Service Error"}
    }
)
async def run_clustering_endpoint(
    request: ClusteringRunRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Menjalankan clustering produk."""
    return await run_clustering(request, current_user.id, db)


@router.get(
    "/result/{analysis_id}",
    response_model=StandardResponse[dict],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"},
        404: {"model": StandardResponse[dict], "description": "Hasil tidak ditemukan"}
    }
)
async def get_result_endpoint(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil hasil clustering berdasarkan analysis_id."""
    return await get_clustering_result(analysis_id, current_user.id, db)


@router.get(
    "/history",
    response_model=StandardResponse[list],
    responses={
        401: {"model": StandardResponse[dict], "description": "Unauthorized"}
    }
)
async def get_history_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Ambil semua riwayat clustering milik user."""
    return await get_clustering_history(current_user.id, db)