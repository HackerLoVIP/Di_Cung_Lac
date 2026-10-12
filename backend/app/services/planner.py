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
from app.services.location_images import resolve_real_image


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

import re
import time
from app.services.gemini_service import generate_dynamic_itinerary_with_gemini

def generate_smart_itinerary(
    province_id: Optional[int] = None,
    destination: Optional[str] = None,
    start_location: Optional[str] = None,
    num_days: int = 3,
    num_nights: int = 2,
    user_prompt: Optional[str] = None,
    db: Session = None
) -> ItineraryResponse:
    # 1. Neu co destination nhap tu do hoac province_id khong co trong DB
    target_dest = (destination or "").strip()
    
    # Kiem tra xem co phai yeu cau bat ky diem den moi nao (VD: Tay Ninh, Ha Giang,...)
    use_ai_dynamic = bool(target_dest)
    province = None

    if target_dest:
        province = db.query(Province).filter(Province.name.ilike(f"%{target_dest}%")).first()
        if province:
            # Neu tinh da co trong DB nhung khong co du dia diem, van dung AI
            loc_count = db.query(Location).filter(Location.province_id == province.id).count()
            if loc_count >= 5:
                use_ai_dynamic = False
    elif province_id:
        province = db.query(Province).filter(Province.id == province_id).first()
        if province:
            loc_count = db.query(Location).filter(Location.province_id == province.id).count()
            if loc_count >= 4:
                use_ai_dynamic = False
            else:
                target_dest = province.name
                use_ai_dynamic = True
        else:
            target_dest = "Vũng Tàu"
            use_ai_dynamic = True

    # Neu can AI sinh lich trinh dong (VD: Tay Ninh, Phu Quoc, Ben Tre, bat ky diem den nao)
    if use_ai_dynamic or not province:
        ai_dest = target_dest or "Tây Ninh"
        dynamic_data = generate_dynamic_itinerary_with_gemini(
            destination=ai_dest,
            num_days=num_days,
            num_nights=num_nights,
            user_prompt=user_prompt,
            start_location=start_location
        )

        dest_name = dynamic_data.get("destination_name", ai_dest)
        if not province:
            province = db.query(Province).filter(Province.name.ilike(f"%{dest_name}%")).first()

        if not province:
            slug = re.sub(r'[^a-zA-Z0-9]', '-', dest_name.lower()).strip('-')
            province = Province(
                name=dest_name,
                slug=f"{slug}-{int(time.time())}",
                image_url="https://images.unsplash.com/photo-1528127269322-539801943592?w=800",
                description=dynamic_data.get("destination_description", f"Khám phá điểm đến {dest_name}"),
                latitude=dynamic_data.get("center_lat", 11.312),
                longitude=dynamic_data.get("center_lng", 106.102)
            )
            db.add(province)
            db.commit()
            db.refresh(province)

        days_result: List[ItineraryDayResponse] = []
        total_cost = 0

        for day_dict in dynamic_data.get("days", []):
            day_number = day_dict.get("day_number", 1)
            day_title = day_dict.get("title", f"Ngày {day_number}: Trải nghiệm {dest_name}")
            day_items: List[ItineraryItemResponse] = []
            order = 1
            prev_loc_coords = None

            for itm in day_dict.get("items", []):
                loc_name = itm.get("location_name")
                # Tim hoac luu vao DB de co id chuan
                db_loc = db.query(Location).filter(
                    Location.province_id == province.id,
                    Location.name == loc_name
                ).first()

                loc_cat = itm.get("category", "tourist_spot")
                real_img = resolve_real_image(loc_name, loc_cat, itm.get("image_url"))

                if not db_loc:
                    db_loc = Location(
                        province_id=province.id,
                        name=loc_name,
                        category=loc_cat,
                        description=itm.get("note", ""),
                        address=itm.get("address", province.name),
                        latitude=itm.get("latitude", province.latitude),
                        longitude=itm.get("longitude", province.longitude),
                        image_url=real_img,
                        avg_cost_vnd=itm.get("avg_cost_vnd", 50000),
                        rating=4.8,
                        tips=itm.get("tips", "Nên kiểm tra thời gian mở cửa và chuẩn bị tư trang"),
                        transport_info=itm.get("transport_info", "Xe máy hoặc taxi địa phương")
                    )
                    db.add(db_loc)
                    db.flush()

                # Cập nhật ảnh thật nếu chưa có hoặc là ảnh cũ
                if not db_loc.image_url or "photo-1507525428034" in db_loc.image_url:
                    db_loc.image_url = real_img
                    db.commit()

                # Thêm menu items độc nhất (không lặp lại)
                existing_menu_names = {mi.name for mi in db.query(MenuItem).filter(MenuItem.location_id == db_loc.id).all()}
                for m in itm.get("menu_items", []):
                    m_name = m.get("name", "Món đặc sản").strip()
                    if m_name and m_name not in existing_menu_names:
                        db.add(MenuItem(
                            location_id=db_loc.id,
                            name=m_name,
                            price_vnd=m.get("price_vnd", 30000),
                            is_signature=True
                        ))
                        existing_menu_names.add(m_name)
                db.commit()
                db.refresh(db_loc)

                # Tinh khoang cach va thoi gian di chuyen
                cur_coords = (db_loc.latitude, db_loc.longitude)
                dist = 0.0
                time_m = 0
                if prev_loc_coords:
                    dist = calculate_distance(prev_loc_coords[0], prev_loc_coords[1], cur_coords[0], cur_coords[1])
                    time_m = estimate_travel_time(dist)

                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=day_number,
                    time_slot=itm.get("time_slot", f"0{7 + order}:00"),
                    order_in_day=order,
                    note=itm.get("note", db_loc.description),
                    travel_distance_km=dist,
                    travel_time_minutes=time_m,
                    location=LocationResponse.from_orm(db_loc)
                ))
                total_cost += db_loc.avg_cost_vnd
                prev_loc_coords = cur_coords
                order += 1

            days_result.append(ItineraryDayResponse(
                day_number=day_number,
                title=day_title,
                items=day_items
            ))

        total_cost += num_days * 120000  # Uoc tinh xang xe & di chuyen
        return ItineraryResponse(
            id=None,
            title=f"Lịch trình du lịch {dest_name} {num_days}N{num_nights}Đ",
            province=ProvinceResponse.from_orm(province),
            num_days=num_days,
            num_nights=num_nights,
            status="planned",
            total_cost=total_cost,
            days=days_result
        )

    # 2. Truong hop du lieu tinh da co day du trong CSDL (Vung Tau)
    locations = db.query(Location).filter(Location.province_id == province.id).all()
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
