from typing import List, Dict, Any, Optional
import math
from sqlalchemy.orm import Session
from app.models.location import Location
from app.models.province import Province
from app.schemas.itinerary import (
    ItineraryResponse,
    ItineraryDayResponse,
    ItineraryItemResponse
)
from app.schemas.location import LocationResponse
from app.schemas.province import ProvinceResponse

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Tinh khoang cach uoc tinh giua 2 toa do theo cong thuc Haversine (km)"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

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
        # Neu het cho moi thi chap nhan dung lai
        if loc_list:
            return loc_list[0]
        return None

    # Sinh lich trinh cho tung ngay
    for day_idx in range(1, num_days + 1):
        day_items: List[ItineraryItemResponse] = []
        order = 1

        if day_idx == 1:
            day_title = f"Ngày {day_idx}: Khám phá trung tâm & check-in thành phố"
            # Sang: Tham quan diem bieu tuong
            loc1 = get_unused(tourist_spots, beaches)
            if loc1:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="08:30", order_in_day=order,
                    note="Tham quan điểm nổi bật buổi sáng",
                    location=LocationResponse.from_orm(loc1)
                ))
                total_cost += loc1.avg_cost_vnd
                order += 1

            # Trua: An dac san
            loc_lunch = get_unused(restaurants)
            if loc_lunch:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="11:30", order_in_day=order,
                    note="Thưởng thức ẩm thực trưa đặc sản",
                    location=LocationResponse.from_orm(loc_lunch)
                ))
                total_cost += loc_lunch.avg_cost_vnd
                order += 1

            # Chieu: Tham quan bieu tuong / bien
            loc_afternoon = get_unused(beaches if beaches else tourist_spots, tourist_spots)
            if loc_afternoon:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="14:30", order_in_day=order,
                    note="Tắm biển hoặc tham quan cảnh quan",
                    location=LocationResponse.from_orm(loc_afternoon)
                ))
                total_cost += loc_afternoon.avg_cost_vnd
                order += 1

            # Chieu toi: Cafe ngam hoang hon
            loc_cafe = get_unused(cafes)
            if loc_cafe:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="16:45", order_in_day=order,
                    note="Nghỉ ngơi, ngắm hoàng hôn và chụp ảnh",
                    location=LocationResponse.from_orm(loc_cafe)
                ))
                total_cost += loc_cafe.avg_cost_vnd
                order += 1

            # Toi: An toi hai san / dac san
            loc_dinner = get_unused(restaurants)
            if loc_dinner:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="19:00", order_in_day=order,
                    note="Ăn tối thư giãn cùng gia đình / bạn bè",
                    location=LocationResponse.from_orm(loc_dinner)
                ))
                total_cost += loc_dinner.avg_cost_vnd
                order += 1

        elif day_idx == num_days:
            day_title = f"Ngày {day_idx}: Mua sắm đặc sản & tạm biệt"
            # Sang: Diem tham quan nhe nhang
            loc_morn = get_unused(tourist_spots, beaches)
            if loc_morn:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="08:00", order_in_day=order,
                    note="Dạo mát buổi sáng",
                    location=LocationResponse.from_orm(loc_morn)
                ))
                total_cost += loc_morn.avg_cost_vnd
                order += 1

            # Mua sam cho dem / cho dac san
            loc_shop = get_unused(shopping, tourist_spots)
            if loc_shop:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="10:00", order_in_day=order,
                    note="Mua quà lưu niệm và đặc sản địa phương",
                    location=LocationResponse.from_orm(loc_shop)
                ))
                total_cost += loc_shop.avg_cost_vnd
                order += 1

            # Trua cuoi
            loc_lunch_final = get_unused(restaurants)
            if loc_lunch_final:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="12:00", order_in_day=order,
                    note="Bữa ăn trưa chia tay",
                    location=LocationResponse.from_orm(loc_lunch_final)
                ))
                total_cost += loc_lunch_final.avg_cost_vnd
                order += 1

        else:
            day_title = f"Ngày {day_idx}: Trải nghiệm sâu & vui chơi trọn vẹn"
            # Sang: Diem du lich van hoa / hoat dong ngoai troi
            loc_act1 = get_unused(tourist_spots)
            if loc_act1:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="08:30", order_in_day=order,
                    note="Tham quan và trải nghiệm văn hóa",
                    location=LocationResponse.from_orm(loc_act1)
                ))
                total_cost += loc_act1.avg_cost_vnd
                order += 1

            # Trua
            loc_lunch_mid = get_unused(restaurants)
            if loc_lunch_mid:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="11:30", order_in_day=order,
                    note="Ăn trưa quán nổi tiếng",
                    location=LocationResponse.from_orm(loc_lunch_mid)
                ))
                total_cost += loc_lunch_mid.avg_cost_vnd
                order += 1

            # Chieu
            loc_act2 = get_unused(beaches if beaches else tourist_spots, tourist_spots)
            if loc_act2:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="14:30", order_in_day=order,
                    note="Hoạt động giải trí ngoài trời",
                    location=LocationResponse.from_orm(loc_act2)
                ))
                total_cost += loc_act2.avg_cost_vnd
                order += 1

            # Cafe chieu
            loc_cafe_mid = get_unused(cafes)
            if loc_cafe_mid:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="16:30", order_in_day=order,
                    note="Nghỉ chân thưởng thức đồ uống",
                    location=LocationResponse.from_orm(loc_cafe_mid)
                ))
                total_cost += loc_cafe_mid.avg_cost_vnd
                order += 1

            # Toi
            loc_dinner_mid = get_unused(restaurants)
            if loc_dinner_mid:
                day_items.append(ItineraryItemResponse(
                    id=order, day_number=day_idx, time_slot="19:00", order_in_day=order,
                    note="Ăn tối và dạo phố đêm",
                    location=LocationResponse.from_orm(loc_dinner_mid)
                ))
                total_cost += loc_dinner_mid.avg_cost_vnd
                order += 1

        days_result.append(ItineraryDayResponse(
            day_number=day_idx,
            title=day_title,
            items=day_items
        ))

    # Cong them phi di chuyen co ban uoc tinh (100k / ngay)
    estimated_transport = num_days * 100000
    total_cost += estimated_transport

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
