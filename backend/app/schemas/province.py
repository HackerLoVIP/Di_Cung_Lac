from pydantic import BaseModel
from typing import Optional

class ProvinceBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    latitude: float
    longitude: float
    best_months: Optional[str] = None

class ProvinceResponse(ProvinceBase):
    id: int

    class Config:
        from_attributes = True
