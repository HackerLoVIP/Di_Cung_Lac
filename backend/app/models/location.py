from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    province_id = Column(Integer, ForeignKey("provinces.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # tourist_spot, restaurant, cafe, hotel, beach, shopping
    description = Column(Text, nullable=True)
    address = Column(String(300), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    opening_hours = Column(String(100), default="08:00 - 22:00")
    avg_duration_minutes = Column(Integer, default=60)
    avg_cost_vnd = Column(Integer, default=0)
    rating = Column(Float, default=4.5)
    is_indoor = Column(Boolean, default=False)
    
    # Truong bo sung thong tin thuc te
    tips = Column(Text, nullable=True)  # Meo thuc te, tranh chat chem, gio vang di tham quan
    transport_info = Column(Text, nullable=True)  # Cach di chuyen, bai giu xe, duong di

    province = relationship("Province", backref="locations")
    menu_items = relationship("MenuItem", back_populates="location", cascade="all, delete-orphan")

class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(150), nullable=False)
    price_vnd = Column(Integer, nullable=False)
    is_signature = Column(Boolean, default=False)  # Mon dac san khuyen nghi nen thu

    location = relationship("Location", back_populates="menu_items")
