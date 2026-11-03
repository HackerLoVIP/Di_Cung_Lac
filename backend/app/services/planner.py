from typing import List, Dict, Any, Optional, Tuple
import math
import re
import time
import json
import urllib.parse
import urllib.request
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

# Toa do trung tam chuan xac cua cac thanh pho / tinh thanh pho bien tai Viet Nam
CITY_COORDINATES: Dict[str, Tuple[float, float, str]] = {
    "hồ chí minh": (10.7769, 106.7009, "Trung tâm Quận 1, TP. Hồ Chí Minh"),
    "sài gòn": (10.7769, 106.7009, "Trung tâm Quận 1, TP. Hồ Chí Minh"),
    "tphcm": (10.7769, 106.7009, "Trung tâm Quận 1, TP. Hồ Chí Minh"),
    "thủ đức": (10.8494, 106.7537, "TP. Thủ Đức, TP. Hồ Chí Minh"),
    "hà nội": (21.0285, 105.8542, "Quận Hoàn Kiếm, Thủ đô Hà Nội"),
    "đà nẵng": (16.0544, 108.2022, "Quận Hải Châu, TP. Đà Nẵng"),
    "cần thơ": (10.0452, 105.7469, "Bến Ninh Kiều, Quận Ninh Kiều, TP. Cần Thơ"),
    "bình dương": (10.9804, 106.6519, "TP. Thủ Dầu Một, Tỉnh Bình Dương"),
    "biên hòa": (10.9574, 106.8427, "TP. Biên Hòa, Tỉnh Đồng Nai"),
    "đồng nai": (10.9574, 106.8427, "TP. Biên Hòa, Tỉnh Đồng Nai"),
    "hải phòng": (20.8449, 106.6881, "Trung tâm TP. Hải Phòng"),
    "vũng tàu": (10.3460, 107.0843, "Trung tâm TP. Vũng Tàu, Bà Rịa - Vũng Tàu"),
    "tây ninh": (11.3126, 106.1025, "Trung tâm TP. Tây Ninh, Tỉnh Tây Ninh"),
    "đà lạt": (11.9404, 108.4583, "Khu Hòa Bình, Phường 1, TP. Đà Lạt"),
    "pleiku": (13.9833, 108.0000, "Trung tâm TP. Pleiku, Tỉnh Gia Lai"),
    "phú quốc": (10.2189, 103.9576, "Phường Dương Đông, TP. Phú Quốc"),
    "nha trang": (12.2388, 109.1967, "Đường Trần Phú, TP. Nha Trang, Khánh Hòa"),
    "bến tre": (10.2415, 106.3758, "Trung tâm TP. Bến Tre, Tỉnh Bến Tre"),
    "hà giang": (22.8233, 104.9839, "Cột mốc Km0, TP. Hà Giang"),
}


def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Tinh khoang cach thuc te giua 2 toa do GPS theo cong thuc Haversine (km)"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    # Nhan he so duong bo thuc te (~1.25x so voi duong chim bay)
    return round(R * c * 1.22, 1)


def estimate_travel_time(distance_km: float) -> int:
    """Uoc tinh thoi gian di chuyen thuc te theo cu ly"""
    if distance_km <= 0:
        return 0
    if distance_km > 35:
        # Di chuyen lien tinh (trung binh 45-50 km/h)
        return max(30, int(distance_km * 1.3 + 10))
    # Di chuyen noi do (trung binh 25-30 km/h)
    return max(5, int(distance_km * 2.3 + 3))


