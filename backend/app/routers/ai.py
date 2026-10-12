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

import requests

WEATHER_CODE_MAP = {
    0: ("Trời quang đãng, nắng đẹp", "☀️", "Thời tiết cực kỳ lý tưởng để tham quan, chụp ảnh và tắm biển"),
    1: ("Chủ yếu nắng, ít mây", "🌤️", "Thời tiết rất đẹp, thoáng đãng cho mọi hoạt động ngoài trời"),
    2: ("Mây rải rác", "⛅", "Trời mát mẻ, dễ chịu, rất thích hợp dạo phố và khám phá"),
    3: ("Trời nhiều mây, râm mát", "☁️", "Trời râm mát, không bị nắng gắt, đi lại thuận tiện"),
    45: ("Có sương mù nhẹ", "🌫️", "Không khí se lạnh, chú ý tầm nhìn khi lái xe"),
    48: ("Sương mù dày đặc", "🌫️", "Nên bật đèn xe và đi chậm trên các cung đường đèo"),
    51: ("Mưa phùn lất phất", "🌦️", "Nên mang theo ô nhỏ hoặc áo mưa tiện lợi khi ra ngoài"),
    61: ("Mưa rào nhẹ", "🌧️", "Nên chuẩn bị áo mưa hoặc ghé quán cafe view đẹp ngắm mưa"),
    63: ("Mưa vừa", "🌧️", "Ưu tiên các địa điểm tham quan trong nhà hoặc quán ăn đặc sản"),
    65: ("Mưa to", "⛈️", "Hạn chế leo núi hoặc di chuyển đường đèo trong thời điểm này"),
    80: ("Mưa rào bất chợt", "🌦️", "Mưa rào qua nhanh, trời sẽ sớm tạnh ráo trở lại"),
    95: ("Có dông sét", "⚡", "Nên nghỉ ngơi trong nhà hoặc quán xá, chờ thời tiết ổn định")
}

@router.get("/weather")
def get_weather(province_id: int = 1, db: Session = Depends(get_db)):
    """Lấy dữ liệu thời tiết thực tế từ trạm khí tượng vệ tinh Open-Meteo theo tọa độ GPS thật của tỉnh"""
    province = db.query(Province).filter(Province.id == province_id).first()
    lat = province.latitude if province and province.latitude else 10.346
    lng = province.longitude if province and province.longitude else 107.084
    p_name = province.name if province else "Điểm đến"

    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FBangkok"
        res = requests.get(url, timeout=4)
        if res.status_code == 200:
            data = res.json().get("current", {})
            temp = round(data.get("temperature_2m", 28))
            feels_like = round(data.get("apparent_temperature", temp))
            humidity = data.get("relative_humidity_2m", 75)
            wind_speed = round(data.get("wind_speed_10m", 12))
            rain = data.get("precipitation", 0.0)
            code = data.get("weather_code", 1)

            cond_text, icon, tip = WEATHER_CODE_MAP.get(code, ("Thời tiết ổn định", "🌤️", "Thích hợp cho chuyến tham quan ngoài trời"))

            return {
                "temp": f"{temp}°C",
                "feels_like": f"{feels_like}°C",
                "humidity": f"{humidity}%",
                "wind_speed": f"{wind_speed} km/h",
                "precipitation": f"{rain} mm",
                "condition": cond_text,
                "icon": icon,
                "tip": tip,
                "location_name": p_name,
                "is_live": True
            }
    except Exception as e:
        print(f"[WARN] Weather API call error: {e}")

    # Fallback an toàn nếu mất mạng
    return {
        "temp": "28°C",
        "feels_like": "30°C",
        "humidity": "78%",
        "wind_speed": "14 km/h",
        "precipitation": "0 mm",
        "condition": "Nắng nhẹ, gió mát",
        "icon": "🌤️",
        "tip": f"Thời tiết tại {p_name} thuận lợi cho các hoạt động du lịch",
        "location_name": p_name,
        "is_live": False
    }
