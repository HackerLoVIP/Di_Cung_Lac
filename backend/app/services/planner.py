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


def _google_maps_geocode(
    query_str: str,
    ref_lat: Optional[float] = None,
    ref_lng: Optional[float] = None,
    max_dist_km: float = 50.0,
    max_span: float = 4500.0,
) -> Optional[Tuple[float, float, Optional[str]]]:
    """
    Truy van truc tiep Google Maps Embed Engine (google.com/maps?q=...&output=embed&hl=vi)
    de lay cap toa do GPS (lat, lng) va dia chi that chinh xac 100% tren nen ban do Google Maps:
    - Uu tien 1: Khop chinh xac 1 POI (spotlit) -> lay [lat, lng] + dia chi that cua Google Maps.
    - Uu tien 2: Khop danh sach POI (E7 integer coordinates) -> lay ghim POI dau tien nam trong ban kinh tinh.
    - Uu tien 3: Khung nhin duong pho hep (span <= 4500m).
    """
    try:
        q = urllib.parse.quote(query_str)
        url = f"https://www.google.com/maps?q={q}&output=embed&hl=vi"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4.5) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

            # 1. Exact spotlit POI match: ["0x...:0x...","Full Name, Real Address",[lat,lng]
            spot = re.search(r'\["0x[0-9a-f]+:0x[0-9a-f]+","([^"]+)",\[(-?\d+\.\d+),(-?\d+\.\d+)\]', html)
            if spot:
                full_addr = spot.group(1)
                lat = float(spot.group(2))
                lng = float(spot.group(3))
                if ref_lat is None or calculate_distance(ref_lat, ref_lng, lat, lng) <= max_dist_km:
                    addr_part = full_addr.split(",", 1)[1].strip() if "," in full_addr else full_addr
                    return round(lat, 6), round(lng, 6), addr_part

            # 2. E7 POI pins list: "/g/...",null,[lat_e7,lng_e7]
            e7_list = re.findall(r'"/[gm]/[^"]+",null,\[(-?\d{8,9}),(-?\d{9,10})\]', html)
            for lat_s, lng_s in e7_list:
                lat = int(lat_s) / 1e7
                lng = int(lng_s) / 1e7
                if ref_lat is None or calculate_distance(ref_lat, ref_lng, lat, lng) <= max_dist_km:
                    return round(lat, 6), round(lng, 6), None

            # 3. Tight street/address viewport match (span <= max_span)
            m = re.search(r"\[([0-9.]+),(-?\d+\.\d+),(-?\d+\.\d+)\]", html)
            if m:
                span = float(m.group(1))
                lng = float(m.group(2))
                lat = float(m.group(3))
                if span <= max_span:
                    if ref_lat is None or calculate_distance(ref_lat, ref_lng, lat, lng) <= max_dist_km:
                        return round(lat, 6), round(lng, 6), None
    except Exception:
        pass
    return None


