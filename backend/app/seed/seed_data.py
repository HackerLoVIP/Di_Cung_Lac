from app.database import engine, Base, SessionLocal
from app.models.province import Province
from app.models.location import Location, MenuItem
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_seed():
    print("[INFO] Dang khoi tao va cap nhat CSDL...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Admin account
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

        # 2. Province Vung Tau
        vt = db.query(Province).filter(Province.slug == "vung-tau").first()
        if not vt:
            vt = Province(
                name="Vũng Tàu",
                slug="vung-tau",
                description="Thành phố biển xinh đẹp với nhiều danh thắng tâm linh, ẩm thực hải sản phong phú và bờ biển dài thơ mộng.",
                image_url="https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800",
                latitude=10.3460,
                longitude=107.0843,
                best_months="1,2,3,4,5,10,11,12"
            )
            db.add(vt)
            db.flush()

        # 3. Province Da Lat
        dl = db.query(Province).filter(Province.slug == "da-lat").first()
        if not dl:
            dl = Province(
                name="Đà Lạt",
                slug="da-lat",
                description="Thành phố ngàn hoa với khí hậu se lạnh quanh năm, đồi thông bạt ngàn và những quán cafe view thung lũng lãng mạn.",
                image_url="https://images.unsplash.com/photo-1555921015-5532091f6026?w=800",
                latitude=11.9404,
                longitude=108.4583,
                best_months="10,11,12,1,2,3,4"
            )
            db.add(dl)
            db.flush()

        # 4. DU LIEU THUC TE VUNG TAU (Dia chi, toa do GPS, tips chong chat chem, menu thuc te)
        real_locations_vt = [
            {
                "name": "Tượng Chúa Kitô Vua (Núi Nhỏ)",
                "category": "tourist_spot",
                "address": "Số 02 Hạ Long, Phường 2, TP. Vũng Tàu",
                "lat": 10.3284,
                "lng": 107.0661,
                "cost": 10000,
                "duration": 120,
                "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600",
                "tips": "BẮT BUỘC mặc quần dài qua đầu gối, áo có tay mới được lên vai tượng. Nên leo trước 8h30 sáng hoặc sau 15h30 để tránh nắng gắt (khoảng 800 bậc thang).",
                "transport_info": "Gửi xe máy dưới chân núi (giá 5.000đ - 10.000đ/chiếc). Đường Hạ Long ven biển dễ đi.",
                "menu": [
                    {"name": "Vé tham quan", "price": 0, "is_signature": True},
                    {"name": "Gửi xe máy dưới chân núi", "price": 10000, "is_signature": False},
                    {"name": "Nước suối lạnh giải khát", "price": 15000, "is_signature": False}
                ]
            },
            {
                "name": "Bánh Khọt Gốc Vú Sữa",
                "category": "restaurant",
                "address": "14 Nguyễn Trường Tộ, Phường 2, TP. Vũng Tàu",
                "lat": 10.3460,
                "lng": 107.0835,
                "cost": 65000,
                "duration": 45,
                "image": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600",
                "tips": "Quán gia truyền nổi tiếng nhất Vũng Tàu, đổ bánh bằng chảo gang lửa củi. Giờ cao điểm (11h30 - 12h30) rất đông phải xếp hàng khoảng 15 phút.",
                "transport_info": "Có chỗ đậu xe máy phía trước quán miễn phí, ô tô gửi ở ngã tư lân cận.",
                "menu": [
                    {"name": "Dĩa Bánh Khọt Tôm (8 cái)", "price": 60000, "is_signature": True},
                    {"name": "Bánh Khọt Mực Sữa", "price": 65000, "is_signature": True},
                    {"name": "Nước mía / Trà đá", "price": 10000, "is_signature": False}
                ]
            },
            {
                "name": "Hải Đăng Vũng Tàu",
                "category": "tourist_spot",
                "address": "Đỉnh Núi Nhỏ, Phường 2, TP. Vũng Tàu",
                "lat": 10.3279,
                "lng": 107.0843,
                "cost": 25000,
                "duration": 90,
                "image": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600",
                "tips": "Được xây từ thời Pháp, ngắm trọn vẹn toàn cảnh thành phố biển và Bãi Sau. Trên đường lên có quán Yaourt Cô Tiên rất nổi tiếng.",
                "transport_info": "Đường dốc uốn lượn phong cảnh đẹp. Nên đi xe số hoặc tay ga vững tay lái, cẩn thận khúc cua gấp.",
                "menu": [
                    {"name": "Vé lên hải đăng", "price": 0, "is_signature": True},
                    {"name": "Yaourt muối Cô Tiên", "price": 10000, "is_signature": True},
                    {"name": "Trứng gà lòng đào Cô Tiên", "price": 10000, "is_signature": True}
                ]
            },
            {
                "name": "Bãi Sau (Bãi Thùy Vân)",
                "category": "beach",
                "address": "Đường Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu",
                "lat": 10.3381,
                "lng": 107.0920,
                "cost": 30000,
                "duration": 150,
                "image": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=600",
                "tips": "Bãi tắm chính của Vũng Tàu với sóng êm, cát mịn. CHÚ Ý: Cột cờ cảnh báo ao xoáy nguy hiểm, chỉ tắm trong khu vực có phao an toàn.",
                "transport_info": "Đường Thùy Vân rộng rãi, có nhiều bãi đỗ xe công cộng dọc bờ kè biển.",
                "menu": [
                    {"name": "Tắm biển", "price": 0, "is_signature": True},
                    {"name": "Thuê ghế dù nghỉ ngơi", "price": 30000, "is_signature": False},
                    {"name": "Tắm nước ngọt tráng người", "price": 15000, "is_signature": False}
                ]
            },
            {
                "name": "Bạch Dinh (Villa Blanche)",
                "category": "tourist_spot",
                "address": "Số 04 Trần Phú, Phường 1, TP. Vũng Tàu",
                "lat": 10.3382,
                "lng": 107.0727,
                "cost": 25000,
                "duration": 60,
                "is_indoor": True,
                "image": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600",
                "tips": "Biệt thự kiến trúc Pháp cổ kính từng là nơi nghỉ mát của Toàn quyền Paul Doumer và Vua Thành Thái. Có rừng hoa sứ trắng tuyệt đẹp vào mùa nở rộ.",
                "transport_info": "Nằm ngay sườn Núi Lớn, mặt hướng ra Bãi Trước. Gửi xe máy ngay cổng vào 5.000đ.",
                "menu": [
                    {"name": "Vé vào cổng tham quan", "price": 15000, "is_signature": True},
                    {"name": "Vé gửi xe máy", "price": 5000, "is_signature": False}
                ]
            },
            {
                "name": "Hải Sản Bé Mặn (Chuẩn giá niêm yết)",
                "category": "restaurant",
                "address": "Số 73 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu",
                "lat": 10.3395,
                "lng": 107.0910,
                "cost": 250000,
                "duration": 90,
                "image": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600",
                "tips": "Hải sản tươi sống bắt tại hồ, cân ký công khai trước mặt khách, không lo bị đổi hàng hay chặt chém giá cả.",
                "transport_info": "Đường Hoàng Hoa Thám rộng rãi, có nhân viên dắt và giữ xe miễn phí.",
                "menu": [
                    {"name": "Mực trứng hấp gừng (dĩa)", "price": 180000, "is_signature": True},
                    {"name": "Tôm sú nướng muối ớt (phần)", "price": 190000, "is_signature": True},
                    {"name": "Nghêu hấp sả Thái", "price": 70000, "is_signature": False},
                    {"name": "Cơm chiên hải sản", "price": 80000, "is_signature": False}
                ]
            },
            {
                "name": "Sailing Club Vũng Tàu (View biển hoàng hôn)",
                "category": "cafe",
                "address": "Bãi Trước, Đường Quang Trung, Phường 1, TP. Vũng Tàu",
                "lat": 10.3410,
                "lng": 107.0745,
                "cost": 85000,
                "duration": 60,
                "image": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600",
                "tips": "Quán cafe & lounge sát bờ biển có góc ngắm hoàng hôn buông xuống biển đẹp nhất Vũng Tàu. Khung giờ vàng: 16h45 - 17h45.",
                "transport_info": "Nằm ngay khu công viên Bãi Trước, gửi xe trong bãi bờ kè.",
                "menu": [
                    {"name": "Cà phê dừa đá xay", "price": 75000, "is_signature": True},
                    {"name": "Trà đào cam sả đặc biệt", "price": 70000, "is_signature": False},
                    {"name": "Mocktail Sunset Beach", "price": 95000, "is_signature": True}
                ]
            },
            {
                "name": "Bún Riêu Tôm Thuận Phúc",
                "category": "restaurant",
                "address": "94 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu",
                "lat": 10.3420,
                "lng": 107.0780,
                "cost": 55000,
                "duration": 40,
                "image": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600",
                "tips": "Đặc sản nức tiếng ăn sáng. Nước dùng ngọt thanh nấu từ riêu tôm biển tươi rói ăn kèm chả ốc và rau sống tươi sạch.",
                "transport_info": "Gần ngã tư Hoàng Hoa Thám - Võ Thị Sáu, bãi giữ xe máy trong nhà.",
                "menu": [
                    {"name": "Tô Bún riêu tôm đặc biệt", "price": 55000, "is_signature": True},
                    {"name": "Tô Bún riêu thập cẩm chả ốc", "price": 65000, "is_signature": True},
                    {"name": "Sữa bắp non nguyên chất", "price": 15000, "is_signature": False}
                ]
            },
            {
                "name": "Mũi Nghinh Phong & Cổng Trời",
                "category": "tourist_spot",
                "address": "Số 01 Hạ Long, Phường 2, TP. Vũng Tàu",
                "lat": 10.3250,
                "lng": 107.0710,
                "cost": 10000,
                "duration": 60,
                "image": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600",
                "tips": "Mũi đất vươn ra biển đón gió 4 mùa. Có chiếc 'Cổng Trời' màu vàng chụp ảnh sống ảo nhìn ra biển cực thơ mộng. Gió rất to, chú ý giữ nón/mũ.",
                "transport_info": "Ngay chân dốc lên Tượng Chúa. Gửi xe máy tại bãi giữ xe Mũi Nghinh Phong giá 5.000đ.",
                "menu": [
                    {"name": "Tham quan chụp ảnh", "price": 0, "is_signature": True},
                    {"name": "Gửi xe máy", "price": 10000, "is_signature": False}
                ]
            },
            {
                "name": "Chợ Đêm Vũng Tàu (Thiên đường hải sản)",
                "category": "shopping",
                "address": "Sau lưng Khách sạn Imperial, Phường Thắng Tam, TP. Vũng Tàu",
                "lat": 10.3510,
                "lng": 107.0830,
                "cost": 120000,
                "duration": 90,
                "image": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=600",
                "tips": "Nhiều gian hàng hải sản chế biến tại chỗ. KINH NGHIỆM: Luôn hỏi giá và cân ký trước khi bảo đầu bếp chế biến để tránh hiểu lầm.",
                "transport_info": "Có bãi giữ xe máy tập trung của chợ đêm 5.000đ/lượt.",
                "menu": [
                    {"name": "Hàu nướng mỡ hành (con)", "price": 15000, "is_signature": True},
                    {"name": "Sò điệp nướng phô mai", "price": 60000, "is_signature": True},
                    {"name": "Ốc móng tay xào rau muống", "price": 70000, "is_signature": False}
                ]
            }
        ]

        # Xoa du lieu cu de nap du lieu thuc te chi tiet
        db.query(MenuItem).delete()
        db.query(Location).filter(Location.province_id == vt.id).delete()
        db.commit()

        for item in real_locations_vt:
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
                tips=item.get("tips"),
                transport_info=item.get("transport_info"),
                rating=4.8
            )
            db.add(loc)
            db.flush()

            # Nap menu items
            for m in item.get("menu", []):
                menu_obj = MenuItem(
                    location_id=loc.id,
                    name=m["name"],
                    price_vnd=m["price"],
                    is_signature=m["is_signature"]
                )
                db.add(menu_obj)

        db.commit()
        print("[SUCCESS] Da nap xong du lieu thuc te 100% cho Vung Tau!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Loi khi seed du lieu: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_seed()
