from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    num_days = Column(Integer, default=3, nullable=False)
    num_nights = Column(Integer, default=2, nullable=False)
    status = Column(String(50), default="planned")  # planned, ongoing, completed
    share_code = Column(String(50), unique=True, index=True, nullable=True)
    trip_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="itineraries")
    province = relationship("Province", backref="itineraries")
    items = relationship("ItineraryItem", back_populates="itinerary", cascade="all, delete-orphan", order_by="ItineraryItem.order_in_day")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"

    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id", ondelete="CASCADE"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    time_slot = Column(String(20), nullable=False)  # vd: '08:00', '11:30'
    order_in_day = Column(Integer, default=0)
    note = Column(Text, nullable=True)
    
    # Truong khoang cach va thoi gian di chuyen tu diem truoc do
    travel_distance_km = Column(Float, default=0.0)
    travel_time_minutes = Column(Integer, default=0)

    itinerary = relationship("Itinerary", back_populates="items")
    location = relationship("Location")
