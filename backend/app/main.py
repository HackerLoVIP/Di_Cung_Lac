from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import auth, provinces, locations, itineraries, reviews, wishlists

# Khoi tao bang du lieu neu chua ton tai
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Đi Cùng Lạc API",
    description="Hệ thống hỗ trợ lập kế hoạch và trải nghiệm du lịch thông minh",
    version="1.0.0"
)

# Cau hinh CORS de Frontend ReactJS ket noi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dang ky cac router
app.include_router(auth.router)
app.include_router(provinces.router)
app.include_router(locations.router)
app.include_router(itineraries.router)
app.include_router(reviews.router)
app.include_router(wishlists.router)

@app.get("/")
def read_root():
    return {
        "status": "success",
        "app_name": "Đi Cùng Lạc",
        "version": "1.0.0",
        "message": "Chào mừng bạn đến với API Nền tảng du lịch Đi Cùng Lạc!"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}
