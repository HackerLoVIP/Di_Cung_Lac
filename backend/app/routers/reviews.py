from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.review import Review
from app.models.location import Location
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/reviews", tags=["Reviews"])

class ReviewCreate(BaseModel):
    location_id: int
    rating: float
    comment: str
    image_url: Optional[str] = None

@router.post("", status_code=status.HTTP_201_CREATED)
def create_review(
    review_in: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    loc = db.query(Location).filter(Location.id == review_in.location_id).first()
    if not loc:
        raise HTTPException(status_code=404, detail="Khong tim thay dia diem")

    new_review = Review(
        user_id=current_user.id,
        location_id=review_in.location_id,
        rating=review_in.rating,
        comment=review_in.comment,
        image_url=review_in.image_url
    )
    db.add(new_review)
    
    # Cap nhat diem rating trung binh cua dia diem
    all_reviews = db.query(Review).filter(Review.location_id == loc.id).all()
    total_rating = sum([r.rating for r in all_reviews]) + review_in.rating
    loc.rating = round(total_rating / (len(all_reviews) + 1), 1)

    db.commit()
    return {"message": "Da gui danh gia thanh cong"}

@router.get("/location/{location_id}")
def get_location_reviews(location_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Review).filter(Review.location_id == location_id).order_by(Review.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "rating": r.rating,
            "comment": r.comment,
            "image_url": r.image_url,
            "user_name": r.user.full_name if r.user else "Nguoi dung an danh",
            "created_at": r.created_at
        }
        for r in reviews
    ]
