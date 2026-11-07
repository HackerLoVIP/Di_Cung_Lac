import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.location import Location, MenuItem
from app.models.province import Province
from app.models.itinerary import Itinerary, ItineraryItem
from app.models.review import Review
from app.services.auth import get_current_user, get_password_hash

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

def verify_admin(current_user: User = Depends(get_current_user)):
    """Kiem tra quyen admin hoac cap quyen cho lead dev de kiem thu"""
    allowed_emails = ["haidangdmc123@gmail.com", "tronghieu3443@gmail.com", "admin@dicunglac.vn"]
    if current_user.role != "admin" and current_user.email not in allowed_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bạn không có quyền quản trị viên (Admin) để thực hiện thao tác này"
        )
    return current_user

class LocationCreateAdmin(BaseModel):
    province_id: Optional[int] = None
    province_name: Optional[str] = None
    name: str
    category: str
    address: str
    latitude: float
    longitude: float
    avg_cost_vnd: int = 50000
    description: Optional[str] = None
    tips: Optional[str] = None
    transport_info: Optional[str] = None
    image_url: Optional[str] = None
    menu_items: Optional[List[dict]] = []

class UserRoleUpdateAdmin(BaseModel):
    role: str  # "user" or "admin"

class UserVipUpdateAdmin(BaseModel):
    is_vip: int  # 0 or 1
    days: int = 365  # 7, 30, 365

class UserCreateAdmin(BaseModel):
    email: str
    full_name: str
    password: str = "123456"
    role: str = "user"
    is_vip: int = 0
    vip_days: int = 365

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    vip_users = db.query(func.count(User.id)).filter(User.is_vip == 1).scalar() or 0
    total_itineraries = db.query(func.count(Itinerary.id)).scalar() or 0
    total_locations = db.query(func.count(Location.id)).scalar() or 0
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    total_provinces = db.query(func.count(Province.id)).scalar() or 0

    recent_trips = db.query(Itinerary).order_by(Itinerary.created_at.desc()).limit(5).all()
    recent_reviews = db.query(Review).order_by(Review.created_at.desc()).limit(5).all()

    return {
        "stats": {
            "users": total_users,
            "vip_users": vip_users,
            "itineraries": total_itineraries,
            "locations": total_locations,
            "reviews": total_reviews,
            "provinces": total_provinces
        },
        "recent_trips": [
            {
                "id": t.id,
                "title": t.title,
                "user_id": t.user_id,
                "created_at": t.created_at
            }
            for t in recent_trips
        ],
        "recent_reviews": [
            {
                "id": r.id,
                "location_name": r.location.name if r.location else "",
                "user_name": r.user.full_name if r.user else "Ẩn danh",
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at
            }
            for r in recent_reviews
        ]
    }

@router.get("/users")
def list_users(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    users = db.query(User).order_by(User.id.asc()).all()
    result = []
    for u in users:
        trips_count = db.query(func.count(Itinerary.id)).filter(Itinerary.user_id == u.id).scalar() or 0
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "avatar_url": u.avatar_url,
            "role": u.role,
            "is_vip": u.is_vip,
            "vip_expiry": u.vip_expiry,
            "created_at": u.created_at,
            "trips_count": trips_count,
        })
    return result

