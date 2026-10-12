from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Text
from sqlalchemy.sql import func
from app.database import Base

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    order_code = Column(String(50), unique=True, index=True, nullable=False) # Ma don hang vd DCL_VIP_102
    amount = Column(Float, nullable=False) # So tien thanh toan VND
    plan_type = Column(String(50), default="vip_1month") # vip_trial, vip_1month, vip_lifetime
    status = Column(String(50), default="pending") # pending, completed, cancelled
    payment_method = Column(String(50), default="sepay_vietqr")
    sepay_transaction_id = Column(String(100), nullable=True) # ID giao dich tu SePay
    transfer_content = Column(String(100), nullable=False) # Noi dung CK SePay: DCL VIP 102
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True), nullable=True)
