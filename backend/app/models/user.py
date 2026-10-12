from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(50), default="user", nullable=False)  # user, admin
    is_vip = Column(Integer, default=0, nullable=False)  # 0: thuong, 1: VIP AI Travel Pro
    vip_expiry = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