@router.post("/users", status_code=status.HTTP_201_CREATED)
def create_user_by_admin(data: UserCreateAdmin, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    existing = db.query(User).filter(User.email == data.email.strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email này đã tồn tại trên hệ thống")
    expiry = None
    if data.is_vip == 1:
        expiry = datetime.datetime.now() + datetime.timedelta(days=max(1, data.vip_days))
    new_u = User(
        email=data.email.strip(),
        full_name=data.full_name.strip(),
        password_hash=get_password_hash(data.password or "123456"),
        role=data.role if data.role in ["user", "admin"] else "user",
        is_vip=1 if data.is_vip else 0,
        vip_expiry=expiry,
    )
    db.add(new_u)
    db.commit()
    db.refresh(new_u)
    return {"message": "Đã tạo tài khoản người dùng mới", "id": new_u.id}

@router.put("/users/{user_id}/role")
def update_user_role(
    user_id: int,
    data: UserRoleUpdateAdmin,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_admin)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    if data.role not in ["user", "admin"]:
        raise HTTPException(status_code=400, detail="Role không hợp lệ (chỉ nhận 'user' hoặc 'admin')")
    u.role = data.role
    db.commit()
    db.refresh(u)
    return {"message": f"Đã cập nhật vai trò của {u.email} thành {u.role.upper()}", "role": u.role}

@router.put("/users/{user_id}/vip")
def update_user_vip(
    user_id: int,
    data: UserVipUpdateAdmin,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_admin)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    if data.is_vip:
        u.is_vip = 1
        days = max(1, min(365, data.days))
        u.vip_expiry = datetime.datetime.now() + datetime.timedelta(days=days)
        msg = f"Đã nâng cấp VIP ({days} ngày) cho {u.email}"
    else:
        u.is_vip = 0
        u.vip_expiry = None
        msg = f"Đã chuyển {u.email} về tài khoản Thường"
    db.commit()
    db.refresh(u)
    return {"message": msg, "is_vip": u.is_vip, "vip_expiry": u.vip_expiry}

@router.delete("/users/{user_id}")
def delete_user_by_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(verify_admin)
):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    if u.id == admin.id or u.email == "admin@dicunglac.vn":
        raise HTTPException(status_code=400, detail="Không thể xóa tài khoản Quản trị viên đang đăng nhập hoặc Admin gốc")
    # Xoa cac du lieu lien quan cua user
    user_trips = db.query(Itinerary).filter(Itinerary.user_id == u.id).all()
    for t in user_trips:
        db.query(ItineraryItem).filter(ItineraryItem.itinerary_id == t.id).delete()
        db.delete(t)
    db.query(Review).filter(Review.user_id == u.id).delete()
    db.delete(u)
    db.commit()
    return {"message": f"Đã xóa người dùng {u.email}"}

@router.get("/itineraries")
def list_all_itineraries(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    trips = db.query(Itinerary).order_by(Itinerary.created_at.desc()).all()
    result = []
    for t in trips:
        u = db.query(User).filter(User.id == t.user_id).first() if t.user_id else None
        result.append({
            "id": t.id,
            "title": t.title,
            "province_name": t.province.name if t.province else "",
            "num_days": t.num_days,
            "num_nights": t.num_nights,
            "user_id": t.user_id,
            "user_name": u.full_name if u else "Khách",
            "user_email": u.email if u else "",
            "stops_count": len(t.items) if t.items else 0,
            "created_at": t.created_at,
        })
    return result

@router.delete("/itineraries/{itinerary_id}")
def delete_itinerary_by_admin(itinerary_id: int, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    t = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình")
    db.query(ItineraryItem).filter(ItineraryItem.itinerary_id == t.id).delete()
    db.delete(t)
    db.commit()
    return {"message": "Đã xóa lịch trình"}

@router.get("/locations")
def list_locations(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    locs = db.query(Location).order_by(Location.id.desc()).all()
    return [
        {
            "id": l.id,
            "name": l.name,
            "category": l.category,
            "province_name": l.province.name if l.province else "",
            "address": l.address,
            "latitude": l.latitude,
            "longitude": l.longitude,
            "avg_cost_vnd": l.avg_cost_vnd,
            "rating": l.rating,
            "tips": l.tips
        }
        for l in locs
    ]

@router.post("/locations", status_code=status.HTTP_201_CREATED)
def create_location(data: LocationCreateAdmin, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    pid = data.province_id
    if data.province_name and data.province_name.strip():
        pname = data.province_name.strip()
        prov = db.query(Province).filter(func.lower(Province.name) == pname.lower()).first()
        if not prov:
            slug = pname.lower().replace(" ", "-")
            prov = Province(
                name=pname,
                slug=slug,
                description=f"Điểm đến du lịch {pname}",
                image_url=data.image_url or "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"
            )
            db.add(prov)
            db.flush()
        pid = prov.id

    if not pid:
        pid = 1

    new_loc = Location(
        province_id=pid,
        name=data.name,
        category=data.category,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        avg_cost_vnd=data.avg_cost_vnd,
        description=data.description,
        tips=data.tips,
        transport_info=data.transport_info,
        image_url=data.image_url or "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        rating=5.0
    )
    db.add(new_loc)
    db.flush()

    if data.menu_items:
        for m in data.menu_items:
            db.add(MenuItem(
                location_id=new_loc.id,
                name=m.get("name", "Món ăn"),
                price_vnd=m.get("price_vnd", 30000),
                is_signature=True
            ))

    db.commit()
    db.refresh(new_loc)
    return {"message": "Đã tạo địa điểm thành công", "id": new_loc.id}

@router.delete("/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Không tìm thấy địa điểm")
    db.delete(loc)
    db.commit()
    return {"message": "Đã xoá địa điểm"}

@router.get("/reviews")
def list_all_reviews(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    reviews = db.query(Review).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "location_name": r.location.name if r.location else "",
            "user_name": r.user.full_name if r.user else "Ẩn danh",
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at
        }
        for r in reviews
    ]

@router.delete("/reviews/{review_id}")
def delete_review(review_id: int, db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    rev = db.query(Review).filter(Review.id == review_id).first()
    if not rev:
        raise HTTPException(status_code=404, detail="Không tìm thấy đánh giá")
    db.delete(rev)
    db.commit()
    return {"message": "Đã xoá đánh giá vi phạm"}
