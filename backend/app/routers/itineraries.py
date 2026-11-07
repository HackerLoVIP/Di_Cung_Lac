import json
import secrets
import urllib.parse
import urllib.request
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.itinerary import Itinerary, ItineraryItem
from app.models.location import Location
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryGenerateRequest,
    ItineraryResponse,
)
from app.schemas.location import LocationResponse
from app.schemas.province import ProvinceResponse
from app.services.auth import get_optional_current_user
from app.services.planner import (
    generate_smart_itinerary,
    calculate_distance,
    estimate_travel_time,
    resolve_departure_point,
    _google_maps_geocode,
)

router = APIRouter(prefix="/api/itineraries", tags=["Itineraries"])


def _reverse_geocode_vi(lat: float, lng: float) -> Optional[str]:
    try:
        url = (
            f"https://nominatim.openstreetmap.org/reverse?format=json"
            f"&lat={lat}&lon={lng}&zoom=17&accept-language=vi"
        )
        req = urllib.request.Request(url, headers={"User-Agent": "DiCungLacTravelApp/2.0"})
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            addr = data.get("address", {})
            house = addr.get("house_number", "")
            road = " ".join([x for x in [house, addr.get("road", "")] if x]).strip()
            suburb = (
                addr.get("suburb")
                or addr.get("quarter")
                or addr.get("neighbourhood")
                or addr.get("village")
                or ""
            )
            district = (
                addr.get("city_district")
                or addr.get("district")
                or addr.get("county")
                or addr.get("town")
                or ""
            )
            city = addr.get("city") or addr.get("state") or addr.get("province") or ""
            parts = [p for p in [road, suburb, district, city] if p]
            if parts:
                return ", ".join(parts)
    except Exception:
        pass
    return None


@router.get("/detect-location")
def detect_user_location():
    """
    Dò tìm vị trí thực tế qua hạ tầng mạng / IP Geolocation + Reverse Geocoding tiếng Việt
    khi trình duyệt hoặc Windows tắt dịch vụ GPS phần cứng.
    """
    lat, lng, city_label = None, None, None

    # 1. Thử ipwho.is
    try:
        req = urllib.request.Request("https://ipwho.is/", headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4.0) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            if data.get("success") and data.get("latitude") and data.get("longitude"):
                lat = float(data["latitude"])
                lng = float(data["longitude"])
                city_label = data.get("city") or data.get("region")
    except Exception:
        pass

    # 2. Dự phòng ip-api.com
    if lat is None or lng is None:
        try:
            req = urllib.request.Request(
                "http://ip-api.com/json/?fields=status,country,regionName,city,district,lat,lon",
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=4.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("status") == "success" and data.get("lat") and data.get("lon"):
                    lat = float(data["lat"])
                    lng = float(data["lon"])
                    city_label = data.get("city") or data.get("regionName")
        except Exception:
            pass

    if lat is not None and lng is not None:
        vi_addr = _reverse_geocode_vi(lat, lng)
        if not vi_addr:
            if city_label and "ho chi minh" in city_label.lower():
                vi_addr = "TP. Hồ Chí Minh"
            elif city_label and "hanoi" in city_label.lower():
                vi_addr = "Hà Nội"
            else:
                vi_addr = city_label or "TP. Hồ Chí Minh"
        return {
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "address": vi_addr,
            "source": "network_gps",
        }

    return {
        "latitude": 10.7769,
        "longitude": 106.7009,
        "address": "Quận 1, TP. Hồ Chí Minh",
        "source": "default",
    }


@router.get("/geocode")
def geocode_address(q: str = Query(..., description="Địa chỉ, tên đường, phường/quận hoặc địa danh")):
    """
    Xác thực tọa độ E7 chính xác của một địa chỉ bất kỳ trên Google Maps.
    """
    query_clean = q.strip()
    if not query_clean:
        raise HTTPException(status_code=400, detail="Vui lòng nhập địa chỉ cần định vị")

    gm_res = _google_maps_geocode(f"{query_clean}, Việt Nam", max_span=30000.0)
    if gm_res:
        lat, lng, real_addr = gm_res
        label = real_addr if real_addr and len(real_addr) > 4 else query_clean
        return {
            "latitude": round(lat, 6),
            "longitude": round(lng, 6),
            "address": label,
            "verified": True,
        }

    dep_name, dep_lat, dep_lng, dep_addr = resolve_departure_point(query_clean, None, None)
    return {
        "latitude": round(dep_lat, 6),
        "longitude": round(dep_lng, 6),
        "address": dep_addr or query_clean,
        "verified": True,
    }


@router.post("/generate", response_model=ItineraryResponse)
def generate_itinerary(req: ItineraryGenerateRequest, db: Session = Depends(get_db)):
    try:
        itinerary = generate_smart_itinerary(
            province_id=req.province_id,
            destination=req.destination,
            start_location=req.start_location,
            start_lat=req.start_lat,
            start_lng=req.start_lng,
            num_days=req.num_days,
            num_nights=req.num_nights,
            user_prompt=req.prompt,
            db=db,
        )
        return itinerary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=ItineraryResponse)
