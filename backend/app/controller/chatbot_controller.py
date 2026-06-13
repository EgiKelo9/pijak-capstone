import httpx
from fastapi import HTTPException
from app.core.config import get_settings
from app.schemas.chatbot_schema import ChatbotFrontendRequest, ChatbotFrontendResponse
from app.schemas.base import StandardResponse

settings = get_settings()

async def handle_chatbot_request(target_task: str, request: ChatbotFrontendRequest) -> StandardResponse[ChatbotFrontendResponse]:
    if target_task not in ["forecasting", "clustering"]:
        raise HTTPException(status_code=400, detail="Target task must be 'forecasting' or 'clustering'")

    try:
        async with httpx.AsyncClient() as client:
            # Call ml_services chatbot endpoint
            response = await client.post(
                url=f"{settings.ML_SERVICE_URL}/ml/v1/openrouter/chatbot",
                json={
                    "task_id": request.task_id,
                    "target": target_task,
                    "message": request.message,
                    "attachment": request.attachment
                },
                timeout=45.0  # OpenRouter might take a moment to respond
            )
            
            if response.status_code != 200:
                detail = "Gagal menghubungi ML service"
                try:
                    detail = response.json().get("message", detail)
                except Exception:
                    pass
                raise HTTPException(status_code=502, detail=detail)

            res_json = response.json()
            return StandardResponse(
                code=200,
                error=False,
                message="Berhasil memproses pertanyaan chatbot",
                data=ChatbotFrontendResponse(
                    message=res_json.get("message", ""),
                    metadata=res_json.get("metadata")
                )
            )
    except httpx.HTTPError as he:
        raise HTTPException(status_code=502, detail=f"HTTP Error dari ML Service: {str(he)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
