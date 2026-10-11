from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.ai_copilot import generate_ai_chat_response

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

class ChatRequest(BaseModel):
    message: str
    province_id: int = 1

@router.post("/chat")
def chat_with_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    reply = generate_ai_chat_response(req.message, req.province_id, db)
    return {"reply": reply}

@router.get("/weather")
def get_weather(province_id: int = 1):
    # Mock du bao thoi tiet thong minh theo tinh thanh
    weather_data = {
        1: {"temp": "31°C", "condition": "Nắng ráo, biển êm", "icon": "☀️", "tip": "Thích hợp tắm biển và ngắm hoàng hôn"},
        2: {"temp": "19°C", "condition": "Se lạnh, có sương mù nhẹ", "icon": "⛅", "tip": "Nên mang áo ấm khi ra đường buổi tối"}
    }
    return weather_data.get(province_id, {"temp": "28°C", "condition": "Nắng nhẹ", "icon": "🌤️", "tip": "Thời tiết đẹp"})
