from typing import List, Dict, Any, Optional
import math
from sqlalchemy.orm import Session
from app.models.location import Location, MenuItem
from app.models.province import Province
from app.schemas.itinerary import (
    ItineraryResponse,
    ItineraryDayResponse,
    ItineraryItemResponse
)
from app.schemas.location import LocationResponse
from app.schemas.province import ProvinceResponse

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Tinh khoang cach thuc te giua 2 toa do GPS theo cong thuc Haversine (km)"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 1)

def estimate_travel_time(distance_km: float) -> int:
    """Uoc tinh thoi gian di chuyen bang xe may trong thanh pho (trung binh 25-30 km/h)"""
    if distance_km <= 0:
        return 0
    # 25 km/h = ~2.4 phut/km + 3 phut do xe / cho den do
    minutes = int(distance_km * 2.4 + 3)
    return max(5, minutes)

def generate_smart_itinerary(
    province_id: int,
    num_days: int,
    num_nights: int,
    user_prompt: Optional[str],
    db: Session
) -> ItineraryResponse:
    province = db.query(Province).filter(Province.id == province_id).first()
    if not province:
        raise ValueError("Khong tim thay tinh thanh yeu cau")

    locations = db.query(Location).filter(Location.province_id == province_id).all()
    if not locations:
        raise ValueError("Chua co du lieu dia diem cho tinh thanh nay")

    # Phan loai dia diem theo danh muc
    tourist_spots = [loc for loc in locations if loc.category in ["tourist_spot", "entertainment"]]
    beaches = [loc for loc in locations if loc.category == "beach"]
    restaurants = [loc for loc in locations if loc.category == "restaurant"]
    cafes = [loc for loc in locations if loc.category == "cafe"]
    shopping = [loc for loc in locations if loc.category == "shopping"]

    used_location_ids = set()
    days_result: List[ItineraryDayResponse] = []
    total_cost = 0

    def get_unused(loc_list: List[Location], fallback_list: List[Location] = None) -> Optional[Location]:
        for loc in loc_list:
            if loc.id not in used_location_ids:
                used_location_ids.add(loc.id)
                return loc
        if fallback_list:
            for loc in fallback_list:
                if loc.id not in used_location_ids:
                    used_location_ids.add(loc.id)
                    return loc
        if loc_list:
            return loc_list[0]
        return None

    # Sinh lich trinh cho tung ngay
    for day_idx in range(1, num_days + 1):
        day_items: List[ItineraryItemResponse] = []
        order = 1
        prev_loc: Optional[Location] = None

        def add_item(loc: Optional[Location], time_slot: str, note: str):
            nonlocal order, total_cost, prev_loc
            if not loc:
                return

            dist = 0.0
            time_m = 0
            if prev_loc:
                dist = calculate_distance(prev_loc.latitude, prev_loc.longitude, loc.latitude, loc.longitude)
                time_m = estimate_travel_time(dist)

            day_items.append(ItineraryItemResponse(
                id=order,
                day_number=day_idx,
                time_slot=time_slot,
                order_in_day=order,
                note=note,
                travel_distance_km=dist,
                travel_time_minutes=time_m,
                location=LocationResponse.from_orm(loc)
            ))
            total_cost += loc.avg_cost_vnd
            prev_loc = loc
            order += 1

        if day_idx == 1:
            day_title = f"Ngày {day_idx}: Khám phá trung tâm & check-in thành phố"
            add_item(get_unused(tourist_spots, beaches), "08:30", "Bắt đầu chuyến đi tại điểm biểu tượng của thành phố")
            add_item(get_unused(restaurants), "11:30", "Thưởng thức bữa trưa đặc sản nổi tiếng")
            add_item(get_unused(beaches if beaches else tourist_spots, tourist_spots), "14:30", "Tắm biển mát và chụp ảnh bãi biển")
            add_item(get_unused(cafes), "16:45", "Nghỉ ngơi, thưởng thức cà phê ngắm hoàng hôn")
            add_item(get_unused(restaurants), "19:00", "Ăn tối hải sản tươi sống và dạo phố")

        elif day_idx == num_days:
            day_title = f"Ngày {day_idx}: Mua sắm đặc sản & tạm biệt"
            add_item(get_unused(tourist_spots, beaches), "08:00", "Dạo mát, chụp ảnh kỷ niệm buổi sáng sớm")
            add_item(get_unused(shopping, tourist_spots), "10:00", "Ghé chợ mua quà đặc sản mang về")
            add_item(get_unused(restaurants), "12:00", "Bữa trưa chia tay trước khi xuất phát về")

        else:
            day_title = f"Ngày {day_idx}: Trải nghiệm sâu sắc & ẩm thực độc đáo"
            add_item(get_unused(tourist_spots), "08:30", "Tham quan di tích lịch sử và cảnh quan đồi núi")
            add_item(get_unused(restaurants), "11:30", "Ăn trưa quán gia truyền đông khách")
            add_item(get_unused(beaches if beaches else tourist_spots, tourist_spots), "14:30", "Hoạt động vui chơi giải trí ngoài trời")
            add_item(get_unused(cafes), "16:30", "Uống cà phê phong cách độc lạ")
            add_item(get_unused(restaurants), "19:00", "Khám phá ẩm thực đường phố và chợ đêm")

        days_result.append(ItineraryDayResponse(
            day_number=day_idx,
            title=day_title,
            items=day_items
        ))

    # Tinh phi di chuyen co ban (xe may + xang uoc tinh 100k/ngay)
    total_cost += num_days * 100000

    return ItineraryResponse(
        id=None,
        title=f"Lịch trình du lịch {province.name} {num_days}N{num_nights}Đ",
        province=ProvinceResponse.from_orm(province),
        num_days=num_days,
        num_nights=num_nights,
        status="planned",
        total_cost=total_cost,
        days=days_result
    )
