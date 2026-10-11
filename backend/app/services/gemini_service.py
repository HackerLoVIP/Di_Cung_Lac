import os
import json
from typing import List, Dict, Any, Optional
from app.config import settings

def get_genai_client(api_key: Optional[str] = None):
    """Khoi tao Google GenAI Client voi key duoc truyen hoac tu moi truong"""
    key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"[ERROR] Khong the khoi tao Google GenAI: {e}")
        return None

def chat_with_gemini_ai(message: str, locations_context: str, api_key: Optional[str] = None) -> str:
    """Chatbot tro ly du lich tra loi bang Google Gemini LLM thuc te"""
    client = get_genai_client(api_key)
    
    # Prompt chi dan vai tro tro ly du lich
    system_instruction = (
        "Bạn là 'Đi Cùng Lạc AI' - Trợ lý du lịch thông minh, thân thiện, am hiểu sâu sắc về du lịch Việt Nam "
        "(đặc biệt là Vũng Tàu và Đà Lạt). "
        "Nhiệm vụ của bạn là tư vấn cho du khách dựa trên dữ liệu địa điểm thực tế của hệ thống. "
        "Hãy trả lời tự nhiên, nhiệt tình, có kèm mẹo thực tế (tránh bị chặt chém, giờ đẹp, món ngon nên thử). "
        "Nếu du khách hỏi về quán ăn hay điểm đến cụ thể, hãy ưu tiên các địa điểm có trong dữ liệu sau:\n"
        f"{locations_context}"
    )

    if client:
        try:
            # Thu goi model Gemini 2.0 Flash moi nhat
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=message,
                config={"system_instruction": system_instruction, "temperature": 0.7}
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[WARN] Gemini 2.0 Flash loi, thu Gemini 1.5 Flash: {e}")
            try:
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=message,
                    config={"system_instruction": system_instruction, "temperature": 0.7}
                )
                if response and response.text:
                    return response.text
            except Exception as e2:
                print(f"[ERROR] Gemini API loi: {e2}")

    # Fallback tra loi thong minh neu chua co Key
    return (
        f"🤖 [Chưa cấu hình GEMINI_API_KEY] Hệ thống đã sẵn sàng kết nối Gemini 2.0 / 1.5 Flash. "
        f"Về câu hỏi '{message}': Dựa trên dữ liệu thực tế tại hệ thống, bạn nên trải nghiệm các món đặc sản "
        f"như Bánh Khọt Gốc Vú Sữa (14 Nguyễn Trường Tộ), Hải sản Bé Mặn và cafe hoàng hôn tại Sailing Club Bãi Trước nhé!"
    )
