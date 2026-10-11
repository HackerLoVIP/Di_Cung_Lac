from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.wishlist import Wishlist
from app.models.location import Location
from app.models.user import User
from app.services.auth import get_current_user
from app.schemas.location import LocationListResponse

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])

@router.post("/{location_id}")
def toggle_wishlist(
    location_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loc = db.query(Location).filter(Location.id == location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Khong tim thay dia diem")

    item = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id,
        Wishlist.location_id == location_id
    ).first()

    if item:
        db.delete(item)
        db.commit()
        return {"saved": False, "message": "Da bo khoi danh sach yeu thich"}
    else:
        new_item = Wishlist(user_id=current_user.id, location_id=location_id)
        db.add(new_item)
        db.commit()
        return {"saved": True, "message": "Da them vao danh sach yeu thich"}

@router.get("")
def get_my_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items = db.query(Wishlist).filter(Wishlist.user_id == current_user.id).all()
    results = []
    for item in items:
        if item.location:
            results.append(LocationListResponse.from_orm(item.location))
    return results
