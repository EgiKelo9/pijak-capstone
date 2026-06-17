import json
from app.schemas.openrouter import ChatbotRequest, ChatbotResponse
from app.core.utils import generate_from_openrouter

async def generate_chatbot_response(request: ChatbotRequest) -> ChatbotResponse:
    """Generate a chatbot response based on user message, target task and optional attachment."""
    target = request.target.lower()
    message = request.message
    attachment_str = ""
    if request.attachment is not None:
        if isinstance(request.attachment, str):
            attachment_str = request.attachment
        else:
            try:
                attachment_str = json.dumps(request.attachment, default=str, indent=2)
            except Exception:
                attachment_str = str(request.attachment)

    prompt = f"""
    Kamu adalah BeeZ, asisten AI Business Intelligence yang cerdas untuk wirausaha retail/UMKM.
    Fokus task saat ini: "{target}" (forecasting/clustering).

    Pertanyaan/Instruksi User:
    "{message}"

    Data Lampiran (jika ada):
    {attachment_str if attachment_str else "(Tidak ada data tambahan)"}

    Berikan jawaban yang ramah, solutif, mudah dipahami oleh pelaku UMKM, dan langsung menjawab pertanyaan user. 
    Jika ada data lampiran, gunakan data tersebut untuk memperkuat analisis atau menjawab pertanyaannya. 
    Format jawaban menggunakan markdown yang rapi. Jangan gunakan kata-kata teknis yang terlalu rumit.
    """

    try:
        response = await generate_from_openrouter(prompt)
        if getattr(response, "error", False):
            msg = f"Gagal mendapatkan respon dari AI: {response.message}"
        else:
            msg = response.data.get("response", "") if response.data else "Maaf, saya tidak bisa memproses permintaan Anda saat ini."
    except Exception as e:
        msg = f"Error generating response: {str(e)}"

    return ChatbotResponse(message=msg, metadata=None)
