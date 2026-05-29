import httpx
import logging
from app.schemas.base import StandardResponse
from app.core.config import get_settings

logger = logging.getLogger("uvicorn.error")


async def generate_from_openrouter(prompt: str) -> StandardResponse[dict]:
    """Generate response melalui OpenRouter."""
    settings = get_settings()
    
    try:
        headers = {
            "Authorization": f"Bearer {settings.OPEN_ROUTER_API_KEY}",
            "HTTP-Referer": settings.APP_BASE_URL,
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": settings.LLM_MODEL,
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "stream": False,
            "temperature": 0.0,
        }
        
        logger.info("Sending request to OpenRouter with prompt: %s", prompt)
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url=settings.OPEN_ROUTER_BASE_URL,
                headers=headers,
                json=payload,
                timeout=60.0
            )
            
            logger.info("Received response from OpenRouter: status_code=%s, response_text=%s", response.status_code, response.text)
            response.raise_for_status()
            data = response.json()
            
            reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
            
            return StandardResponse(
                code=200,
                error=False,
                message="OpenRouter response generated successfully",
                data={"response": reply}
            )
            
    except Exception as e:
        logger.error("Error generating response from OpenRouter: %s", str(e))
        return StandardResponse(
            code=500,
            error=True,
            message=f"Failed to generate response from OpenRouter: {str(e)}",
            data={"response": "error"}
        )
