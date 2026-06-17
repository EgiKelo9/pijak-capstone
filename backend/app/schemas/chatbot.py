from typing import Any, Dict, Optional
from pydantic import BaseModel
from app.schemas.base import StandardResponse

class ChatbotFrontendRequest(BaseModel):
    message: str
    task_id: str
    attachment: Optional[Any] = None

class ChatbotFrontendResponse(BaseModel):
    message: str
    metadata: Optional[Dict[str, Any]] = None

# StandardResponse wrapper
ChatbotSuccessResponse = StandardResponse[ChatbotFrontendResponse]