def resolve_departure_point(
    start_location: Optional[str],
    start_lat: Optional[float],
    start_lng: Optional[float],
) -> Tuple[str, float, float, str]:
    """
    Xac dinh chinh xac ten va toa do GPS thuc te cua Diem xuat phat (Diem so 1).
    """
    label = (start_location or "TP. Hồ Chí Minh").strip()
    if start_lat is not None and start_lng is not None and abs(start_lat) > 0.1 and abs(start_lng) > 0.1:
        return (
            f"Điểm xuất phát: {label} (Vị trí GPS của bạn)",
            float(start_lat),
            float(start_lng),
            f"Tọa độ GPS thực tế ({round(float(start_lat), 4)}, {round(float(start_lng), 4)}) - {label}"
        )

    lower = label.lower()
    for key, (lat, lng, addr) in CITY_COORDINATES.items():
        if key in lower:
            return (
                f"Điểm xuất phát: Vị trí hiện tại ({label})",
                lat,
                lng,
                addr
            )

    # Thu geocode bang OpenStreetMap Nominatim neu nguoi dung nhap dia chi cu the
    try:
        q = urllib.parse.quote(f"{label}, Vietnam")
        url = f"https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            results = json.loads(resp.read().decode("utf-8"))
            if results:
                lat = float(results[0]["lat"])
                lng = float(results[0]["lon"])
                disp = results[0].get("display_name", label)
                return (
                    f"Điểm xuất phát: {label}",
                    lat,
                    lng,
                    disp
                )
    except Exception:
        pass

    return (
        f"Điểm xuất phát: {label}",
        10.7769,
        106.7009,
        "Trung tâm TP. Hồ Chí Minh"
    )


def _match_verified_db_location(loc_name: str, existing_locs: List[Location]) -> Optional[Location]:
    """
    So khop thong minh ten dia diem do AI sinh ra voi dia diem da xac thuc GPS 100% trong DB.
    """
    if not loc_name or not existing_locs:
        return None
    clean_query = loc_name.lower().strip()
    for loc in existing_locs:
        db_name = loc.name.lower().strip()
        if clean_query == db_name or clean_query in db_name or db_name in clean_query:
            return loc
        # So khop theo cum tu chinh truoc dau ngoac "("
        short_db = db_name.split("(")[0].strip()
        if len(short_db) >= 6 and short_db in clean_query:
            return loc

    # So khop theo tu khoa dac trung
    keyword_aliases = {
        "núi bà đen": "núi bà đen",
        "năm sánh": "năm sánh",
        "toà thánh": "toà thánh",
        "tòa thánh": "toà thánh",
        "cao đài": "toà thánh",
        "gò kén": "gò kén",
        "thiền lâm": "gò kén",
        "hoàng minh": "hoàng minh",
        "út huệ": "út huệ",
        "dầu tiếng": "dầu tiếng",
        "vinpearl": "vinpearl",
        "imperial": "imperial",
        "colline": "colline",
        "majestic": "majestic",
        "seashells": "seashells",
        "hoàng anh gia lai": "hoàng anh gia lai",
        "kitô": "kitô",
        "kito": "kitô",
        "vú sữa": "vú sữa",
        "hải đăng": "hải đăng",
        "bãi sau": "bãi sau",
        "thùy vân": "bãi sau",
        "bạch dinh": "bạch dinh",
        "bé mặn": "bé mặn",
        "sailing club": "sailing club",
        "thuận phúc": "thuận phúc",
        "nghinh phong": "nghinh phong",
        "cầu đất": "cầu đất",
        "lâm viên": "lâm viên",
        "xuân hương": "lâm viên",
        "tao ngộ": "tao ngộ",
        "lá é": "tao ngộ",
        "túi mơ to": "túi mơ to",
        "linh phước": "linh phước",
        "ve chai": "linh phước",
        "datanla": "datanla",
        "tăng bạt hổ": "tăng bạt hổ",
        "dinh độc lập": "dinh độc lập",
        "thống nhất": "dinh độc lập",
        "bưu điện": "bưu điện",
        "bến thành": "bến thành",
        "bạch đằng": "bạch đằng",
        "nguyễn huệ": "nguyễn huệ",
        "biển hồ chè": "biển hồ chè",
        "hàng thông": "biển hồ chè",
        "t'nưng": "biển hồ pleiku",
        "phở hồng": "phở khô hồng",
        "phở khô": "phở khô hồng",
        "bazan": "bazan",
        "minh thành": "minh thành",
        "bãi sao": "bãi sao",
        "hòn thơm": "hòn thơm",
        "kiến xây": "kiến xây",
        "bún quậy": "kiến xây",
        "hàm ninh": "hàm ninh",
        "grand world": "grand world",
    }
    for kw, target_sub in keyword_aliases.items():
        if kw in clean_query:
            for loc in existing_locs:
                if target_sub in loc.name.lower():
                    return loc
    return None


