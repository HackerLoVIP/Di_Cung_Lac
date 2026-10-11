from pydantic import BaseModel
from typing import Optional, List

class MenuItemResponse(BaseModel):
    id: int
    name: str
    price_vnd: int
    is_signature: bool

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    province_id: int
    name: str
    category: str
    description: Optional[str] = None
    address: str
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    opening_hours: Optional[str] = "08:00 - 22:00"
    avg_duration_minutes: Optional[int] = 60
    avg_cost_vnd: Optional[int] = 0
    rating: Optional[float] = 4.5
    is_indoor: Optional[bool] = False
    tips: Optional[str] = None
    transport_info: Optional[str] = None

class LocationResponse(LocationBase):
    id: int
    province_name: Optional[str] = None
    menu_items: List[MenuItemResponse] = []

    class Config:
        from_attributes = True

class LocationListResponse(BaseModel):
    id: int
    province_id: int
    name: str
    category: str
    address: str
    image_url: Optional[str] = None
    rating: float
    avg_cost_vnd: int

    class Config:
        from_attributes = True
