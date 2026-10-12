import secrets
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.itinerary import Itinerary, ItineraryItem
from app.models.location import Location
from app.models.province import Province
from app.models.user import User
from app.schemas.itinerary import (
    ItineraryGenerateRequest,
    ItineraryResponse,
    ItineraryDayResponse,
    ItineraryItemResponse
)
from app.schemas.location import LocationResponse
from app.schemas.province import ProvinceResponse
from app.services.auth import get_current_user
from app.services.planner import generate_smart_itinerary

router = APIRouter(prefix="/api/itineraries", tags=["Itineraries"])

@router.post("/generate", response_model=ItineraryResponse)
def generate_itinerary(req: ItineraryGenerateRequest, db: Session = Depends(get_db)):
    try:
        itinerary = generate_smart_itinerary(
            province_id=req.province_id,
            destination=req.destination,
            start_location=req.start_location,
            num_days=req.num_days,
            num_nights=req.num_nights,
            user_prompt=req.prompt,
            db=db
        )
        return itinerary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("", response_model=ItineraryResponse)
def save_itinerary(
    data: ItineraryResponse,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    share_code = secrets.token_urlsafe(8)
    new_itinerary = Itinerary(
        user_id=current_user.id,
        province_id=data.province.id,
        title=data.title,
        num_days=data.num_days,
        num_nights=data.num_nights,
        status="planned",
        share_code=share_code
    )
    db.add(new_itinerary)
    db.flush()

    for day in data.days:
        for item in day.items:
            db_item = ItineraryItem(
                itinerary_id=new_itinerary.id,
                location_id=item.location.id,
                day_number=day.day_number,
                time_slot=item.time_slot,
                order_in_day=item.order_in_day,
                note=item.note
            )
            db.add(db_item)

    db.commit()
    db.refresh(new_itinerary)
    data.id = new_itinerary.id
    data.share_code = share_code
    return data

@router.get("/my")
def get_my_trips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    trips = db.query(Itinerary).filter(Itinerary.user_id == current_user.id).order_by(Itinerary.created_at.desc()).all()
    results = []
    for t in trips:
        results.append({
            "id": t.id,
            "title": t.title,
            "province_name": t.province.name if t.province else "",
            "province_image": t.province.image_url if t.province else "",
            "num_days": t.num_days,
            "num_nights": t.num_nights,
            "status": t.status,
            "created_at": t.created_at,
            "share_code": t.share_code
        })
    return results

@router.get("/{itinerary_id}")
def get_itinerary_detail(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Khong tim thay lich trinh")

    days_dict = {}
    total_cost = 0

    for item in itinerary.items:
        d = item.day_number
        if d not in days_dict:
            days_dict[d] = []
        loc = item.location
        loc_res = LocationResponse.from_orm(loc) if loc else None
        if loc:
            total_cost += loc.avg_cost_vnd
            
        days_dict[d].append({
            "id": item.id,
            "day_number": item.day_number,
            "time_slot": item.time_slot,
            "order_in_day": item.order_in_day,
            "note": item.note,
            "location": loc_res
        })

    days_list = []
    for d_num in sorted(days_dict.keys()):
        days_list.append({
            "day_number": d_num,
            "title": f"Ngày {d_num}",
            "items": days_dict[d_num]
        })

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
        "created_at": itinerary.created_at
    }

@router.delete("/{itinerary_id}")
def delete_itinerary(
    itinerary_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id, Itinerary.user_id == current_user.id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Khong tim thay lich trinh hoac ban khong co quyen xoa")
    db.delete(itinerary)
    db.commit()
    return {"message": "Da xoa lich trinh thanh cong"}

@router.get("/{itinerary_id}/costs")
def get_cost_breakdown(itinerary_id: int, db: Session = Depends(get_db)):
    itinerary = db.query(Itinerary).filter(Itinerary.id == itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Khong tim thay lich trinh")

    breakdown = {
        "restaurant": 0,
        "tourist_spot": 0,
        "cafe": 0,
        "transport": itinerary.num_days * 100000,
        "shopping": 0,
        "other": 0
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
        "total_cost": total
    }
