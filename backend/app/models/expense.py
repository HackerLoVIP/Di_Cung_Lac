from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), default="Chi phí chuyến đi", nullable=True)
    category = Column(String(50), nullable=False)  # food, ticket, transport, cafe, hotel, shopping, other
    planned_cost = Column(Integer, default=0, nullable=False)
    actual_cost = Column(Integer, default=0, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    itinerary = relationship("Itinerary", backref="expenses")
