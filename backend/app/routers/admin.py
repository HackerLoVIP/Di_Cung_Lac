from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User
from app.models.location import Location, MenuItem
from app.models.province import Province
from app.models.itinerary import Itinerary
from app.models.review import Review
from app.services.auth import get_current_user

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
    province_id: int
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

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db), admin: User = Depends(verify_admin)):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_itineraries = db.query(func.count(Itinerary.id)).scalar() or 0
    total_locations = db.query(func.count(Location.id)).scalar() or 0
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    total_provinces = db.query(func.count(Province.id)).scalar() or 0

    recent_trips = db.query(Itinerary).order_by(Itinerary.created_at.desc()).limit(5).all()
    recent_reviews = db.query(Review).order_by(Review.created_at.desc()).limit(5).all()

    return {
        "stats": {
            "users": total_users,
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
    new_loc = Location(
        province_id=data.province_id,
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