def _verify_or_geocode_coords(
    loc_name: str,
    province: Province,
    raw_lat: Optional[float],
    raw_lng: Optional[float],
) -> Tuple[float, float]:
    """
    Kiem chung toa do GPS cua dia diem moi:
    - Thu geocode bang OpenStreetMap Nominatim tai tinh do de lay toa do chinh xac 100%.
    - Neu Nominatim tim thay ket qua nam trong ban kinh <= 45km quanh tam tinh thi dung toa do Nominatim.
    - Neu khong, kiem tra raw_lat/raw_lng cua AI xem co nam trong ban kinh <= 45km quanh tam tinh khong.
    """
    p_lat = province.latitude or 10.7769
    p_lng = province.longitude or 106.7009

    try:
        clean_search = loc_name.split("(")[0].strip()
        q = urllib.parse.quote(f"{clean_search}, {province.name}, Vietnam")
        url = f"https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/1.0"})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            results = json.loads(resp.read().decode("utf-8"))
            if results:
                g_lat = float(results[0]["lat"])
                g_lng = float(results[0]["lon"])
                if calculate_distance(p_lat, p_lng, g_lat, g_lng) <= 55.0:
                    return g_lat, g_lng
    except Exception:
        pass

    if raw_lat and raw_lng:
        try:
            r_lat = float(raw_lat)
            r_lng = float(raw_lng)
            if calculate_distance(p_lat, p_lng, r_lat, r_lng) <= 55.0:
                return r_lat, r_lng
        except Exception:
            pass

    return p_lat, p_lng


def _get_or_create_departure_location(
    db: Session,
    fallback_province_id: int,
    dep_name: str,
    dep_lat: float,
    dep_lng: float,
    dep_addr: str,
) -> Location:
    """
    Tao hoac lay ban ghi Location cho Diem xuat phat (de luu lich trinh khong loi khoa ngoai,
    va da duoc an khoi trang Kham Pha).
    """
    existing = db.query(Location).filter(Location.name == dep_name).first()
    img = resolve_real_image("điểm xuất phát", "tourist_spot")
    if existing:
        existing.latitude = dep_lat
        existing.longitude = dep_lng
        existing.address = dep_addr
        existing.image_url = img
        db.commit()
        db.refresh(existing)
        return existing

    loc = Location(
        province_id=fallback_province_id,
        name=dep_name,
        category="tourist_spot",
        description="Vị trí xuất phát khởi hành chuyến đi của bạn.",
        address=dep_addr,
        latitude=dep_lat,
        longitude=dep_lng,
        image_url=img,
        avg_cost_vnd=0,
        rating=5.0,
        tips="Kiểm tra kỹ giấy tờ tùy thân, sạc dự phòng và khởi hành đúng giờ để tránh kẹt xe nội đô.",
        transport_info="Điểm khởi hành xuất phát theo định vị GPS / thành phố của bạn."
    )
    db.add(loc)
    db.commit()
    db.refresh(loc)
    return loc


def _get_central_hotel_for_province(db: Session, province: Province, existing_locs: List[Location]) -> Location:
    """
    Lay Khach san trung tam cua tinh Điểm đến (Điểm số 2 trong Ngày 1).
    """
    for loc in existing_locs:
        if loc.category == "hotel":
            return loc

    hotel_name = f"Khách sạn Trung tâm {province.name}"
    hotel_img = resolve_real_image("vinpearl", "hotel")
    hotel = Location(
        province_id=province.id,
        name=hotel_name,
        category="hotel",
        description=f"Khách sạn tiêu chuẩn tọa lạc ngay trung tâm {province.name}, thuận tiện gửi hành lý và nhận phòng lưu trú.",
        address=f"Trung tâm {province.name}",
        latitude=province.latitude,
        longitude=province.longitude,
        image_url=hotel_img,
        avg_cost_vnd=350000,
        rating=4.8,
        tips="Bạn có thể gửi hành lý miễn phí tại quầy lễ tân nếu đến sớm trước giờ check-in tiêu chuẩn (14h00).",
        transport_info="Có bãi đỗ xe máy và ô tô miễn phí cho khách lưu trú."
    )
    db.add(hotel)
    db.commit()
    db.refresh(hotel)
    return hotel


