from typing import List, Dict, Any, Optional
import math
import re
import time
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
from app.services.location_images import resolve_real_image, resolve_province_image
from app.services.gemini_service import generate_dynamic_itinerary_with_gemini


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
    minutes = int(distance_km * 2.4 + 3)
    return max(5, minutes)


def generate_smart_itinerary(
    province_id: Optional[int] = None,
    destination: Optional[str] = None,
    start_location: Optional[str] = None,
    num_days: int = 2,
    num_nights: int = 1,
    user_prompt: Optional[str] = None,
    db: Session = None
) -> ItineraryResponse:
    target_dest = (destination or "").strip()
    province = None

    if target_dest:
        province = db.query(Province).filter(Province.name.ilike(f"%{target_dest}%")).first()
    elif province_id:
        province = db.query(Province).filter(Province.id == province_id).first()
        if province:
            target_dest = province.name

    loc_count = 0
    existing_locs: List[Location] = []
    if province:
        existing_locs = db.query(Location).filter(Location.province_id == province.id).all()
        loc_count = len(existing_locs)

    # Kich hoat AI Gemini 2.5 Flash khi:
    # 1. Tinh thanh moi / chua du dia diem cho so ngay yeu cau (loc_count < num_days * 4)
    # 2. Nguoi dung co nhap yeu cau / tuy chon phong cach cu the (user_prompt)
    use_ai_dynamic = (not province) or (loc_count < max(6, num_days * 4)) or bool(user_prompt and user_prompt.strip())

    if use_ai_dynamic:
        ai_dest = target_dest or (province.name if province else "Tây Ninh")
        # Bo sung danh sach dia diem xac thuc trong DB de AI uu tien ket hop neu co
        enriched_prompt = user_prompt or "Khám phá danh lam thắng cảnh, ẩm thực đặc sản và quán cà phê đẹp"
        if existing_locs:
            verified_names = ", ".join([f"{l.name} ({l.category})" for l in existing_locs[:12]])
            enriched_prompt = (
                f"{enriched_prompt}. "
                f"(Gợi ý các địa điểm thực tế đã xác thực tại {ai_dest} có thể ưu tiên đưa vào nếu phù hợp: {verified_names})"
            )

        dynamic_data = generate_dynamic_itinerary_with_gemini(
            destination=ai_dest,
            num_days=num_days,
            num_nights=num_nights,
            user_prompt=enriched_prompt,
            start_location=start_location
        )

        dest_name = dynamic_data.get("destination_name", ai_dest)
        if not province:
            province = db.query(Province).filter(Province.name.ilike(f"%{dest_name}%")).first()

        prov_img = resolve_province_image(dest_name)
        if not province:
            slug = re.sub(r'[^a-zA-Z0-9]', '-', dest_name.lower()).strip('-')
            province = Province(
                name=dest_name,
                slug=f"{slug}-{int(time.time())}",
                image_url=prov_img,
                description=dynamic_data.get("destination_description", f"Khám phá vẻ đẹp văn hoá, thiên nhiên và ẩm thực đặc sắc tại {dest_name}."),
                latitude=dynamic_data.get("center_lat", 11.312),
                longitude=dynamic_data.get("center_lng", 106.102)
            )
            db.add(province)
            db.commit()
            db.refresh(province)
        else:
            # Cap nhat anh tinh thanh neu dang bi trung anh cu
            if not province.image_url or "photo-1528127269322" in province.image_url:
                province.image_url = prov_img
                db.commit()

        days_result: List[ItineraryDayResponse] = []
        total_cost = 0

        for day_dict in dynamic_data.get("days", []):
            day_number = day_dict.get("day_number", 1)
            day_title = day_dict.get("title", f"Ngày {day_number}: Trải nghiệm {dest_name}")
            day_items: List[ItineraryItemResponse] = []
            order = 1
            prev_loc_coords = None

            for itm in day_dict.get("items", []):
                loc_name = (itm.get("location_name") or "").strip()
                if not loc_name:
                    continue

                # Tim xem dia diem da co trong DB chua (so khop linh hoat)
                db_loc = db.query(Location).filter(
                    Location.province_id == province.id,
                    Location.name.ilike(f"%{loc_name}%")
                ).first()

                loc_cat = itm.get("category", "tourist_spot")
                if loc_cat not in ["tourist_spot", "restaurant", "cafe", "beach", "shopping", "hotel"]:
                    loc_cat = "tourist_spot"

                real_img = resolve_real_image(loc_name, loc_cat, itm.get("image_url"))

                if not db_loc:
                    db_loc = Location(
                        province_id=province.id,
                        name=loc_name,
                        category=loc_cat,
                        description=itm.get("note", ""),
                        address=itm.get("address", province.name),
                        latitude=float(itm.get("latitude") or province.latitude),
                        longitude=float(itm.get("longitude") or province.longitude),
                        image_url=real_img,
                        avg_cost_vnd=int(itm.get("avg_cost_vnd") or 50000),
                        rating=4.8,
                        tips=itm.get("tips", "Nên kiểm tra thời gian mở cửa và chuẩn bị trang phục phù hợp."),
                        transport_info=itm.get("transport_info", "Di chuyển thuận tiện bằng xe máy hoặc ô tô.")
                    )
                    db.add(db_loc)
                    db.flush()
                else:
                    # Dam bao anh dia diem luon chuan xac
                    db_loc.image_url = resolve_real_image(db_loc.name, db_loc.category, db_loc.image_url)
                    db.commit()

                # Them menu items doc nhat
                existing_menu_names = {
                    mi.name.strip().lower()
                    for mi in db.query(MenuItem).filter(MenuItem.location_id == db_loc.id).all()
                    if mi.name
                }
                for m in itm.get("menu_items", []):
                    m_name = (m.get("name") or "").strip()
                    if m_name and m_name.lower() not in existing_menu_names:
                        db.add(MenuItem(
                            location_id=db_loc.id,
                            name=m_name,
                            price_vnd=int(m.get("price_vnd") or 35000),
                            is_signature=True
                        ))
                        existing_menu_names.add(m_name.lower())
                db.commit()
                db.refresh(db_loc)

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

        total_cost += num_days * 100000
        trip_title = (
            f"Hành trình {start_location} ➔ {province.name} ({num_days}N{num_nights}Đ)"
            if start_location
            else f"Lịch trình du lịch {province.name} {num_days}N{num_nights}Đ"
        )
        return ItineraryResponse(
            id=None,
            title=trip_title,
            province=ProvinceResponse.from_orm(province),
            num_days=num_days,
            num_nights=num_nights,
            status="planned",
            total_cost=total_cost,
            days=days_result
        )

    # 2. Truong hop du lieu tinh da co day du trong CSDL va khong can goi AI ngoai
    locations = existing_locs
    if not locations:
        raise ValueError("Chua co du lieu dia diem cho tinh thanh nay")

    tourist_spots = [loc for loc in locations if loc.category in ["tourist_spot", "entertainment"]]
    beaches = [loc for loc in locations if loc.category == "beach"]
    restaurants = [loc for loc in locations if loc.category == "restaurant"]
    cafes = [loc for loc in locations if loc.category == "cafe"]
    shopping = [loc for loc in locations if loc.category == "shopping"]

    used_location_ids = set()
    days_result = []
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

    for day_idx in range(1, num_days + 1):
        day_items = []
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
                note=note or loc.description,
                travel_distance_km=dist,
                travel_time_minutes=time_m,
                location=LocationResponse.from_orm(loc)
            ))
            total_cost += loc.avg_cost_vnd
            prev_loc = loc
            order += 1

        if day_idx == 1:
            day_title = f"Ngày {day_idx}: Khám phá biểu tượng & Ẩm thực đặc sản {province.name}"
            add_item(get_unused(tourist_spots, beaches), "08:00", f"Khởi đầu hành trình tại địa danh biểu tượng nổi tiếng nhất {province.name}")
            add_item(get_unused(restaurants), "11:30", "Thưởng thức bữa trưa đặc sản trứ danh địa phương")
            add_item(get_unused(beaches if beaches else tourist_spots, tourist_spots), "14:30", "Tham quan ngắm cảnh và chụp ảnh check-in")
            add_item(get_unused(cafes, tourist_spots), "16:45", "Thư giãn thưởng thức cà phê ngắm hoàng hôn")
            add_item(get_unused(restaurants, shopping), "19:00", "Thưởng thức ẩm thực tối và dạo phố đêm")
        elif day_idx == num_days:
            day_title = f"Ngày {day_idx}: Văn hoá bản địa & Mua sắm đặc sản {province.name}"
            add_item(get_unused(tourist_spots, beaches), "08:00", "Tham quan thắng cảnh buổi sáng trong lành")
            add_item(get_unused(shopping, tourist_spots), "10:00", "Mua sắm quà đặc sản địa phương mang về")
            add_item(get_unused(restaurants), "12:00", "Thưởng thức bữa trưa đặc sản trước khi kết thúc hành trình")
        else:
            day_title = f"Ngày {day_idx}: Trải nghiệm chuyên sâu & Cảnh sắc thiên nhiên {province.name}"
            add_item(get_unused(tourist_spots), "08:00", "Khám phá danh thắng thiên nhiên và di tích")
            add_item(get_unused(restaurants), "11:30", "Ăn trưa tại quán ngon bản địa")
            add_item(get_unused(beaches if beaches else tourist_spots, tourist_spots), "14:30", "Trải nghiệm hoạt động ngoài trời đặc sắc")
            add_item(get_unused(cafes, shopping), "16:30", "Dừng chân cà phê chill ngắm cảnh")
            add_item(get_unused(restaurants), "19:00", "Khám phá ẩm thực đêm")

        days_result.append(ItineraryDayResponse(
            day_number=day_idx,
            title=day_title,
            items=day_items
        ))

    total_cost += num_days * 100000
    trip_title = (
        f"Hành trình {start_location} ➔ {province.name} ({num_days}N{num_nights}Đ)"
        if start_location
        else f"Lịch trình du lịch {province.name} {num_days}N{num_nights}Đ"
    )
    return ItineraryResponse(
        id=None,
        title=trip_title,
        province=ProvinceResponse.from_orm(province),
        num_days=num_days,
        num_nights=num_nights,
        status="planned",
        total_cost=total_cost,
        days=days_result
    )
