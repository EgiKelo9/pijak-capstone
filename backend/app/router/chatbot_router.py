from fastapi import APIRouter, Depends
from app.schemas.base import StandardResponse
from app.schemas.chatbot_schema import ChatbotFrontendRequest, ChatbotFrontendResponse
from app.controller.chatbot_controller import handle_chatbot_request
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
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint untuk chatbot dashboard (forecasting/clustering).
    """
    return await handle_chatbot_request(target_task, request)
