import datetime
import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.payment import PaymentTransaction
from app.models.user import User
from app.services.auth import get_current_user, get_optional_current_user

router = APIRouter(prefix="/api/payments", tags=["Payments"])

# Thong tin tai khoan ngan hang SePay (Demo & Thuc te)
SEPAY_BANK_NAME = "MBBank"  # Ngan hang Quan Doi (MB)
SEPAY_ACCOUNT_NO = "0987654321"  # So tai khoan ngan hang
SEPAY_ACCOUNT_NAME = "NGUYEN HAI DANG"  # Ten chu tai khoan

PLANS_CONFIG = {
    "vip_trial": {
        "name": "Gói Trải Nghiệm AI VIP (7 Ngày)",
        "amount": 19000,
        "days": 7
    },
    "vip_1month": {
        "name": "Gói Phượt Thủ Pro (30 Ngày)",
        "amount": 49000,
        "days": 30
    },
    "vip_lifetime": {
        "name": "Gói Khám Phá Trọn Đời (Lifetime)",
        "amount": 149000,
        "days": 3650
    }
}

class CreatePaymentRequest(BaseModel):
    plan_type: str = "vip_1month"

@router.get("/plans")
def get_plans():
    return PLANS_CONFIG

@router.post("/create-order")
def create_order(
    req: CreatePaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = PLANS_CONFIG.get(req.plan_type)
    if not plan:
        raise HTTPException(status_code=400, detail="Gói nâng cấp không hợp lệ")

    # Sinh ma don hang doc nhat theo user ID that
    random_suffix = random.randint(1000, 9999)
    order_code = f"DCL{current_user.id}_{random_suffix}"
    transfer_content = f"DCL VIP {order_code}"

    transaction = PaymentTransaction(
        user_id=current_user.id,
        order_code=order_code,
        amount=plan["amount"],
        plan_type=req.plan_type,
        status="pending",
        payment_method="sepay_vietqr",
        transfer_content=transfer_content
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    # Tao link ma QR SePay VietQR that
    qr_url = f"https://qr.sepay.vn/img?bank={SEPAY_BANK_NAME}&acc={SEPAY_ACCOUNT_NO}&template=compact&amount={int(plan['amount'])}&des={transfer_content}"

    return {
        "order_code": order_code,
        "amount": plan["amount"],
        "plan_name": plan["name"],
        "bank_name": SEPAY_BANK_NAME,
        "account_no": SEPAY_ACCOUNT_NO,
        "account_name": SEPAY_ACCOUNT_NAME,
        "transfer_content": transfer_content,
        "qr_url": qr_url,
        "status": "pending"
    }

@router.get("/check-status/{order_code}")
def check_payment_status(
    order_code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.order_code == order_code,
        PaymentTransaction.user_id == current_user.id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Không tìm thấy đơn hàng")

    return {
        "order_code": transaction.order_code,
        "status": transaction.status,
        "plan_type": transaction.plan_type,
        "amount": transaction.amount,
        "is_paid": transaction.status == "completed"
    }


@router.post("/webhook")
async def sepay_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Webhook tu dong do SePay goi ve khi co giao dich chuyen khoan thuc te
    """
    try:
        body = await request.json()
        # SePay gui ve content vd: "DCL VIP DCL1_1234"
        transfer_content = body.get("content", "")
        amount_in = float(body.get("transferAmount", 0))

        # Tim don hang theo transfer_content
        transaction = db.query(PaymentTransaction).filter(
            PaymentTransaction.transfer_content.in_([transfer_content, transfer_content.strip()])
        ).first()

        if transaction and transaction.status == "pending":
            plan = PLANS_CONFIG.get(transaction.plan_type, {"days": 30})
            user = db.query(User).filter(User.id == transaction.user_id).first()
            if user:
                user.is_vip = 1
                user.vip_expiry = datetime.datetime.now() + datetime.timedelta(days=plan["days"])

            transaction.status = "completed"
            transaction.paid_at = datetime.datetime.now()
            transaction.sepay_transaction_id = str(body.get("id", ""))
            db.commit()
            return {"success": True, "message": "Da kich hoat VIP thanh cong"}

        return {"success": True, "message": "Ignored"}
    except Exception as e:
        return {"success": False, "error": str(e)}