def _arcgis_geocode(query_str: str, min_score: float = 80.0) -> Optional[Tuple[float, float, str]]:
    """
    Truy van toa do GPS chinh xac den tung so nha / ten duong / dia danh tai Viet Nam
    thong qua ArcGIS World Geocoding Service.
    """
    try:
        q = urllib.parse.quote(query_str)
        url = (
            f"https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/"
            f"findAddressCandidates?f=json&maxLocations=1&countryCode=VNM&SingleLine={q}"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/2.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            cands = data.get("candidates", [])
            if cands and float(cands[0].get("score", 0)) >= min_score:
                loc_xy = cands[0]["location"]
                return float(loc_xy["y"]), float(loc_xy["x"]), cands[0].get("address", query_str)
    except Exception:
        pass
    return None


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
            f"Tọa độ GPS thực tế ({round(float(start_lat), 5)}, {round(float(start_lng), 5)}) - {label}"
        )

    lower = label.lower()
    exact_city_aliases = {
        "tp. hồ chí minh": "hồ chí minh",
        "tp hồ chí minh": "hồ chí minh",
        "thành phố hồ chí minh": "hồ chí minh",
        "tp.hcm": "hồ chí minh",
        "tphcm": "hồ chí minh",
        "hồ chí minh": "hồ chí minh",
        "sài gòn": "sài gòn",
        "thủ đức": "thủ đức",
        "tp. thủ đức": "thủ đức",
        "hà nội": "hà nội",
        "tp. hà nội": "hà nội",
        "đà nẵng": "đà nẵng",
        "tp. đà nẵng": "đà nẵng",
        "cần thơ": "cần thơ",
        "tp. cần thơ": "cần thơ",
        "bình dương": "bình dương",
        "biên hòa": "biên hòa",
        "đồng nai": "đồng nai",
        "hải phòng": "hải phòng",
        "vũng tàu": "vũng tàu",
        "tp. vũng tàu": "vũng tàu",
        "tây ninh": "tây ninh",
        "tp. tây ninh": "tây ninh",
        "đà lạt": "đà lạt",
        "tp. đà lạt": "đà lạt",
        "pleiku": "pleiku",
        "phú quốc": "phú quốc",
        "nha trang": "nha trang",
        "bến tre": "bến tre",
        "hà giang": "hà giang",
    }
    if lower in exact_city_aliases:
        lat, lng, addr = CITY_COORDINATES[exact_city_aliases[lower]]
        return (
            f"Điểm xuất phát: Vị trí hiện tại ({label})",
            lat,
            lng,
            addr
        )

    # 1. Geocode truc tiep tren Google Maps Embed neu nguoi dung nhap dia chi / quan / huyen / duong cu the
    gm_res = _google_maps_geocode(f"{label}, Việt Nam", max_span=25000.0)
    if gm_res:
        return (
            f"Điểm xuất phát: {label}",
            gm_res[0],
            gm_res[1],
            gm_res[2] or label
        )

    # 2. Geocode bang ArcGIS World Geocoder
    arc_res = _arcgis_geocode(f"{label}, Vietnam", min_score=80.0)
    if arc_res:
        return (
            f"Điểm xuất phát: {label}",
            arc_res[0],
            arc_res[1],
            arc_res[2]
        )

    # 2. Thu geocode bang OpenStreetMap Nominatim
    try:
        q = urllib.parse.quote(f"{label}, Vietnam")
        url = f"https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/2.0"})
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

    for key, (lat, lng, addr) in CITY_COORDINATES.items():
        if key in lower:
            return (
                f"Điểm xuất phát: Vị trí hiện tại ({label})",
                lat,
                lng,
                addr
            )

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
    address: Optional[str] = None,
) -> Tuple[float, float, str, bool]:
    """
    Kiem chung toa do GPS va dia chi that cua dia diem moi truc tiep tren Google Maps Embed Engine:
    - Uu tien 1: Google Maps Embed theo Ten dia diem + Ten tinh (khong de dia chi bia cua AI lam lech).
    - Uu tien 2: Google Maps Embed theo Ten dia diem + Dia chi + Ten tinh.
    - Uu tien 3: OpenStreetMap Nominatim.
    - Tra ve (lat, lng, verified_address, is_verified_real).
    """
    p_lat = province.latitude or 10.7769
    p_lng = province.longitude or 106.7009
    clean_search = loc_name.split("(")[0].strip()
    clean_addr = (address or "").split("(")[0].strip()

    gm_queries = [f"{clean_search}, {province.name}"]
    if clean_addr and len(clean_addr) > 4:
        gm_queries.append(f"{clean_search}, {clean_addr}, {province.name}")

    for q_str in gm_queries:
        gm_res = _google_maps_geocode(q_str, ref_lat=p_lat, ref_lng=p_lng, max_dist_km=50.0, max_span=4500.0)
        if gm_res:
            return gm_res[0], gm_res[1], (gm_res[2] or clean_addr or province.name), True

    # OpenStreetMap Nominatim fallback
    try:
        q = urllib.parse.quote(f"{clean_search}, {province.name}, Vietnam")
        url = f"https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=vn&q={q}"
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/2.0"})
        with urllib.request.urlopen(req, timeout=2.5) as resp:
            results = json.loads(resp.read().decode("utf-8"))
            if results:
                g_lat = float(results[0]["lat"])
                g_lng = float(results[0]["lon"])
                if calculate_distance(p_lat, p_lng, g_lat, g_lng) <= 50.0:
                    disp = results[0].get("display_name", clean_addr or province.name)
                    return round(g_lat, 6), round(g_lng, 6), disp, True
    except Exception:
        pass

    if raw_lat and raw_lng:
        try:
            r_lat = float(raw_lat)
            r_lng = float(raw_lng)
            if calculate_distance(p_lat, p_lng, r_lat, r_lng) <= 35.0:
                return round(r_lat, 6), round(r_lng, 6), (clean_addr or province.name), False
        except Exception:
            pass

    return p_lat, p_lng, (clean_addr or province.name), False


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

    # Luon su dung Gemini AI de thiet ke lich trinh ca nhan hoa (khong dap khuon dat san)
    use_ai_dynamic = True

    if use_ai_dynamic:
        ai_dest = target_dest or (province.name if province else "Tây Ninh")
        enriched_prompt = user_prompt or "Khám phá danh lam thắng cảnh, ẩm thực đặc sản và quán cà phê đẹp"

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

        # Lay Diem so 1 (Xuat phat)
        dep_loc = _get_or_create_departure_location(db, province.id, dep_name, dep_lat, dep_lng, dep_addr)

        # Lay Diem so 2 (Khach san / Homestay / Resort): Uu tien khach san do Gemini AI de xuat neu xac thuc duoc tren Google Maps
        hotel_loc = None
        for d_chk in dynamic_data.get("days", []):
            for it_chk in d_chk.get("items", []):
                if it_chk.get("category") == "hotel" and (it_chk.get("location_name") or "").strip():
                    h_name = it_chk["location_name"].strip()
                    matched_h = _match_verified_db_location(h_name, [l for l in existing_locs if l.category == "hotel"])
                    if matched_h:
                        hotel_loc = matched_h
                        break
                    h_lat, h_lng, h_addr, h_ok = _verify_or_geocode_coords(
                        h_name, province, it_chk.get("latitude"), it_chk.get("longitude"), it_chk.get("address")
                    )
                    if h_ok:
                        h_img = resolve_real_image(h_name, "hotel", it_chk.get("image_url"))
                        hotel_loc = Location(
                            province_id=province.id,
                            name=h_name,
                            category="hotel",
                            description=it_chk.get("note", f"Lưu trú và nhận phòng tại {h_name}."),
                            address=h_addr,
                            latitude=h_lat,
                            longitude=h_lng,
                            image_url=h_img,
                            avg_cost_vnd=int(it_chk.get("avg_cost_vnd") or 400000),
                            rating=4.8,
                            tips=it_chk.get("tips", "Có thể gửi hành lý tại lễ tân nếu đến sớm trước giờ check-in 14h00."),
                            transport_info=it_chk.get("transport_info", "Thuận tiện di chuyển đến các điểm tham quan trung tâm.")
                        )
                        db.add(hotel_loc)
                        db.commit()
                        db.refresh(hotel_loc)
                        existing_locs.append(hotel_loc)
                        break
            if hotel_loc:
                break

        if not hotel_loc:
            hotel_loc = _get_central_hotel_for_province(db, province, existing_locs)

        days_result: List[ItineraryDayResponse] = []
        total_cost = 0
        used_loc_ids = {hotel_loc.id}

        def pick_nearest_verified(
            ref_coords: Optional[Tuple[float, float]],
            preferred_cat: str,
            allow_far: bool = False,
        ) -> Optional[Location]:
            unused = [l for l in existing_locs if l.id not in used_loc_ids and l.category != "hotel"]
            if not unused:
                return None
            if not allow_far:
                near_hotel = [
                    l for l in unused
                    if calculate_distance(hotel_loc.latitude, hotel_loc.longitude, l.latitude, l.longitude) <= 25.0
                ]
                if near_hotel:
                    unused = near_hotel
            same_cat = [l for l in unused if l.category == preferred_cat]
            pool = same_cat if same_cat else unused
            if ref_coords:
                pool.sort(key=lambda x: calculate_distance(ref_coords[0], ref_coords[1], x.latitude, x.longitude))
            return pool[0]

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

                # Điểm 2: Di chuyển tới Khách sạn nhận phòng / gửi đồ
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
                    any(bad in lower_name for bad in ["xuất phát", "khởi hành", "di chuyển", "trở về", "gợi ý:", "nhận phòng", "check-in khách sạn", "bến xe"])
                    or lower_name in [start_clean, dest_clean, "tp. hồ chí minh", "hồ chí minh", "sài gòn", "hà nội", "đà nẵng"]
                    or itm.get("category") == "hotel"
                ):
                    continue

                loc_cat = itm.get("category", "tourist_spot")
                if loc_cat not in ["tourist_spot", "restaurant", "cafe", "beach", "shopping", "hotel"]:
                    loc_cat = "tourist_spot"

                db_loc = _match_verified_db_location(loc_name, existing_locs)
                is_final_day = (day_number == num_days)

                if db_loc and db_loc.id in used_loc_ids:
                    db_loc = pick_nearest_verified(prev_loc_coords, loc_cat, allow_far=is_final_day)
                    if not db_loc:
                        continue

                if not db_loc:
                    # Xac thuc toa do va dia chi that cua dia diem moi do Gemini AI de xuat truc tiep tren Google Maps
                    verified_lat, verified_lng, verified_addr, is_verified_real = _verify_or_geocode_coords(
                        loc_name, province, itm.get("latitude"), itm.get("longitude"), itm.get("address")
                    )
                    if is_verified_real:
                        real_img = resolve_real_image(loc_name, loc_cat, itm.get("image_url"))
                        db_loc = Location(
                            province_id=province.id,
                            name=loc_name,
                            category=loc_cat,
                            description=itm.get("note", ""),
                            address=verified_addr,
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
                        # Neu AI sinh ra ten quan ao khong ton tai tren Google Maps thi thay bang dia diem that gan nhat
                        db_loc = pick_nearest_verified(prev_loc_coords, loc_cat, allow_far=is_final_day)
                        if not db_loc:
                            continue
                else:
                    db_loc.image_url = resolve_real_image(db_loc.name, db_loc.category, db_loc.image_url)
                    db.commit()

                used_loc_ids.add(db_loc.id)

                existing_menu_names = {
                    mi.name.strip().lower()
                    for mi in db.query(MenuItem).filter(MenuItem.location_id == db_loc.id).all()
                    if mi.name
                }
                if not existing_menu_names:
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
                elif day_number > 1 and order == 2 and time_slot_str <= "08:00":
                    time_slot_str = "08:30"

                note_text = itm.get("note") if _match_verified_db_location(loc_name, [db_loc]) else db_loc.description
                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=day_number,
                    time_slot=time_slot_str,
                    order_in_day=order,
                    note=note_text or db_loc.description,
                    travel_distance_km=dist,
                    travel_time_minutes=time_m,
                    location=LocationResponse.from_orm(db_loc)
                ))
                total_cost += db_loc.avg_cost_vnd
                prev_loc_coords = cur_coords
                order += 1

            # Dam bao moi ngay luon du cac diem tham quan / an uong neu AI tra ve thieu
            default_slots = [("09:30", "tourist_spot"), ("12:00", "restaurant"), ("15:00", "tourist_spot"), ("17:00", "cafe"), ("19:00", "restaurant")]
            while len(day_items) < (6 if day_number == 1 else 5):
                slot_idx = min(len(day_items) - (2 if day_number == 1 else 1), len(default_slots) - 1)
                t_slot, pref_cat = default_slots[max(0, slot_idx)]
                extra_loc = pick_nearest_verified(prev_loc_coords, pref_cat, allow_far=(day_number == num_days))
                if not extra_loc:
                    break
                used_loc_ids.add(extra_loc.id)
                cur_coords = (extra_loc.latitude, extra_loc.longitude)
                dist = calculate_distance(prev_loc_coords[0], prev_loc_coords[1], cur_coords[0], cur_coords[1]) if prev_loc_coords else 0.0
                time_m = estimate_travel_time(dist)
                day_items.append(ItineraryItemResponse(
                    id=order,
                    day_number=day_number,
                    time_slot=t_slot,
                    order_in_day=order,
                    note=extra_loc.description,
                    travel_distance_km=dist,
                    travel_time_minutes=time_m,
                    location=LocationResponse.from_orm(extra_loc)
                ))
                total_cost += extra_loc.avg_cost_vnd
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