def generate_smart_itinerary(
    province_id: Optional[int] = None,
    destination: Optional[str] = None,
    start_location: Optional[str] = None,
    start_lat: Optional[float] = None,
    start_lng: Optional[float] = None,
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

    existing_locs: List[Location] = []
    if province:
        existing_locs = db.query(Location).filter(
            Location.province_id == province.id,
            ~Location.name.ilike("Điểm xuất phát%"),
            ~Location.name.ilike("Xuất phát từ%"),
            ~Location.name.ilike("Khởi hành về%")
        ).all()

    # 1. Xac dinh chinh xac Diem so 1: Diem xuat phat thuc te cua nguoi dung
    dep_name, dep_lat, dep_lng, dep_addr = resolve_departure_point(start_location, start_lat, start_lng)

    loc_count = len(existing_locs)
    use_ai_dynamic = (not province) or (loc_count < max(6, num_days * 4)) or bool(user_prompt and user_prompt.strip())

    if use_ai_dynamic:
        ai_dest = target_dest or (province.name if province else "Tây Ninh")
        enriched_prompt = user_prompt or "Khám phá danh lam thắng cảnh, ẩm thực đặc sản và quán cà phê đẹp"
        if existing_locs:
            verified_names = ", ".join([f"{l.name} ({l.category})" for l in existing_locs[:14]])
            enriched_prompt = (
                f"{enriched_prompt}. "
                f"(BẮT BUỘC ưu tiên sử dụng đúng tên các địa điểm đã xác thực tọa độ GPS tại {ai_dest} sau đây: {verified_names})"
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
            if not province.image_url or "photo-1528127269322" in province.image_url:
                province.image_url = prov_img
                db.commit()

        existing_locs = db.query(Location).filter(
            Location.province_id == province.id,
            ~Location.name.ilike("Điểm xuất phát%"),
            ~Location.name.ilike("Xuất phát từ%"),
            ~Location.name.ilike("Khởi hành về%")
        ).all()

        # Lay Diem so 1 (Xuat phat) va Diem so 2 (Khach san nhan phong/gui do)
        dep_loc = _get_or_create_departure_location(db, province.id, dep_name, dep_lat, dep_lng, dep_addr)
        hotel_loc = _get_central_hotel_for_province(db, province, existing_locs)

        days_result: List[ItineraryDayResponse] = []
        total_cost = 0
        used_loc_ids = set()

        for day_dict in dynamic_data.get("days", []):
            day_number = day_dict.get("day_number", 1)
            day_title = day_dict.get("title", f"Ngày {day_number}: Trải nghiệm {province.name}")
            day_items: List[ItineraryItemResponse] = []
            order = 1
            prev_loc_coords: Optional[Tuple[float, float]] = None

            # NGÀY 1: BẮT ĐẦU TỪ ĐIỂM SỐ 1 (NƠI HIỆN TẠI CỦA BẠN) -> ĐIỂM SỐ 2 (KHÁCH SẠN NHẬN PHÒNG / GỬI HÀNH LÝ)
            if day_number == 1:
                # Điểm 1: Vị trí hiện tại / Điểm xuất phát
                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=1,
                    time_slot="06:30",
                    order_in_day=order,
                    note=f"Khởi hành xuất phát từ {start_location or 'vị trí hiện tại của bạn'} di chuyển đi {province.name}.",
                    travel_distance_km=0.0,
                    travel_time_minutes=0,
                    location=LocationResponse.from_orm(dep_loc)
                ))
                prev_loc_coords = (dep_loc.latitude, dep_loc.longitude)
                order += 1

                # Điểm 2: Di chuyển tới Khách sạn trung tâm nhận phòng / gửi đồ
                dist_to_hotel = calculate_distance(prev_loc_coords[0], prev_loc_coords[1], hotel_loc.latitude, hotel_loc.longitude)
                time_to_hotel = estimate_travel_time(dist_to_hotel)
                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=1,
                    time_slot="08:30",
                    order_in_day=order,
                    note=f"Đến {hotel_loc.name}, làm thủ tục gửi hành lý / nhận phòng khách sạn và nghỉ ngơi trước khi đi tham quan.",
                    travel_distance_km=dist_to_hotel,
                    travel_time_minutes=time_to_hotel,
                    location=LocationResponse.from_orm(hotel_loc)
                ))
                total_cost += hotel_loc.avg_cost_vnd
                prev_loc_coords = (hotel_loc.latitude, hotel_loc.longitude)
                used_loc_ids.add(hotel_loc.id)
                order += 1
            else:
                # NGÀY 2+: Điểm 1 xuất phát từ Khách sạn đang lưu trú
                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=day_number,
                    time_slot="07:30",
                    order_in_day=order,
                    note=f"Khởi hành buổi sáng từ {hotel_loc.name} bắt đầu lịch trình Ngày {day_number}."
                    if day_number < num_days
                    else f"Làm thủ tục trả phòng (check-out) tại {hotel_loc.name}, mang hành lý lên xe bắt đầu hành trình ngày cuối.",
                    travel_distance_km=0.0,
                    travel_time_minutes=0,
                    location=LocationResponse.from_orm(hotel_loc)
                ))
                prev_loc_coords = (hotel_loc.latitude, hotel_loc.longitude)
                order += 1

            for itm in day_dict.get("items", []):
                loc_name = (itm.get("location_name") or "").strip()
                if not loc_name:
                    continue

                # Bo qua cac muc hanh dong gia hoac ten trung voi thanh pho xuat phat / khach san (vi da co Diem 1 & Diem 2 chuan)
                lower_name = loc_name.lower().strip()
                start_clean = (start_location or "tp. hồ chí minh").lower().strip()
                dest_clean = province.name.lower().strip()
                if (
                    any(bad in lower_name for bad in ["xuất phát", "khởi hành", "di chuyển", "trở về", "gợi ý:", "nhận phòng", "check-in khách sạn"])
                    or lower_name in [start_clean, dest_clean, "tp. hồ chí minh", "hồ chí minh", "sài gòn", "hà nội", "đà nẵng"]
                    or itm.get("category") == "hotel"
                ):
                    continue

                # Uu tien khop voi dia diem da xac thuc GPS 100% trong DB
                db_loc = _match_verified_db_location(loc_name, existing_locs)

                if db_loc and db_loc.id in used_loc_ids:
                    continue

                loc_cat = itm.get("category", "tourist_spot")
                if loc_cat not in ["tourist_spot", "restaurant", "cafe", "beach", "shopping", "hotel"]:
                    loc_cat = "tourist_spot"

                if not db_loc:
                    verified_lat, verified_lng = _verify_or_geocode_coords(
                        loc_name, province, itm.get("latitude"), itm.get("longitude")
                    )
                    real_img = resolve_real_image(loc_name, loc_cat, itm.get("image_url"))
                    db_loc = Location(
                        province_id=province.id,
                        name=loc_name,
                        category=loc_cat,
                        description=itm.get("note", ""),
                        address=itm.get("address", province.name),
                        latitude=verified_lat,
                        longitude=verified_lng,
                        image_url=real_img,
                        avg_cost_vnd=int(itm.get("avg_cost_vnd") or 50000),
                        rating=4.8,
                        tips=itm.get("tips", "Nên kiểm tra thời gian mở cửa và chuẩn bị trang phục phù hợp."),
                        transport_info=itm.get("transport_info", "Di chuyển thuận tiện bằng xe máy hoặc ô tô.")
                    )
                    db.add(db_loc)
                    db.flush()
                    existing_locs.append(db_loc)
                else:
                    db_loc.image_url = resolve_real_image(db_loc.name, db_loc.category, db_loc.image_url)
                    db.commit()

                used_loc_ids.add(db_loc.id)

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

                time_slot_str = itm.get("time_slot", f"0{8 + order}:00")
                if day_number == 1 and order == 3 and time_slot_str < "09:00":
                    time_slot_str = "09:30"

                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=day_number,
                    time_slot=time_slot_str,
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

    # 2. Truong hop su dung truc tiep kho dia diem xac thuc trong CSDL
    locations = existing_locs
    if not locations:
        raise ValueError("Chua co du lieu dia diem cho tinh thanh nay")

    dep_loc = _get_or_create_departure_location(db, province.id, dep_name, dep_lat, dep_lng, dep_addr)
    hotel_loc = _get_central_hotel_for_province(db, province, locations)

    tourist_spots = [loc for loc in locations if loc.category in ["tourist_spot", "entertainment"]]
    beaches = [loc for loc in locations if loc.category == "beach"]
    restaurants = [loc for loc in locations if loc.category == "restaurant"]
    cafes = [loc for loc in locations if loc.category == "cafe"]
    shopping = [loc for loc in locations if loc.category == "shopping"]

    used_location_ids = {hotel_loc.id}
    days_result = []
    total_cost = 0

    def get_nearest_unused(
        ref_loc: Optional[Location],
        loc_list: List[Location],
        fallback_list: List[Location] = None
    ) -> Optional[Location]:
        candidates = [loc for loc in loc_list if loc.id not in used_location_ids]
        if not candidates and fallback_list:
            candidates = [loc for loc in fallback_list if loc.id not in used_location_ids]
        if not candidates:
            return loc_list[0] if loc_list else None
        if ref_loc:
            candidates.sort(key=lambda x: calculate_distance(ref_loc.latitude, ref_loc.longitude, x.latitude, x.longitude))
        chosen = candidates[0]
        used_location_ids.add(chosen.id)
        return chosen

    for day_idx in range(1, num_days + 1):
        day_items = []
        order = 1
        prev_loc: Optional[Location] = None

        def add_item(loc: Optional[Location], time_slot: str, note: str, is_origin: bool = False):
            nonlocal order, total_cost, prev_loc
            if not loc:
                return

            dist = 0.0
            time_m = 0
            if prev_loc and not is_origin:
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
            day_title = f"Ngày 1: Xuất phát đi {province.name}, Nhận phòng Khách sạn & Khám phá biểu tượng"
            add_item(dep_loc, "06:30", f"Khởi hành xuất phát từ {start_location or 'vị trí hiện tại của bạn'} di chuyển đi {province.name}.", is_origin=True)
            add_item(hotel_loc, "08:30", f"Đến {hotel_loc.name}, làm thủ tục gửi hành lý / nhận phòng khách sạn và nghỉ ngơi ít phút.")
            add_item(get_nearest_unused(prev_loc, tourist_spots, beaches), "09:30", f"Tham quan địa danh biểu tượng nổi tiếng tại {province.name}.")
            add_item(get_nearest_unused(prev_loc, restaurants), "12:00", "Thưởng thức bữa trưa đặc sản trứ danh địa phương.")
            add_item(get_nearest_unused(prev_loc, beaches if beaches else tourist_spots, tourist_spots), "14:45", "Tham quan ngắm cảnh và chụp ảnh check-in buổi chiều.")
            add_item(get_nearest_unused(prev_loc, cafes, tourist_spots), "17:00", "Thư giãn thưởng thức cà phê ngắm hoàng hôn.")
            add_item(get_nearest_unused(prev_loc, restaurants, shopping), "19:00", "Thưởng thức ẩm thực tối và dạo phố đêm.")
        elif day_idx == num_days:
            day_title = f"Ngày {day_idx}: Trả phòng Khách sạn, Mua đặc sản & Khởi hành trở về"
            add_item(hotel_loc, "07:30", f"Làm thủ tục trả phòng (check-out) tại {hotel_loc.name}, chuẩn bị hành trình ngày cuối.", is_origin=True)
            add_item(get_nearest_unused(prev_loc, tourist_spots, beaches), "08:30", "Tham quan thắng cảnh buổi sáng trong lành.")
            add_item(get_nearest_unused(prev_loc, shopping, tourist_spots), "10:15", "Ghé chợ địa phương mua quà đặc sản mang về.")
            add_item(get_nearest_unused(prev_loc, restaurants), "12:00", f"Thưởng thức bữa trưa đặc sản trên cung đường trở về lại {start_location or 'điểm xuất phát'}.")
        else:
            day_title = f"Ngày {day_idx}: Trải nghiệm chuyên sâu & Cảnh sắc thiên nhiên {province.name}"
            add_item(hotel_loc, "07:30", f"Khởi hành buổi sáng từ {hotel_loc.name} bắt đầu lịch trình Ngày {day_idx}.", is_origin=True)
            add_item(get_nearest_unused(prev_loc, tourist_spots), "08:30", "Khám phá danh thắng thiên nhiên và di tích.")
            add_item(get_nearest_unused(prev_loc, restaurants), "11:30", "Ăn trưa tại quán ngon bản địa.")
            add_item(get_nearest_unused(prev_loc, beaches if beaches else tourist_spots, tourist_spots), "14:30", "Trải nghiệm hoạt động ngoài trời đặc sắc.")
            add_item(get_nearest_unused(prev_loc, cafes, shopping), "16:30", "Dừng chân cà phê chill ngắm cảnh.")
            add_item(get_nearest_unused(prev_loc, restaurants), "19:00", "Khám phá ẩm thực đêm.")

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
