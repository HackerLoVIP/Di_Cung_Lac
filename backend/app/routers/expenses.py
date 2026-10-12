from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.expense import Expense
from app.models.itinerary import Itinerary
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["Expenses"])

class ExpenseCreate(BaseModel):
    itinerary_id: Optional[int] = None
    title: str
    category: str  # food, ticket, transport, cafe, hotel, shopping, other
    planned_cost: int = 0
    actual_cost: int = 0

class ExpenseUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    planned_cost: Optional[int] = None
    actual_cost: Optional[int] = None

class ExpenseResponse(BaseModel):
    id: int
    itinerary_id: int
    title: Optional[str] = "Chi phí chuyến đi"
    category: str
    planned_cost: int
    actual_cost: Optional[int] = 0

    class Config:
        from_attributes = True

@router.get("/{itinerary_id}", response_model=List[ExpenseResponse])
def get_itinerary_expenses(
    itinerary_id: int,
    db: Session = Depends(get_db)
):
    """Lay danh sach cac khoan chi tieu cua mot lich trinh"""
    expenses = db.query(Expense).filter(Expense.itinerary_id == itinerary_id).order_by(Expense.id.asc()).all()
    return expenses

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Them khoan chi tieu moi vao so chi tieu"""
    if not data.itinerary_id:
        raise HTTPException(status_code=400, detail="Cần cung cấp mã lịch trình itinerary_id")
    
    itinerary = db.query(Itinerary).filter(Itinerary.id == data.itinerary_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Không tìm thấy lịch trình")

    new_exp = Expense(
        itinerary_id=data.itinerary_id,
        title=data.title,
        category=data.category,
        planned_cost=data.planned_cost,
        actual_cost=data.actual_cost
    )
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    return new_exp

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Chinh sua mot khoan chi tieu (cap nhat so tien thuc te, danh muc)"""
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản chi tiêu")

    if data.title is not None:
        exp.title = data.title
    if data.category is not None:
        exp.category = data.category
    if data.planned_cost is not None:
        exp.planned_cost = data.planned_cost
    if data.actual_cost is not None:
        exp.actual_cost = data.actual_cost

    db.commit()
    db.refresh(exp)
    return exp

@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Xoa mot khoan chi tieu"""
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Không tìm thấy khoản chi tiêu")

    db.delete(exp)
    db.commit()
    return {"message": "Đã xóa khoản chi tiêu thành công"}
