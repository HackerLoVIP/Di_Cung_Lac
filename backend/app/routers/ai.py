from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.location import Location
from app.models.province import Province
from app.services.gemini_service import chat_with_gemini_ai

router = APIRouter(prefix="/api/ai", tags=["AI Copilot"])

class ChatRequest(BaseModel):
    message: str
    province_id: int = 1
    api_key: Optional[str] = None

@router.post("/chat")
def chat_with_copilot(req: ChatRequest, db: Session = Depends(get_db)):
    # Trich xuat du lieu dia diem that de lam RAG Context cho Gemini AI
    locations = db.query(Location).filter(Location.province_id == req.province_id).all()
    context_lines = []
    for loc in locations:
        menu_str = ", ".join([f"{m.name} ({m.price_vnd:,}đ)" for m in loc.menu_items[:3]]) if loc.menu_items else ""
        context_lines.append(
            f"- {loc.name} ({loc.category}): Địa chỉ {loc.address}. Giá TB {loc.avg_cost_vnd:,}đ. Mẹo: {loc.tips}. Menu: {menu_str}"
        )
    locations_context = "\n".join(context_lines)

    reply = chat_with_gemini_ai(req.message, locations_context, req.api_key)
    return {"reply": reply}

@router.get("/weather")
def get_weather(province_id: int = 1):
    weather_data = {
        1: {"temp": "31°C", "condition": "Nắng ráo, biển êm", "icon": "☀️", "tip": "Thích hợp tắm biển và ngắm hoàng hôn Bãi Trước"},
        2: {"temp": "19°C", "condition": "Se lạnh, có sương mù nhẹ", "icon": "⛅", "tip": "Nên mang áo ấm khi ra đường buổi tối"}
    }
    return weather_data.get(province_id, {"temp": "28°C", "condition": "Nắng nhẹ", "icon": "🌤️", "tip": "Thời tiết đẹp"})
