from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.province import Province
from app.models.location import Location
from app.schemas.province import ProvinceResponse
from app.schemas.location import LocationListResponse

router = APIRouter(prefix="/api/provinces", tags=["Provinces"])

@router.get("", response_model=List[ProvinceResponse])
def get_provinces(db: Session = Depends(get_db)):
    return db.query(Province).all()

@router.get("/{province_id}", response_model=ProvinceResponse)
def get_province(province_id: int, db: Session = Depends(get_db)):
    province = db.query(Province).filter(Province.id == province_id).first()
    if not province:
        raise HTTPException(status_code=404, detail="Khong tim thay tinh thanh nay")
    return province

@router.get("/{province_id}/locations", response_model=List[LocationListResponse])
def get_locations_by_province(
    province_id: int,
    category: Optional[str] = Query(None, description="Loc theo danh muc"),
    db: Session = Depends(get_db)
):
    query = db.query(Location).filter(Location.province_id == province_id)
    if category and category != "all":
        query = query.filter(Location.category == category)
    return query.all()
