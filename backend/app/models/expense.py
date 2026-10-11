from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(50), nullable=False)  # food, ticket, transport, cafe, hotel, other
    planned_cost = Column(Integer, default=0, nullable=False)
    actual_cost = Column(Integer, default=0, nullable=True)

    itinerary = relationship("Itinerary", backref="expenses")