def save_itinerary(
    data: ItineraryResponse,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    share_code = secrets.token_urlsafe(8)
    new_itinerary = Itinerary(
        user_id=current_user.id if current_user else None,
        province_id=data.province.id,
        title=data.title,
        num_days=data.num_days,
        num_nights=data.num_nights,
        status="planned",
        share_code=share_code,
    )
    db.add(new_itinerary)
    db.flush()

    for day in data.days:
        for item in day.items:
            loc_id = item.location.id
            # Nếu Điểm số 1 (Xuất phát) đã được người dùng cập nhật tọa độ/địa chỉ mới trên bản đồ, lưu đúng tọa độ mới đó
            if day.day_number == 1 and item.order_in_day == 1 and item.location:
                db_loc = db.query(Location).filter(Location.id == loc_id).first()
                if db_loc and "điểm xuất phát" in (db_loc.name or "").lower():
                    db_loc.name = item.location.name
                    db_loc.address = item.location.address
                    db_loc.latitude = item.location.latitude
                    db_loc.longitude = item.location.longitude
                    db.flush()

            db_item = ItineraryItem(
                itinerary_id=new_itinerary.id,
                location_id=loc_id,
                day_number=day.day_number,
                time_slot=item.time_slot,
                order_in_day=item.order_in_day,
                note=item.note,
                travel_distance_km=item.travel_distance_km or 0.0,
                travel_time_minutes=item.travel_time_minutes or 0,
            )
            db.add(db_item)

    db.commit()
    db.refresh(new_itinerary)
    data.id = new_itinerary.id
    data.share_code = share_code
    return data


@router.get("/my")
def get_my_trips(
    ids: Optional[str] = Query(None, description="Danh sách ID lịch trình đã lưu trên thiết bị"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    id_list: List[int] = []
    if ids:
        for raw_id in ids.split(","):
            raw_id = raw_id.strip()
            if raw_id.isdigit():
                id_list.append(int(raw_id))

    if current_user:
        if id_list:
            trips = (
                db.query(Itinerary)
                .filter((Itinerary.user_id == current_user.id) | (Itinerary.id.in_(id_list)))
                .order_by(Itinerary.created_at.desc())
                .all()
            )
        else:
            trips = (
                db.query(Itinerary)
                .filter(Itinerary.user_id == current_user.id)
                .order_by(Itinerary.created_at.desc())
                .all()
            )
    else:
        if id_list:
            trips = (
                db.query(Itinerary)
                .filter(Itinerary.id.in_(id_list))
                .order_by(Itinerary.created_at.desc())
                .all()
            )
        else:
            trips = (
                db.query(Itinerary)
                .filter(Itinerary.user_id.is_(None))
                .order_by(Itinerary.created_at.desc())
                .limit(20)
                .all()
            )

    results = []
    for t in trips:
        trip_cost = (t.num_days or 1) * 100000
        for item in t.items:
            if item.location and item.location.avg_cost_vnd:
                trip_cost += item.location.avg_cost_vnd
        results.append(
            {
                "id": t.id,
                "title": t.title,
                "province_name": t.province.name if t.province else "",
                "province_image": t.province.image_url if t.province else "",
                "num_days": t.num_days,
                "num_nights": t.num_nights,
                "total_cost": trip_cost,
                "stops_count": len(t.items),
                "status": t.status,
                "created_at": t.created_at,
                "share_code": t.share_code,
            }
        )
    return results


@router.get("/{itinerary_id}")
def get_itinerary_detail(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình")

    days_dict = {}
    total_cost = 0

    sorted_items = sorted(itinerary.items, key=lambda x: (x.day_number, x.order_in_day))
    for item in sorted_items:
        d = item.day_number
        if d not in days_dict:
            days_dict[d] = []
        loc = item.location
        loc_res = LocationResponse.from_orm(loc) if loc else None
        if loc:
            total_cost += loc.avg_cost_vnd

        days_dict[d].append(
            {
                "id": item.id,
                "day_number": item.day_number,
                "time_slot": item.time_slot,
                "order_in_day": item.order_in_day,
                "note": item.note,
                "location": loc_res,
            }
        )

    days_list = []
    prov_name = itinerary.province.name if itinerary.province else "Điểm đến"
    for d_num in sorted(days_dict.keys()):
        day_items = days_dict[d_num]
        prev_coords = None
        for itm in day_items:
            loc_obj = itm.get("location")
            dist = 0.0
            time_m = 0
            if loc_obj and prev_coords:
                dist = calculate_distance(
                    prev_coords[0], prev_coords[1], loc_obj.latitude, loc_obj.longitude
                )
                time_m = estimate_travel_time(dist)
            itm["travel_distance_km"] = dist
            itm["travel_time_minutes"] = time_m
            if loc_obj:
                prev_coords = (loc_obj.latitude, loc_obj.longitude)

        first_spot = (
            day_items[0]["location"].name
            if (day_items and day_items[0].get("location"))
            else prov_name
        )
        days_list.append(
            {
                "day_number": d_num,
                "title": f"Ngày {d_num}: Khám phá {first_spot} & Trải nghiệm {prov_name}",
                "items": day_items,
            }
        )

    total_cost += itinerary.num_days * 100000

    return {
        "id": itinerary.id,
        "title": itinerary.title,
        "province": ProvinceResponse.from_orm(itinerary.province),
        "num_days": itinerary.num_days,
        "num_nights": itinerary.num_nights,
        "status": itinerary.status,
        "total_cost": total_cost,
        "share_code": itinerary.share_code,
        "days": days_list,
        "created_at": itinerary.created_at,
    }


@router.delete("/{itinerary_id}")
def delete_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user),
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình")
    if itinerary.user_id and current_user and itinerary.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Bạn không có quyền xóa lịch trình này")
    db.delete(itinerary)
    db.commit()
    return {"message": "Đã xóa lịch trình thành công"}


@router.get("/{itinerary_id}/costs")
def get_cost_breakdown(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình")

    breakdown = {
        "restaurant": 0,
        "tourist_spot": 0,
        "cafe": 0,
        "transport": itinerary.num_days * 100000,
        "shopping": 0,
        "other": 0,
    }

    for item in itinerary.items:
        if item.location:
            cat = item.location.category
            cost = item.location.avg_cost_vnd
            if cat in breakdown:
                breakdown[cat] += cost
            else:
                breakdown["other"] += cost

    total = sum(breakdown.values())
    return {
        "breakdown": breakdown,
        "total_cost": total,
    }
