from app.database import engine, Base, SessionLocal
from app.models.province import Province
from app.models.location import Location
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_seed():
    print("⏳ Dang tao cac bang CSDL...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Kiem tra va tao User Admin mac dinh
        admin_email = "admin@dicunglac.vn"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=pwd_context.hash("123456"),
                full_name="Quản Trị Viên",
                role="admin"
            )
            db.add(admin)
            print("✅ Da tao tai khoan Admin mac dinh: admin@dicunglac.vn / 123456")

        # 2. Seed Province: Vung Tau & Da Lat
        vt = db.query(Province).filter(Province.slug == "vung-tau").first()
        if not vt:
            vt = Province(
                name="Vũng Tàu",
                slug="vung-tau",
                description="Thành phố biển xinh đẹp với nhiều danh thắng, ẩm thực hải sản phong phú và chỉ cách TP.HCM 2 giờ di chuyển.",
                image_url="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
                latitude=10.3460,
                longitude=107.0843,
                best_months="1,2,3,4,5,10,11,12"
            )
            db.add(vt)
            db.flush()
            print("✅ Da tao tinh thanh: Vung Tau")

        dl = db.query(Province).filter(Province.slug == "da-lat").first()
        if not dl:
            dl = Province(
                name="Đà Lạt",
                slug="da-lat",
                description="Thành phố ngàn hoa với khí hậu se lạnh quanh năm, đồi thông thơ mộng và ẩm thực đường phố độc đáo.",
                image_url="https://images.unsplash.com/photo-1555921015-5532091f6026?w=800",
                latitude=11.9404,
                longitude=108.4583,
                best_months="10,11,12,1,2,3,4"
            )
            db.add(dl)
            db.flush()
            print("✅ Da tao tinh thanh: Da Lat")

        # 3. Seed Dia diem Vung Tau (~25 dia diem)
        vt_locations = [
            # Tham quan & Bien
            {"name": "Hải Đăng Vũng Tàu", "category": "tourist_spot", "address": "Núi Nhỏ, Phường 2, TP. Vũng Tàu", "lat": 10.3279, "lng": 107.0843, "cost": 20000, "duration": 90, "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"},
            {"name": "Tượng Chúa Kitô Vua", "category": "tourist_spot", "address": "Đường Hạ Long, Phường 2, TP. Vũng Tàu", "lat": 10.3284, "lng": 107.0661, "cost": 0, "duration": 120, "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600"},
            {"name": "Bạch Dinh (Villa Blanche)", "category": "tourist_spot", "address": "Số 4 Trần Phú, Phường 1, TP. Vũng Tàu", "lat": 10.3382, "lng": 107.0727, "cost": 15000, "duration": 60, "is_indoor": True, "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600"},
            {"name": "Mũi Nghinh Phong", "category": "tourist_spot", "address": "Số 1 Hạ Long, Phường 2, TP. Vũng Tàu", "lat": 10.3250, "lng": 107.0710, "cost": 0, "duration": 60, "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"},
            {"name": "Khu Du Lịch Hồ Mây Park", "category": "tourist_spot", "address": "1A Trần Phú, Phường 1, TP. Vũng Tàu", "lat": 10.3450, "lng": 107.0690, "cost": 250000, "duration": 240, "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600"},
            {"name": "Bãi Trước Vũng Tàu", "category": "beach", "address": "Đường Quang Trung, Phường 1, TP. Vũng Tàu", "lat": 10.3412, "lng": 107.0742, "cost": 0, "duration": 90, "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"},
            {"name": "Bãi Sau (Bãi Thùy Vân)", "category": "beach", "address": "Đường Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3381, "lng": 107.0920, "cost": 0, "duration": 150, "image": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=600"},
            {"name": "Bãi Dâu Yên Tĩnh", "category": "beach", "address": "Đường Trần Phú, Phường 5, TP. Vũng Tàu", "lat": 10.3435, "lng": 107.0680, "cost": 0, "duration": 90, "image": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600"},
            # Quan an & Am thuc
            {"name": "Bánh Khọt Gốc Vú Sữa", "category": "restaurant", "address": "14 Nguyễn Trường Tộ, Phường 2, TP. Vũng Tàu", "lat": 10.3460, "lng": 107.0835, "cost": 55000, "duration": 45, "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600"},
            {"name": "Lẩu Dê 45 Vũng Tàu", "category": "restaurant", "address": "45 Lê Hồng Phong, Phường 7, TP. Vũng Tàu", "lat": 10.3500, "lng": 107.0850, "cost": 220000, "duration": 75, "image": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"},
            {"name": "Cơm Tấm Thuận Kiều Vũng Tàu", "category": "restaurant", "address": "158 Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3490, "lng": 107.0810, "cost": 50000, "duration": 40, "image": "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600"},
            {"name": "Hải Sản Bé Mặn Bãi Sau", "category": "restaurant", "address": "123 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3395, "lng": 107.0910, "cost": 300000, "duration": 90, "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600"},
            {"name": "Bún Riêu Tôm Thuận Phúc", "category": "restaurant", "address": "94 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3420, "lng": 107.0780, "cost": 45000, "duration": 35, "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600"},
            {"name": "Ốc Tự Nhiên 2", "category": "restaurant", "address": "34 Trần Phú, Phường 1, TP. Vũng Tàu", "lat": 10.3445, "lng": 107.0860, "cost": 120000, "duration": 60, "image": "https://images.unsplash.com/photo-1559847844-5315695dadae?w=600"},
            {"name": "Bánh Mì Xíu Mại Hàng Quyên", "category": "restaurant", "address": "31 Tú Xương, Phường 4, TP. Vũng Tàu", "lat": 10.3488, "lng": 107.0825, "cost": 30000, "duration": 25, "image": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600"},
            # Ca phe
            {"name": "Sailing Club Vũng Tàu (View biển)", "category": "cafe", "address": "Bãi Trước, TP. Vũng Tàu", "lat": 10.3410, "lng": 107.0745, "cost": 85000, "duration": 60, "image": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600"},
            {"name": "The Nắng Cafe & Chill", "category": "cafe", "address": "15 Trần Phú, Phường 1, TP. Vũng Tàu", "lat": 10.3440, "lng": 107.0770, "cost": 55000, "duration": 60, "image": "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600"},
            {"name": "Cà Phê Muối Chú Long Vũng Tàu", "category": "cafe", "address": "88 Ba Cu, Phường 1, TP. Vũng Tàu", "lat": 10.3465, "lng": 107.0815, "cost": 35000, "duration": 40, "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600"},
            # Khach san
            {"name": "Khách Sạn Pullman Vũng Tàu", "category": "hotel", "address": "15 Thi Sách, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3395, "lng": 107.0900, "cost": 1800000, "duration": 0, "image": "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600"},
            {"name": "The Imperial Hotel Vũng Tàu", "category": "hotel", "address": "159 Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu", "lat": 10.3405, "lng": 107.0750, "cost": 2200000, "duration": 0, "image": "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600"},
            # Mua sam & Cho
            {"name": "Chợ Đêm Vũng Tàu", "category": "shopping", "address": "Sau lưng khách sạn Imperial, Bãi Sau", "lat": 10.3510, "lng": 107.0830, "cost": 50000, "duration": 75, "image": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600"}
        ]

        for item in vt_locations:
            exists = db.query(Location).filter(Location.province_id == vt.id, Location.name == item["name"]).first()
            if not exists:
                loc = Location(
                    province_id=vt.id,
                    name=item["name"],
                    category=item["category"],
                    description=f"Điểm đến trải nghiệm nổi tiếng tại Vũng Tàu: {item['name']}.",
                    address=item["address"],
                    latitude=item["lat"],
                    longitude=item["lng"],
                    avg_cost_vnd=item["cost"],
                    avg_duration_minutes=item["duration"],
                    image_url=item.get("image"),
                    is_indoor=item.get("is_indoor", False),
                    rating=4.7
                )
                db.add(loc)

        # 4. Seed Dia diem Da Lat (~15 dia diem)
        dl_locations = [
            {"name": "Hồ Xuân Hương", "category": "tourist_spot", "address": "Trung tâm TP. Đà Lạt", "lat": 11.9404, "lng": 108.4380, "cost": 0, "duration": 60, "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600"},
            {"name": "Đồi Chè Cầu Đất", "category": "tourist_spot", "address": "Xã Xuân Trường, TP. Đà Lạt", "lat": 11.9180, "lng": 108.5420, "cost": 0, "duration": 120, "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"},
            {"name": "Thung Lũng Tình Yêu", "category": "tourist_spot", "address": "Số 3-5-7 Đường Mai Anh Đào, Phường 8, TP. Đà Lạt", "lat": 11.9670, "lng": 108.4270, "cost": 250000, "duration": 120, "image": "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600"},
            {"name": "Ga Đà Lạt Cổ Kính", "category": "tourist_spot", "address": "Đường Quang Trung, Phường 9, TP. Đà Lạt", "lat": 11.9395, "lng": 108.4515, "cost": 20000, "duration": 45, "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600"},
            {"name": "Lẩu Gà Lá É Tao Ngộ", "category": "restaurant", "address": "Số 5 Đường 3/4, TP. Đà Lạt", "lat": 11.9440, "lng": 108.4380, "cost": 150000, "duration": 60, "image": "https://images.unsplash.com/photo-1544025162-d76694265947?w=600"},
            {"name": "Bánh Căn Nhà Chung", "category": "restaurant", "address": "Số 1 Nhà Chung, Phường 3, TP. Đà Lạt", "lat": 11.9408, "lng": 108.4410, "cost": 40000, "duration": 35, "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600"},
            {"name": "Cà Phê Mê Linh Coffee Garden", "category": "cafe", "address": "Tổ 20, Thôn 4, Tà Nung, TP. Đà Lạt", "lat": 11.9525, "lng": 108.4310, "cost": 65000, "duration": 75, "image": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600"},
            {"name": "Chợ Đêm Đà Lạt", "category": "shopping", "address": "Đường Nguyễn Thị Minh Khai, Phường 1, TP. Đà Lạt", "lat": 11.9418, "lng": 108.4430, "cost": 50000, "duration": 90, "image": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600"}
        ]

        for item in dl_locations:
            exists = db.query(Location).filter(Location.province_id == dl.id, Location.name == item["name"]).first()
            if not exists:
                loc = Location(
                    province_id=dl.id,
                    name=item["name"],
                    category=item["category"],
                    description=f"Điểm đến đặc trưng xứ lạnh Đà Lạt: {item['name']}.",
                    address=item["address"],
                    latitude=item["lat"],
                    longitude=item["lng"],
                    avg_cost_vnd=item["cost"],
                    avg_duration_minutes=item["duration"],
                    image_url=item.get("image"),
                    rating=4.8
                )
                db.add(loc)

        db.commit()
        print("🎉 Nap du lieu mau thanh cong!")
    except Exception as e:
        db.rollback()
        print(f"❌ Loi khi seed data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
