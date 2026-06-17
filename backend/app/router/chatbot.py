from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.main import get_db
from app.schemas.base import StandardResponse
from app.schemas.chatbot import ChatbotFrontendRequest, ChatbotFrontendResponse
from app.controller.chatbot import handle_chatbot_request, get_chatbot_history
from app.shared.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/chatbot")

@router.post(
    "/{target_task}",
    response_model=StandardResponse[ChatbotFrontendResponse]
)
async def chatbot_endpoint(
    target_task: str,
    request: ChatbotFrontendRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint untuk chatbot dashboard (forecasting/clustering).
    """
    return await handle_chatbot_request(target_task, request, current_user.id, db)


@router.get(
    "/history/{analysis_id}",
    response_model=StandardResponse[list]
)
async def chatbot_history_endpoint(
    analysis_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint untuk mengambil histori chat berdasarkan analysis_id.
    """
    return await get_chatbot_history(analysis_id, current_user.id, db)


