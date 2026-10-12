from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.schemas.location import LocationResponse
from app.schemas.province import ProvinceResponse

class ItineraryGenerateRequest(BaseModel):
    province_id: Optional[int] = None
    destination: Optional[str] = None
    start_location: Optional[str] = None
    num_days: int = 3
    num_nights: int = 2
    prompt: Optional[str] = None

class ItineraryItemResponse(BaseModel):
    id: int
    day_number: int
    time_slot: str
    order_in_day: int
    note: Optional[str] = None
    travel_distance_km: Optional[float] = 0.0
    travel_time_minutes: Optional[int] = 0
    location: LocationResponse

    class Config:
        from_attributes = True

class ItineraryDayResponse(BaseModel):
    day_number: int
    title: str
    items: List[ItineraryItemResponse] = []

class ItineraryResponse(BaseModel):
    id: Optional[int] = None
    title: str
    province: ProvinceResponse
    num_days: int
    num_nights: int
    status: str = "planned"
    total_cost: int = 0
    days: List[ItineraryDayResponse] = []
    share_code: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ItineraryItemCreate(BaseModel):
    location_id: int
    day_number: int
    time_slot: str
    order_in_day: int
    note: Optional[str] = None

class ItineraryItemUpdate(BaseModel):
    day_number: Optional[int] = None
    time_slot: Optional[str] = None
    order_in_day: Optional[int] = None
    note: Optional[str] = None
