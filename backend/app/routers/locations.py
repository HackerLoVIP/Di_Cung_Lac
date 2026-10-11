from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.location import Location
from app.models.province import Province
from app.schemas.location import LocationResponse, LocationListResponse

router = APIRouter(prefix="/api/locations", tags=["Locations"])

@router.get("/search", response_model=List[LocationListResponse])
def search_locations(
    q: Optional[str] = Query(None, description="Tu khoa tim kiem"),
    category: Optional[str] = Query(None, description="Danh muc"),
    min_rating: Optional[float] = Query(None, description="Danh gia toi thieu"),
    max_cost: Optional[int] = Query(None, description="Chi phi toi da"),
    db: Session = Depends(get_db)
):
    query = db.query(Location)
    if q:
        query = query.filter(Location.name.ilike(f"%{q}%"))
    if category and category != "all":
        query = query.filter(Location.category == category)
    if min_rating is not None:
        query = query.filter(Location.rating >= min_rating)
    if max_cost is not None:
        query = query.filter(Location.avg_cost_vnd <= max_cost)
    return query.limit(50).all()

@router.get("/{location_id}", response_model=LocationResponse)
def get_location_detail(location_id: int, db: Session = Depends(get_db)):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Khong tim thay dia diem")
    
    # Gan ten tinh thanh vao response
    res = LocationResponse.from_orm(loc)
    if loc.province:
        res.province_name = loc.province.name
    return res
