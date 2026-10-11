from typing import List, Dict
from sqlalchemy.orm import Session
from app.models.location import Location
from app.models.province import Province

def generate_ai_chat_response(message: str, province_id: int, db: Session) -> str:
    """Tro ly du lich AI tra loi cau hoi dua tren du lieu thuc te cua he thong"""
    province = db.query(Province).filter(Province.id == province_id).first()
    prov_name = province.name if province else "thành phố"

    locations = db.query(Location).filter(Location.province_id == province_id).limit(10).all()
    loc_names = ", ".join([loc.name for loc in locations])

    msg_lower = message.lower()

    if "ăn" in msg_lower or "quán" in msg_lower or "đặc sản" in msg_lower:
        food_locs = [l for l in locations if l.category == "restaurant"]
        if food_locs:
            recommend = ", ".join([f"{l.name} ({l.avg_cost_vnd:,}đ)" for l in food_locs[:3]])
            return f"Tại {prov_name}, mình gợi ý bạn nên ghé thưởng thức ẩm thực tại: {recommend}. Các quán này đều có giá cả niêm yết rõ ràng và phản hồi rất tốt từ du khách thực tế!"
        return f"Tại {prov_name} có rất nhiều món ngon đường phố và hải sản tươi sống. Bạn có thể ghé các khu chợ đêm để thưởng thức trọn vẹn nhé!"

    if "mưa" in msg_lower or "thời tiết" in msg_lower:
        indoor_locs = [l for l in locations if l.is_indoor]
        if indoor_locs:
            names = ", ".join([l.name for l in indoor_locs[:2]])
            return f"Nếu trời mưa tại {prov_name}, bạn nên ưu tiên các điểm tham quan trong nhà hoặc quán cà phê chill như: {names} để giữ an toàn và không bị gián đoạn chuyến đi nhé!"
        return f"Thời tiết tại {prov_name} thường rất lý tưởng, bạn nên mang theo áo khoác nhẹ hoặc kem chống nắng để trải nghiệm thoải mái nhất."

    if "chi phí" in msg_lower or "tiền" in msg_lower or "ngân sách" in msg_lower:
        return f"Chuyến du lịch {prov_name} tự túc trung bình dao động khoảng 1.200.000đ - 1.800.000đ/người cho lịch trình 3 ngày 2 đêm (đã bao gồm ăn uống hải sản, vé tham quan và cà phê ngắm cảnh)."

    return f"Chào bạn! Mình là trợ lý AI Đi Cùng Lạc tại {prov_name}. Hệ thống ghi nhận các điểm đến nổi bật như: {loc_names}. Bạn có thể hỏi mình về quán ăn ngon, bãi tắm đẹp hoặc cách sắp xếp lịch trình nhé!"
