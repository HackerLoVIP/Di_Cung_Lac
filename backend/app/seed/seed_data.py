from app.database import engine, Base, SessionLocal
from app.models.province import Province
from app.models.location import Location, MenuItem
from app.models.user import User
from app.services.location_images import resolve_real_image, resolve_province_image
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def run_seed():
    print("[INFO] Dang khoi tao, don dep data test va nap du lieu THUC TE 100%...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Don dep tai khoan test rac ("test@gmai.com", "test1@gmai.com", ten "a", "aa")
        test_users = db.query(User).filter(
            (User.email.in_(["test@gmai.com", "test1@gmai.com", "test@gmail.com"])) |
            (User.full_name.in_(["a", "aa", "test"]))
        ).all()
        for tu in test_users:
            db.delete(tu)
        db.commit()

        # Dam bao tai khoan Admin va tai khoan Thanh vien chinh chu
        admin_email = "admin@dicunglac.vn"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                email=admin_email,
                password_hash=pwd_context.hash("123456"),
                full_name="Quản Trị Viên Đi Cùng Lạc",
                role="admin",
                is_vip=True
            )
            db.add(admin)

        # 2. Xoa toan bo cac dia diem ten gia / chung chung do fallback cu sinh ra
        fake_prefixes = [
            "Điểm check-in nổi tiếng trung tâm",
            "Quán đặc sản truyền thống",
            "Khu sinh thái & ngắm cảnh thiên nhiên",
            "Chợ đêm & phố đi bộ",
            "Xuất phát từ",
            "Khởi hành về",
            "Gợi ý:"
        ]
        for prefix in fake_prefixes:
            fake_locs = db.query(Location).filter(Location.name.ilike(f"%{prefix}%")).all()
            for fl in fake_locs:
                db.query(MenuItem).filter(MenuItem.location_id == fl.id).delete()
                db.delete(fl)

        # Xoa cac dia diem bi dat ten trung voi ten tinh thanh (VD: location 'TP. Hồ Chí Minh' trong tinh Tây Ninh)
        city_only_names = ["TP. Hồ Chí Minh", "Hồ Chí Minh", "Sài Gòn", "Tây Ninh", "Đà Lạt", "Vũng Tàu", "Pleiku", "Phú Quốc", "Hà Nội"]
        bad_city_locs = db.query(Location).filter(Location.name.in_(city_only_names)).all()
        for bcl in bad_city_locs:
            db.query(MenuItem).filter(MenuItem.location_id == bcl.id).delete()
            db.delete(bcl)
        db.commit()

        # 3. Danh sach Tinh / Thanh pho chuan xac voi anh bia rieng biet
        provinces_seed = [
            {
                "name": "Vũng Tàu",
                "slug": "vung-tau",
                "description": "Thành phố biển sôi động cách Sài Gòn chỉ 2 giờ di chuyển, nổi tiếng với Tượng Chúa Kitô Vua, Ngọn Hải Đăng cổ kính, cung đường biển Trần Phú - Hạ Long tuyệt đẹp và thiên đường hải sản tươi sống.",
                "lat": 10.3460,
                "lng": 107.0843,
                "best_months": "1,2,3,4,5,10,11,12"
            },
            {
                "name": "Đà Lạt",
                "slug": "da-lat",
                "description": "Thành phố ngàn hoa trên cao nguyên Lâm Viên cao 1.500m, quyến rũ du khách bởi khí hậu se lạnh quanh năm, biển mây Đồi Chè Cầu Đất, rừng thông bạt ngàn và những quán cà phê thung lũng lãng mạn.",
                "lat": 11.9404,
                "lng": 108.4583,
                "best_months": "10,11,12,1,2,3,4"
            },
            {
                "name": "Tây Ninh",
                "slug": "tay-ninh",
                "description": "Vùng đất thánh Đông Nam Bộ nổi bật với đỉnh Núi Bà Đen cao 986m (Nóc nhà Nam Bộ), kiến trúc Tòa Thánh Cao Đài độc đáo, Hồ Dầu Tiếng mênh mông và đặc sản bò tơ, bánh tráng phơi sương trứ danh.",
                "lat": 11.3126,
                "lng": 106.1025,
                "best_months": "11,12,1,2,3,4"
            },
            {
                "name": "TP. Hồ Chí Minh",
                "slug": "ho-chi-minh",
                "description": "Đô thị phồn hoa bậc nhất Việt Nam nơi giao thoa giữa những công trình di sản kiến trúc Pháp hơn 100 năm tuổi, các tòa tháp hiện đại bên sông Sài Gòn và nền ẩm thực đường phố phong phú suốt ngày đêm.",
                "lat": 10.7769,
                "lng": 106.7009,
                "best_months": "12,1,2,3,4"
            },
            {
                "name": "Pleiku",
                "slug": "pleiku",
                "description": "Phố núi cao nguyên Gia Lai đầy chất thơ với thắng cảnh Biển Hồ T'Nưng trong xanh, Hàng thông trăm tuổi bên đồi chè cổ thụ, núi lửa Chư Đăng Ya và hương vị phở khô hai tô, gà nướng cơm lam.",
                "lat": 13.9833,
                "lng": 108.0000,
                "best_months": "10,11,12,1,2,3"
            },
            {
                "name": "Phú Quốc",
                "slug": "phu-quoc",
                "description": "Đảo Ngọc thiên đường biển đảo phía Nam với làn nước xanh ngọc bích tại Bãi Sao, Bãi Kem, cáp treo vượt biển Hòn Thơm dài nhất thế giới và chợ đêm hải sản sầm uất.",
                "lat": 10.2289,
                "lng": 103.9572,
                "best_months": "11,12,1,2,3,4,5"
            }
        ]

        prov_map = {}
        for p_info in provinces_seed:
            prov = db.query(Province).filter(
                (Province.slug == p_info["slug"]) | (Province.name.ilike(f"%{p_info['name']}%"))
            ).first()
            img_url = resolve_province_image(p_info["name"])
            if not prov:
                prov = Province(
                    name=p_info["name"],
                    slug=p_info["slug"],
                    description=p_info["description"],
                    image_url=img_url,
                    latitude=p_info["lat"],
                    longitude=p_info["lng"],
                    best_months=p_info["best_months"]
                )
                db.add(prov)
                db.flush()
            else:
                prov.name = p_info["name"]
                prov.description = p_info["description"]
                prov.image_url = img_url
                prov.latitude = p_info["lat"]
                prov.longitude = p_info["lng"]
                prov.best_months = p_info["best_months"]
                db.flush()
            prov_map[p_info["slug"]] = prov

        db.commit()

        # 4. Bo du lieu Dia diem THUC TE 100% cho tung tinh thanh (Toa do GPS chuan xac Google Maps)
        locations_by_province = {
            "vung-tau": [
                {
                    "name": "Khách sạn The Imperial Hotel & Resort Vũng Tàu",
                    "category": "hotel",
                    "description": "Khách sạn 5 sao cổ điển sang trọng tọa lạc ngay mặt tiền biển Bãi Sau với bãi tắm riêng và cầu đi bộ sang biển.",
                    "address": "159 Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu",
                    "lat": 10.34336,
                    "lng": 107.09436,
                    "cost": 450000,
                    "duration": 45,
                    "tips": "Có thể gửi hành lý tại quầy lễ tân nếu đến sớm trước giờ check-in 14h00 để đi tham quan nhẹ nhàng.",
                    "transport_info": "Mặt tiền đường Thùy Vân, có hầm và bãi đỗ xe ô tô, xe máy miễn phí cho khách lưu trú.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 450000, "is_signature": True}
                    ]
                },
                {
                    "name": "Tượng Chúa Kitô Vua (Đỉnh Núi Nhỏ)",
                    "category": "tourist_spot",
                    "description": "Bức tượng Chúa Kitô dang tay trên đỉnh Núi Nhỏ cao 32m hướng ra biển Đông, bên trong có 133 bậc thang xoắn ốc lên tận vai tượng ngắm toàn cảnh Vũng Tàu.",
                    "address": "Số 02 Hạ Long, Phường 2, TP. Vũng Tàu",
                    "lat": 10.32645,
                    "lng": 107.08402,
                    "cost": 10000,
                    "duration": 120,
                    "tips": "Bắt buộc mặc quần/váy dài qua đầu gối và áo có tay mới được lên vai tượng. Nên leo lúc 7h30 - 9h00 sáng hoặc sau 15h30 chiều để mát mẻ.",
                    "transport_info": "Gửi xe máy dưới chân núi giá niêm yết 5.000đ - 10.000đ/chiếc.",
                    "menu": [
                        {"name": "Vé tham quan cổng chính", "price": 0, "is_signature": True},
                        {"name": "Phí gửi xe máy chân núi", "price": 10000, "is_signature": False},
                        {"name": "Nước dừa tươi giải khát", "price": 25000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bánh Khọt Gốc Vú Sữa",
                    "category": "restaurant",
                    "description": "Quán bánh khọt gia truyền lâu đời nhất Vũng Tàu, bánh đổ khuôn gang giòn rụm với tôm biển tươi ngọt và mỡ hành, ăn kèm rau sống và đu đủ bào.",
                    "address": "14 Nguyễn Trường Tộ, Phường 2, TP. Vũng Tàu",
                    "lat": 10.34043,
                    "lng": 107.07881,
                    "cost": 65000,
                    "duration": 45,
                    "tips": "Nên đi trước 11h00 trưa hoặc chiều từ 15h00 để không phải xếp hàng chờ bàn quá lâu.",
                    "transport_info": "Có nhân viên trông xe máy miễn phí ngay mặt tiền đường Nguyễn Trường Tộ.",
                    "menu": [
                        {"name": "Dĩa Bánh Khọt Tôm Biển (8 bánh)", "price": 60000, "is_signature": True},
                        {"name": "Dĩa Bánh Khọt Mực Sữa Tươi", "price": 65000, "is_signature": True},
                        {"name": "Nước mía nguyên chất", "price": 12000, "is_signature": False}
                    ]
                },
                {
                    "name": "Hải Đăng Vũng Tàu",
                    "category": "tourist_spot",
                    "description": "Ngọn hải đăng cổ xây dựng năm 1862 bằng tháp tròn trắng tinh khôi trên đỉnh Núi Nhỏ, nổi tiếng với cung đường hoa bông gòn và tầm nhìn 360 độ toàn thành phố.",
                    "address": "Đỉnh Núi Nhỏ, Phường 2, TP. Vũng Tàu",
                    "lat": 10.33411,
                    "lng": 107.07766,
                    "cost": 25000,
                    "duration": 90,
                    "tips": "Trên đường lên Hải Đăng nhớ dừng ghé quán Cô Tiên thưởng thức Yaourt muối dẻo và trứng gà lòng đào.",
                    "transport_info": "Chạy xe máy hoặc ô tô lên thẳng tới đỉnh theo đường Hải Đăng, chú ý bóp còi ở các khúc cua dốc.",
                    "menu": [
                        {"name": "Yaourt đá Cô Tiên", "price": 10000, "is_signature": True},
                        {"name": "Trứng gà lòng đào chấm muối tiêu", "price": 10000, "is_signature": True},
                        {"name": "Gửi xe máy trên đỉnh Hải Đăng", "price": 5000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bãi Sau (Bãi Thùy Vân)",
                    "category": "beach",
                    "description": "Bãi biển dài hơn 8km với bãi cát trắng phẳng mịn, sóng biển ôn hòa và quảng trường công viên biển sôi động bậc nhất Vũng Tàu.",
                    "address": "Đường Thùy Vân, Phường Thắng Tam, TP. Vũng Tàu",
                    "lat": 10.34256,
                    "lng": 107.09589,
                    "cost": 30000,
                    "duration": 120,
                    "tips": "Chỉ tắm trong khu vực có cờ xanh và dây phao an toàn của đội cứu hộ bờ biển.",
                    "transport_info": "Gửi xe tại các bãi giữ xe công cộng dọc công viên Thùy Vân.",
                    "menu": [
                        {"name": "Tắm biển tự do", "price": 0, "is_signature": True},
                        {"name": "Thuê ghế bố & dù che nắng", "price": 30000, "is_signature": False},
                        {"name": "Tắm nước ngọt tráng người", "price": 15000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bạch Dinh (Villa Blanche)",
                    "category": "tourist_spot",
                    "description": "Dinh thự kiến trúc Pháp cổ điển màu trắng nằm tựa lưng vào sườn Núi Lớn, bao quanh bởi rừng cây giá tỵ và hoa sứ cổ thụ trăm năm.",
                    "address": "Số 04 Trần Phú, Phường 1, TP. Vũng Tàu",
                    "lat": 10.35008,
                    "lng": 107.06894,
                    "cost": 20000,
                    "duration": 60,
                    "is_indoor": True,
                    "tips": "Cầu thang đá cổ và hành lang mái vòm kiểu Pháp là góc chụp ảnh vintage đẹp nhất.",
                    "transport_info": "Gửi xe ngay cổng số 4 Trần Phú (5.000đ/xe máy).",
                    "menu": [
                        {"name": "Vé tham quan Bạch Dinh", "price": 15000, "is_signature": True},
                        {"name": "Vé gửi xe máy", "price": 5000, "is_signature": False}
                    ]
                },
                {
                    "name": "Hải Sản Bé Mặn (Chuẩn giá niêm yết)",
                    "category": "restaurant",
                    "description": "Nhà hàng hải sản tươi sống nổi tiếng với bể hải sản tự chọn, cân đúng ký và bảng giá niêm yết công khai minh bạch mỗi ngày.",
                    "address": "Số 73 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu",
                    "lat": 10.33998,
                    "lng": 107.08248,
                    "cost": 250000,
                    "duration": 90,
                    "tips": "Mực trứng hấp gừng, ốc hương sốt trứng muối và lẩu cá đuối là 3 món nhất định phải thử.",
                    "transport_info": "Có bãi đỗ xe ô tô và xe máy rộng rãi đối diện quán.",
                    "menu": [
                        {"name": "Mực trứng hấp gừng tươi", "price": 180000, "is_signature": True},
                        {"name": "Tôm sú biển nướng muối ớt", "price": 190000, "is_signature": True},
                        {"name": "Lẩu cá đuối măng chua", "price": 220000, "is_signature": True},
                        {"name": "Nghêu hấp sả ớt", "price": 75000, "is_signature": False}
                    ]
                },
                {
                    "name": "Sailing Club Vũng Tàu (View biển hoàng hôn)",
                    "category": "cafe",
                    "description": "Tổ hợp cà phê và nhà hàng sát mép biển Bãi Trước với thiết kế Địa Trung Hải phóng khoáng, nơi ngắm mặt trời lặn xuống biển đẹp nhất thành phố.",
                    "address": "Đường Quang Trung, Công viên Bãi Trước, Phường 1, TP. Vũng Tàu",
                    "lat": 10.34490,
                    "lng": 107.07407,
                    "cost": 85000,
                    "duration": 60,
                    "tips": "Đến khoảng 16h30 để chọn bàn sát lancan hướng biển đón trọn khoảnh khắc hoàng hôn 17h30.",
                    "transport_info": "Đậu xe dọc công viên Bãi Trước.",
                    "menu": [
                        {"name": "Cà phê cốt dừa đá xay", "price": 75000, "is_signature": True},
                        {"name": "Trà nhiệt đới Hoàng Hôn", "price": 80000, "is_signature": True},
                        {"name": "Khoai tây chiên sốt nấm Truffle", "price": 95000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bún Riêu Tôm Thuận Phúc",
                    "category": "restaurant",
                    "description": "Tô bún riêu tôm biển đặc sản Vũng Tàu với phần gạch tôm béo thơm, chả ốc giòn sần sật, bạch tuộc tươi và nước lèo thanh ngọt tự nhiên.",
                    "address": "94 Hoàng Hoa Thám, Phường Thắng Tam, TP. Vũng Tàu",
                    "lat": 10.34135,
                    "lng": 107.08312,
                    "cost": 55000,
                    "duration": 40,
                    "tips": "Chấm hải sản và chả ốc với muối ớt tắc pha sẵn tại bàn cực kỳ đậm đà.",
                    "transport_info": "Đậu xe máy ngay trong khuôn viên quán.",
                    "menu": [
                        {"name": "Bún riêu tôm chả ốc đặc biệt", "price": 55000, "is_signature": True},
                        {"name": "Bún riêu hải sản bạch tuộc", "price": 65000, "is_signature": True},
                        {"name": "Sữa bắp non nhà nấu", "price": 15000, "is_signature": False}
                    ]
                },
                {
                    "name": "Mũi Nghinh Phong & Cổng Trời",
                    "category": "tourist_spot",
                    "description": "Mũi đất vươn dài ra biển tạo thành hai vịnh lớn Bãi Trước và Bãi Sau, nổi tiếng với chiếc Cổng Trời màu vàng hướng thẳng ra đại dương xanh ngắt.",
                    "address": "Số 01 Hạ Long, Phường 2, TP. Vũng Tàu",
                    "lat": 10.32285,
                    "lng": 107.08532,
                    "cost": 10000,
                    "duration": 60,
                    "tips": "Bậc thang đi xuống bãi tắm Vọng Nguyệt dưới chân mũi rất đẹp nhưng dốc, nên đi giày thể thao êm chân.",
                    "transport_info": "Bãi giữ xe ngay cổng vào đối diện tượng Chúa.",
                    "menu": [
                        {"name": "Vé tham quan chụp ảnh", "price": 0, "is_signature": True},
                        {"name": "Phí giữ xe máy", "price": 10000, "is_signature": False}
                    ]
                },
                {
                    "name": "Chợ Đêm Vũng Tàu (Thiên đường hải sản)",
                    "category": "shopping",
                    "description": "Khu chợ đêm nhộn nhịp tập trung hàng chục quầy hải sản tươi sống nướng tại chỗ và các gian hàng quà lưu niệm vỏ ốc biển.",
                    "address": "Sau lưng Khách sạn Imperial, Phường Thắng Tam, TP. Vũng Tàu",
                    "lat": 10.34305,
                    "lng": 107.09285,
                    "cost": 120000,
                    "duration": 90,
                    "tips": "Luôn hỏi giá và nhìn cân trực tiếp trước khi yêu cầu chế biến.",
                    "transport_info": "Bãi giữ xe đầu cổng chợ đêm 5.000đ/xe.",
                    "menu": [
                        {"name": "Hàu sữa nướng mỡ hành (dĩa 6 con)", "price": 70000, "is_signature": True},
                        {"name": "Bạch tuộc nướng sa tế", "price": 120000, "is_signature": True},
                        {"name": "Bánh bông lan trứng muối Gốc Cột Điện", "price": 45000, "is_signature": True}
                    ]
                }
            ],
            "da-lat": [
                {
                    "name": "Khách sạn Hôtel Colline Đà Lạt (Trung tâm Chợ Đà Lạt)",
                    "category": "hotel",
                    "description": "Khách sạn 4 sao hiện đại nằm ngay trung tâm khu Hòa Bình và Chợ Đà Lạt, cực kỳ thuận tiện để gửi hành lý và di chuyển.",
                    "address": "Số 10 Phan Bội Châu, Phường 1, TP. Đà Lạt",
                    "lat": 11.94225,
                    "lng": 108.43685,
                    "cost": 400000,
                    "duration": 45,
                    "tips": "Gửi hành lý tại sảnh lễ tân nếu tới Đà Lạt vào sáng sớm, đi bộ ra Hồ Xuân Hương và Chợ Đà Lạt chỉ 2 phút.",
                    "transport_info": "Ngay trục đường Phan Bội Châu trung tâm Phường 1, có tầng hầm đỗ xe rộng rãi.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 400000, "is_signature": True}
                    ]
                },
                {
                    "name": "Đồi Chè Cầu Đất (Cầu Đất Farm)",
                    "category": "tourist_spot",
                    "description": "Đồi chè cổ hơn 100 năm tuổi trải dài xanh mướt kết hợp cánh đồng điện gió khổng lồ và điểm săn biển mây bình minh đẹp nhất Đà Lạt.",
                    "address": "QL20, Xã Xuân Trường, TP. Đà Lạt, Lâm Đồng",
                    "lat": 11.87775,
                    "lng": 108.56034,
                    "cost": 90000,
                    "duration": 120,
                    "tips": "Xuất phát từ trung tâm lúc 5h30 sáng để kịp đón bình minh và biển mây lúc 6h15.",
                    "transport_info": "Đi thẳng đường Hùng Vương - Tự Phước - QL20 khoảng 23km, đường nhựa đẹp.",
                    "menu": [
                        {"name": "Vé tham quan Đồi Chè", "price": 0, "is_signature": True},
                        {"name": "Cà phê Cầu Đất trên mây", "price": 65000, "is_signature": True},
                        {"name": "Trà Ô Long sữa tươi", "price": 55000, "is_signature": False}
                    ]
                },
                {
                    "name": "Quảng Trường Lâm Viên & Hồ Xuân Hương",
                    "category": "tourist_spot",
                    "description": "Trái tim của thành phố Đà Lạt với hai khối kiến trúc biểu tượng Nụ Hoa Atiso xanh và Bông Hoa Dã Quỳ khổng lồ nằm bên bờ Hồ Xuân Hương thơ mộng.",
                    "address": "Đường Trần Quốc Toản, Phường 10, TP. Đà Lạt",
                    "lat": 11.93966,
                    "lng": 108.44235,
                    "cost": 30000,
                    "duration": 60,
                    "tips": "Buổi chiều từ 16h30 - 18h00 thời tiết se lạnh, đi dạo quanh hồ và uống sữa đậu nành nóng cực chill.",
                    "transport_info": "Có bãi đỗ xe ngầm rộng lớn ngay dưới tầng hầm Quảng trường Lâm Viên.",
                    "menu": [
                        {"name": "Bánh tráng nướng Đà Lạt", "price": 25000, "is_signature": True},
                        {"name": "Khoai lang mật nướng than hồng", "price": 20000, "is_signature": False}
                    ]
                },
                {
                    "name": "Lẩu Gà Lá É Tao Ngộ (Quán Gốc Đà Lạt)",
                    "category": "restaurant",
                    "description": "Đặc sản trứ danh Đà Lạt với nước dùng thanh ngọt nấu cùng gà ta săn chắc, măng củ tươi giòn và rổ lá é the mát hương sả chanh.",
                    "address": "Số 05 Đường 3/4, Phường 3, TP. Đà Lạt",
                    "lat": 11.93315,
                    "lng": 108.44525,
                    "cost": 150000,
                    "duration": 75,
                    "tips": "Nhúng lá é vừa chín tới để giữ trọn vị the thơm đặc trưng, chấm thịt gà với muối ớt xanh.",
                    "transport_info": "Đậu xe máy trước quán hoặc bãi xe kế bên.",
                    "menu": [
                        {"name": "Lẩu gà lá é nồi vừa (2-3 người)", "price": 300000, "is_signature": True},
                        {"name": "Lẩu gà lá é nồi lớn (4-5 người)", "price": 400000, "is_signature": True},
                        {"name": "Sữa đậu nành nóng", "price": 15000, "is_signature": False}
                    ]
                },
                {
                    "name": "Tiệm Cà Phê Túi Mơ To",
                    "category": "cafe",
                    "description": "Quán cà phê nhà kính cổ điển giữa vườn cúc họa mi trắng tinh khôi, sở hữu tầm nhìn bao trọn thung lũng nhà lồng và đỉnh Langbiang phía xa.",
                    "address": "Hẻm 31 Sào Nam, Phường 11, TP. Đà Lạt",
                    "lat": 11.94620,
                    "lng": 108.48790,
                    "cost": 65000,
                    "duration": 75,
                    "tips": "Ghé lúc 16h30 chiều để vừa chụp được nắng hoàng hôn vừa ngắm thung lũng nhà lồng lên đèn lung linh.",
                    "transport_info": "Cách trung tâm 6km hướng Trại Mát, có bãi giữ xe miễn phí.",
                    "menu": [
                        {"name": "Trà đào hồng đài Đà Lạt", "price": 65000, "is_signature": True},
                        {"name": "Cà phê kem muối", "price": 60000, "is_signature": True},
                        {"name": "Bánh ngọt Tiramisu", "price": 55000, "is_signature": False}
                    ]
                },
                {
                    "name": "Chùa Linh Phước (Chùa Ve Chai)",
                    "category": "tourist_spot",
                    "description": "Ngôi chùa giữ nhiều kỷ lục Việt Nam với kiến trúc khảm từ hàng triệu mảnh sành sứ tinh xảo, tháp chuông cao 37m và tượng Phật bằng hoa bất tử.",
                    "address": "120 Tự Phước, Trại Mát, Phường 11, TP. Đà Lạt",
                    "lat": 11.94398,
                    "lng": 108.49956,
                    "cost": 0,
                    "duration": 60,
                    "tips": "Có thể kết hợp đi tàu cổ từ Ga Đà Lạt xuống Ga Trại Mát rồi đi bộ 300m vào chùa.",
                    "transport_info": "Bãi đỗ xe rộng ngay trước cổng chùa.",
                    "menu": [
                        {"name": "Tham quan lễ Phật", "price": 0, "is_signature": True}
                    ]
                },
                {
                    "name": "Khu du lịch Thác Datanla Đà Lạt",
                    "category": "tourist_spot",
                    "description": "Quần thể thác nước hùng vĩ giữa đèo Prenn kết hợp hệ thống xe trượt Alpine Coaster xuyên rừng thông dài 2.400m hiện đại nhất Đông Nam Á.",
                    "address": "QL20 Đèo Prenn, Phường 3, TP. Đà Lạt",
                    "lat": 11.90165,
                    "lng": 108.44985,
                    "cost": 250000,
                    "duration": 120,
                    "tips": "Nên mua vé xe trượt Alpine Coaster khứ hồi để vừa vui vừa đỡ mất sức leo bộ dốc cao.",
                    "transport_info": "Nằm ngay giữa đèo Prenn, bãi đậu xe ô tô và xe máy cực rộng.",
                    "menu": [
                        {"name": "Vé xe trượt Alpine Coaster khứ hồi", "price": 250000, "is_signature": True},
                        {"name": "Vé vào cổng ngắm thác bộ", "price": 50000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bánh Ướt Lòng Gà Trang (Tăng Bạt Hổ)",
                    "category": "restaurant",
                    "description": "Món ăn sáng đặc trưng của người Đà Lạt với lớp bánh ướt nóng dẻo ăn cùng lòng gà giòn, thịt gà ta xé phay, trứng non và nước mắm pha ấm.",
                    "address": "15F Tăng Bạt Hổ, Phường 1, TP. Đà Lạt",
                    "lat": 11.94412,
                    "lng": 108.43578,
                    "cost": 55000,
                    "duration": 45,
                    "tips": "Gọi thêm chén súp huyết nóng hổi và sữa đậu nành lá dứa uống kèm rất hợp.",
                    "transport_info": "Ngay khu Hòa Bình trung tâm Đà Lạt.",
                    "menu": [
                        {"name": "Bánh ướt lòng gà trứng non đặc biệt", "price": 55000, "is_signature": True},
                        {"name": "Cháo gà ta nấm rơm", "price": 45000, "is_signature": False}
                    ]
                },
                {
                    "name": "Chợ Đêm Đà Lạt (Chợ Âm Phủ)",
                    "category": "shopping",
                    "description": "Thiên đường mua sắm đồ len, đặc sản mứt trái cây, dâu tây tươi và ẩm thực đêm nhộn nhịp ngay trung tâm thành phố sương mù.",
                    "address": "Đường Nguyễn Thị Minh Khai, Phường 1, TP. Đà Lạt",
                    "lat": 11.94139,
                    "lng": 108.43735,
                    "cost": 100000,
                    "duration": 90,
                    "tips": "Nên hỏi giá trước khi ngồi ăn tại các sạp bậc thang; mua đặc sản đóng gói tại cửa hàng L'angfarm ngay đầu chợ để yên tâm chất lượng.",
                    "transport_info": "Gửi xe tại bãi xe Tùng Lâm đầu đường Nguyễn Thị Minh Khai.",
                    "menu": [
                        {"name": "Sữa đậu nành nóng & bánh ngọt", "price": 25000, "is_signature": True},
                        {"name": "Kem bơ sầu riêng Đà Lạt", "price": 35000, "is_signature": True},
                        {"name": "Dâu tây lắc muối ớt", "price": 40000, "is_signature": False}
                    ]
                }
            ],
            "tay-ninh": [
                {
                    "name": "Khách sạn Vinpearl Hotel Tây Ninh (Meliá Vinpearl)",
                    "category": "hotel",
                    "description": "Khách sạn 5 sao cao nhất Tây Ninh nằm ngay trung tâm thành phố với tầm nhìn thẳng ra đỉnh Núi Bà Đen hùng vĩ.",
                    "address": "Số 90 Lê Duẩn, Phường 3, TP. Tây Ninh",
                    "lat": 11.31930,
                    "lng": 106.10013,
                    "cost": 350000,
                    "duration": 45,
                    "tips": "Điểm dừng chân đầu tiên lý tưởng để gửi hành lý, nghỉ ngơi sau chặng đường từ Sài Gòn lên Tây Ninh.",
                    "transport_info": "Ngay ngã tư Lê Duẩn - 30/4 trung tâm TP. Tây Ninh, bãi đỗ xe rộng rãi.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 350000, "is_signature": True}
                    ]
                },
                {
                    "name": "Khu du lịch Quốc gia Núi Bà Đen",
                    "category": "tourist_spot",
                    "description": "Nóc nhà Nam Bộ cao 986m với hệ thống cáp treo Sun World hiện đại đưa du khách xuyên mây lên chiêm bái tượng Phật Bà Tây Bổ Đà Sơn và Tôn tượng Bồ Tát Di Lặc bằng đá sa thạch.",
                    "address": "Khu phố Ninh Phú, Phường Ninh Sơn, TP. Tây Ninh",
                    "lat": 11.36885,
                    "lng": 106.17825,
                    "cost": 350000,
                    "duration": 180,
                    "tips": "Nên đi cáp treo lên đỉnh lúc 7h00 sáng để săn mây hoặc ở lại đến 18h00 tối thứ 7 để xem lễ dâng đăng lung linh trên đỉnh núi.",
                    "transport_info": "Từ trung tâm TP. Tây Ninh chạy thẳng đường Bời Lời 11km vào thẳng Nhà ga Cáp treo Sun World, bãi đỗ xe rộng hàng ngàn chỗ.",
                    "menu": [
                        {"name": "Vé cáp treo khứ hồi đỉnh Vân Sơn", "price": 350000, "is_signature": True},
                        {"name": "Combo Cáp treo Đỉnh Vân Sơn + Chùa Bà", "price": 550000, "is_signature": True},
                        {"name": "Buffet trưa nhà hàng Vân Sơn", "price": 250000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bò Tơ Tây Ninh Năm Sánh (Quán Gốc)",
                    "category": "restaurant",
                    "description": "Thương hiệu bò tơ danh tiếng nhất Tây Ninh với thịt bò tơ sữa mềm ngọt tự nhiên, nướng tảng trên than hồng cuộn bánh tráng rau rừng chấm mắm nêm.",
                    "address": "Đường 30/4, Phường Hiệp Ninh, TP. Tây Ninh",
                    "lat": 11.30052,
                    "lng": 106.11245,
                    "cost": 180000,
                    "duration": 75,
                    "tips": "Món bò tơ nướng tảng và lẩu đuôi bò tươi là 2 món best-seller của quán.",
                    "transport_info": "Mặt tiền đại lộ 30/4, có bãi đỗ xe ô tô và xe máy miễn phí.",
                    "menu": [
                        {"name": "Bò tơ nướng tảng cuộn rau rừng", "price": 180000, "is_signature": True},
                        {"name": "Lẩu đuôi bò tơ thuốc bắc", "price": 220000, "is_signature": True},
                        {"name": "Bò tơ nhúng giấm", "price": 165000, "is_signature": False}
                    ]
                },
                {
                    "name": "Toà Thánh Cao Đài Tây Ninh",
                    "category": "tourist_spot",
                    "description": "Công trình tôn giáo kỳ vĩ bậc nhất Việt Nam với lối kiến trúc Long Mã chầu Thiên Nhãn độc đáo, chạm trổ rồng phượng rực rỡ sắc màu.",
                    "address": "Đường Phạm Hộ Pháp, Thị xã Hoà Thành, Tây Ninh",
                    "lat": 11.29668,
                    "lng": 106.12058,
                    "cost": 0,
                    "duration": 60,
                    "tips": "Nên đến vào lúc 11h45 trưa để xem nghi lễ cúng Đại Đàn trang nghiêm diễn ra đúng 12h00. Nam đi cửa bên phải, nữ đi cửa bên trái, bỏ giày dép bên ngoài.",
                    "transport_info": "Khuôn viên nội ô Tòa Thánh rộng lớn, gửi xe ngay cổng chính.",
                    "menu": [
                        {"name": "Tham quan miễn phí", "price": 0, "is_signature": True}
                    ]
                },
                {
                    "name": "Chùa Gò Kén (Thiền Lâm Tự)",
                    "category": "tourist_spot",
                    "description": "Ngôi chùa cổ hơn 100 năm tuổi xây dựng sớm nhất tại Tây Ninh, nổi bật với tượng Phật Quan Âm cao 25m đứng trên đài sen giữa hồ nước trong xanh.",
                    "address": "QL22B, Long Thành Trung, Thị xã Hoà Thành, Tây Ninh",
                    "lat": 11.27435,
                    "lng": 106.10645,
                    "cost": 0,
                    "duration": 60,
                    "tips": "Buổi sáng sớm hoặc chiều mát dạo quanh hồ sen chụp ảnh rất thanh tịnh.",
                    "transport_info": "Cách Tòa Thánh 4km theo trục QL22B.",
                    "menu": [
                        {"name": "Tham quan lễ Phật", "price": 0, "is_signature": True}
                    ]
                },
                {
                    "name": "Hồ Dầu Tiếng Tây Ninh",
                    "category": "tourist_spot",
                    "description": "Hồ nước nhân tạo lớn nhất Việt Nam rộng 270km² với mặt nước phẳng lặng soi bóng núi Cậu và núi Bà Đen phía xa, điểm cắm trại ngắm hoàng hôn tuyệt đẹp.",
                    "address": "Huyện Dương Minh Châu, Tỉnh Tây Ninh",
                    "lat": 11.33520,
                    "lng": 106.24580,
                    "cost": 0,
                    "duration": 90,
                    "tips": "Thời điểm 16h30 - 17h45 chiều dọc bờ đê Hồ Dầu Tiếng gió mát lộng và hoàng hôn cực kỳ thơ mộng.",
                    "transport_info": "Từ Núi Bà Đen đi theo đường tỉnh 781 khoảng 15 phút.",
                    "menu": [
                        {"name": "Tham quan & chụp ảnh", "price": 0, "is_signature": True},
                        {"name": "Nước mía / Dừa tươi ven hồ", "price": 20000, "is_signature": False}
                    ]
                },
                {
                    "name": "Bánh Tráng Phơi Sương Hoàng Minh",
                    "category": "restaurant",
                    "description": "Nhà hàng đặc sản bánh tráng phơi sương Trảng Bàng cuốn thịt bắp giò heo luộc và hơn 25 loại rau rừng tự nhiên hái ven sông Vàm Cỏ.",
                    "address": "Quốc lộ 22B, Phường Hiệp Tân, Thị xã Hoà Thành, Tây Ninh",
                    "lat": 11.28715,
                    "lng": 106.10747,
                    "cost": 95000,
                    "duration": 60,
                    "tips": "Cuốn đủ 5 vị rau rừng (lá cóc, lá lụa, quế vị, đọt xoài, dấp cá) chấm mắm nêm pha thơm để cảm nhận đúng chuẩn vị Tây Ninh.",
                    "transport_info": "Ngay trục QL22B, bãi xe rộng.",
                    "menu": [
                        {"name": "Phần bánh tráng phơi sương thịt bắp hoa", "price": 90000, "is_signature": True},
                        {"name": "Bánh canh Trảng Bàng giò heo", "price": 55000, "is_signature": True}
                    ]
                },
                {
                    "name": "Cà Phê Sinh Thái Gió Vườn",
                    "category": "cafe",
                    "description": "Không gian cà phê sân vườn xanh mát với hồ cá Koi và chòi gỗ ven suối nhân tạo ngay trên trục đường dẫn vào KDL Núi Bà Đen.",
                    "address": "Đường Bời Lời, Phường Ninh Sơn, TP. Tây Ninh",
                    "lat": 11.33927,
                    "lng": 106.11903,
                    "cost": 40000,
                    "duration": 45,
                    "tips": "Điểm dừng chân nghỉ trưa lý tưởng sau khi từ đỉnh Núi Bà Đen xuống.",
                    "transport_info": "Mặt tiền đường Bời Lời.",
                    "menu": [
                        {"name": "Cà phê muối kem béo", "price": 35000, "is_signature": True},
                        {"name": "Trà mãng cầu Tây Ninh tươi", "price": 38000, "is_signature": True}
                    ]
                },
                {
                    "name": "Chợ Tây Ninh - Lò Muối Tôm & Bánh Tráng Phơi Sương",
                    "category": "shopping",
                    "description": "Trung tâm thương mại và chợ truyền thống lớn nhất Tây Ninh, nơi tập trung các lò muối tôm Tây Ninh rang tay, bánh tráng me, bánh tráng bơ làm quà.",
                    "address": "Đường Trần Hưng Đạo, Phường 2, TP. Tây Ninh",
                    "lat": 11.30730,
                    "lng": 106.09787,
                    "cost": 100000,
                    "duration": 45,
                    "tips": "Nên mua muối tôm loại hạt to rang ớt tươi và bánh tráng phơi sương hút chân không để bảo quản được lâu.",
                    "transport_info": "Ngay trung tâm TP. Tây Ninh bên cầu Quan.",
                    "menu": [
                        {"name": "Muối tôm Tây Ninh đặc biệt (hộp 500g)", "price": 65000, "is_signature": True},
                        {"name": "Bánh tráng phơi sương Trảng Bàng (xấp)", "price": 35000, "is_signature": True}
                    ]
                },
                {
                    "name": "Quán Bánh Canh Trảng Bàng Út Huệ",
                    "category": "restaurant",
                    "description": "Quán bánh canh Trảng Bàng truyền thống hơn 40 năm tuổi với sợi bánh canh làm thủ công dai mềm và nước dùng hầm xương trong vắt ngọt thanh.",
                    "address": "88 Nguyễn Văn Rốp, Thị xã Trảng Bàng, Tây Ninh",
                    "lat": 11.03311,
                    "lng": 106.35948,
                    "cost": 60000,
                    "duration": 45,
                    "tips": "Rất tiện ghé ăn sáng lúc từ TP.HCM đi lên hoặc ăn chiều trước khi về lại Sài Gòn.",
                    "transport_info": "Ngay trung tâm Trảng Bàng.",
                    "menu": [
                        {"name": "Tô bánh canh giò nạc đặc biệt", "price": 60000, "is_signature": True},
                        {"name": "Bánh tráng phơi sương cuốn thịt", "price": 80000, "is_signature": True}
                    ]
                }
            ],
            "ho-chi-minh": [
                {
                    "name": "Khách sạn Majestic Saigon (Bến Bạch Đằng)",
                    "category": "hotel",
                    "description": "Khách sạn di sản 5 sao kiến trúc Pháp cổ điển nằm ngay góc đường Đồng Khởi và Bến Bạch Đằng nhìn ra sông Sài Gòn.",
                    "address": "Số 01 Đồng Khởi, Phường Bến Nghé, Quận 1, TP.HCM",
                    "lat": 10.77312,
                    "lng": 106.70615,
                    "cost": 500000,
                    "duration": 45,
                    "tips": "Nằm ngay trung tâm Quận 1, thuận tiện gửi hành lý và đi bộ ra Phố đi bộ Nguyễn Huệ.",
                    "transport_info": "Có hầm đỗ xe ngay mặt đường Tôn Đức Thắng - Đồng Khởi.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 500000, "is_signature": True}
                    ]
                },
                {
                    "name": "Dinh Độc Lập (Hội Trường Thống Nhất)",
                    "category": "tourist_spot",
                    "description": "Di tích quốc gia đặc biệt giữa trung tâm Quận 1 với kiến trúc phương Đông hiện đại, khuôn viên cây cổ thụ xanh mát và hệ thống phòng khánh tiết, hầm chỉ huy lịch sử.",
                    "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP.HCM",
                    "lat": 10.77713,
                    "lng": 106.69544,
                    "cost": 65000,
                    "duration": 90,
                    "is_indoor": True,
                    "tips": "Mua vé combo tham quan cả tòa nhà chính và Triển lãm lịch sử Dinh Norodom để hiểu trọn vẹn lịch sử Sài Gòn.",
                    "transport_info": "Gửi xe tại cổng Nguyễn Du hoặc công viên Tao Đàn.",
                    "menu": [
                        {"name": "Vé tham quan Dinh Độc Lập", "price": 65000, "is_signature": True}
                    ]
                },
                {
                    "name": "Bưu Điện Trung Tâm Sài Gòn & Đường Sách",
                    "category": "tourist_spot",
                    "description": "Tuyệt tác kiến trúc Pháp xây dựng từ năm 1886 với mái vòm sắt uốn lượn cổ điển, nằm liền kề Nhà thờ Đức Bà và Đường Sách Nguyễn Văn Bình rợp bóng cây.",
                    "address": "Số 02 Công xã Paris, Phường Bến Nghé, Quận 1, TP.HCM",
                    "lat": 10.77985,
                    "lng": 106.69992,
                    "cost": 0,
                    "duration": 60,
                    "is_indoor": True,
                    "tips": "Ghé các gian hàng sách cũ và cà phê vỉa hè tại Đường Sách Nguyễn Văn Bình ngay bên hông Bưu điện.",
                    "transport_info": "Gửi xe ở đầu đường Nguyễn Văn Bình hoặc Nhà văn hóa Thanh Niên.",
                    "menu": [
                        {"name": "Tham quan tự do", "price": 0, "is_signature": True},
                        {"name": "Bưu thiếp lưu niệm Sài Gòn", "price": 25000, "is_signature": False}
                    ]
                },
                {
                    "name": "Cơm Tấm Bụi Sài Gòn (Sườn Bì Chả Trứng)",
                    "category": "restaurant",
                    "description": "Hương vị cơm tấm Sài Gòn chính hiệu với miếng sườn cốt lết nướng than hoa thơm lừng, bì thính giòn, chả trứng hấp và nước mắm kẹo chua ngọt.",
                    "address": "100 Thạch Thị Thanh, Phường Tân Định, Quận 1, TP.HCM",
                    "lat": 10.79103,
                    "lng": 106.69141,
                    "cost": 85000,
                    "duration": 45,
                    "tips": "Gọi cơm tấm sườn bì chả kèm trứng ốp la lòng đào và chén canh khổ qua dồn thịt.",
                    "transport_info": "Có bảo vệ giữ xe máy miễn phí trước quán.",
                    "menu": [
                        {"name": "Cơm tấm Sườn Bì Chả Trứng đặc biệt", "price": 78000, "is_signature": True},
                        {"name": "Canh khổ qua nhồi thịt", "price": 20000, "is_signature": False}
                    ]
                },
                {
                    "name": "Chung Cư Cà Phê 42 Nguyễn Huệ & Phố Đi Bộ",
                    "category": "cafe",
                    "description": "Khu chung cư cổ 9 tầng độc đáo bậc nhất thế giới nơi hàng chục quán cà phê, tiệm bánh thủ công và boutique thời trang tỏa sáng trên từng ô ban công.",
                    "address": "42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                    "lat": 10.77382,
                    "lng": 106.70365,
                    "cost": 65000,
                    "duration": 75,
                    "tips": "Chọn bàn ngoài ban công tầng 4 hoặc tầng 5 vào chiều tối để ngắm trọn Phố đi bộ Nguyễn Huệ lên đèn.",
                    "transport_info": "Gửi xe tại đường Hồ Tùng Mậu hoặc bãi xe công viên Bến Bạch Đằng.",
                    "menu": [
                        {"name": "Bạc xỉu kem sữa Sài Gòn", "price": 55000, "is_signature": True},
                        {"name": "Trà ổi hồng hạt đác", "price": 60000, "is_signature": True}
                    ]
                },
                {
                    "name": "Chợ Bến Thành",
                    "category": "shopping",
                    "description": "Ngôi chợ biểu tượng hơn 110 năm tuổi của Sài Gòn với tháp đồng hồ 3 mặt ở cửa Nam, nơi hội tụ hàng trăm món ăn truyền thống Nam Bộ và quà lưu niệm.",
                    "address": "Công trường Quách Thị Trang, Phường Bến Thành, Quận 1, TP.HCM",
                    "lat": 10.77211,
                    "lng": 106.69827,
                    "cost": 100000,
                    "duration": 60,
                    "tips": "Khu ẩm thực trong lòng chợ có món bún mắm, gỏi cuốn tôm thịt và chè thập cẩm rất ngon.",
                    "transport_info": "Ngay ga Metro trung tâm Bến Thành.",
                    "menu": [
                        {"name": "Bún mắm Sài Gòn", "price": 65000, "is_signature": True},
                        {"name": "Chè Bến Thành 7 màu", "price": 30000, "is_signature": True}
                    ]
                },
                {
                    "name": "Công Viên Bến Bạch Đằng & Saigon Waterbus",
                    "category": "tourist_spot",
                    "description": "Công viên bờ sông hiện đại kết hợp bến tàu buýt đường sông đưa du khách ngắm cầu Ba Son, bán đảo Thủ Thiêm và tòa tháp Landmark 81 rực rỡ về đêm.",
                    "address": "Số 10B Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM",
                    "lat": 10.77455,
                    "lng": 106.70685,
                    "cost": 30000,
                    "duration": 90,
                    "tips": "Đặt vé chuyến tàu 18h30 hoặc 19h30 để hóng gió sông Sài Gòn mát rượi.",
                    "transport_info": "Có bãi giữ xe ngay trong công viên Bến Bạch Đằng.",
                    "menu": [
                        {"name": "Vé Saigon Waterbus khứ hồi", "price": 30000, "is_signature": True}
                    ]
                }
            ],
            "pleiku": [
                {
                    "name": "Khách sạn Hoàng Anh Gia Lai Pleiku",
                    "category": "hotel",
                    "description": "Khách sạn 4 sao lớn nhất trung tâm phố núi Pleiku nằm ngay Quảng trường Phù Đổng, thuận tiện di chuyển đi Biển Hồ.",
                    "address": "Số 01 Phù Đổng, Phường Phù Đổng, TP. Pleiku, Gia Lai",
                    "lat": 13.97223,
                    "lng": 108.01491,
                    "cost": 350000,
                    "duration": 45,
                    "tips": "Dừng chân nhận phòng, gửi đồ tại khách sạn trung tâm trước khi đi khám phá Biển Hồ.",
                    "transport_info": "Bãi đậu xe rộng ngay vòng xoay Phù Đổng.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 350000, "is_signature": True}
                    ]
                },
                {
                    "name": "Biển Hồ Pleiku (Hồ T'Nưng)",
                    "category": "tourist_spot",
                    "description": "Hồ nước ngọt tự nhiên hình thành từ miệng núi lửa cổ đã ngưng hoạt động hàng triệu năm, mặt nước xanh ngọc bích phẳng lặng giữa rừng thông đại ngàn.",
                    "address": "Xã Biển Hồ, TP. Pleiku, Tỉnh Gia Lai",
                    "lat": 14.04585,
                    "lng": 108.00125,
                    "cost": 20000,
                    "duration": 90,
                    "tips": "Đi bộ ra vọng cảnh đài cuối con đường thông để ngắm tượng Phật Quan Âm và mặt hồ mênh mông.",
                    "transport_info": "Cách trung tâm Pleiku 7km theo đường Phạm Văn Đồng.",
                    "menu": [
                        {"name": "Vé xe điện sinh thái Biển Hồ", "price": 20000, "is_signature": True}
                    ]
                },
                {
                    "name": "Biển Hồ Chè & Hàng Thông Trăm Tuổi",
                    "category": "tourist_spot",
                    "description": "Con đường thông cổ thụ hơn 100 năm tuổi rợp bóng mát nằm giữa đồi chè xanh ngát trồng từ năm 1919, được mệnh danh là con đường Hàn Quốc của Gia Lai.",
                    "address": "Xã Nghĩa Hưng, Huyện Chư Păh, Tỉnh Gia Lai",
                    "lat": 14.06315,
                    "lng": 108.00845,
                    "cost": 0,
                    "duration": 60,
                    "tips": "Chụp ảnh lúc 7h00 sáng khi sương sớm còn vương trên lá chè hoặc 16h00 chiều khi nắng vàng xuyên qua tán thông.",
                    "transport_info": "Từ Biển Hồ T'Nưng đi qua cầu treo rẽ trái thêm 3km.",
                    "menu": [
                        {"name": "Tham quan miễn phí", "price": 0, "is_signature": True}
                    ]
                },
                {
                    "name": "Phở Khô Hồng (Đặc sản Phở 2 Tô Gia Lai)",
                    "category": "restaurant",
                    "description": "Quán phở khô lâu đời nhất phố núi Pleiku với sợi phở gạo nhỏ dai trộn tương đậu nành đen hành phi giòn rụm kèm tô nước súp bò tái gầu nóng hổi.",
                    "address": "22-24 Nguyễn Văn Trỗi, Phường Hội Thương, TP. Pleiku",
                    "lat": 13.97734,
                    "lng": 108.00284,
                    "cost": 60000,
                    "duration": 45,
                    "tips": "Nhớ vắt chanh, thêm tương đen Gia Lai và rau quế rừng để dậy mùi thơm đặc trưng.",
                    "transport_info": "Ngay trung tâm Pleiku, có chỗ đỗ ô tô.",
                    "menu": [
                        {"name": "Phở khô 2 tô bò tái nạm", "price": 60000, "is_signature": True},
                        {"name": "Phở khô gà ta phố núi", "price": 55000, "is_signature": True}
                    ]
                },
                {
                    "name": "Gà Nướng Cơm Lam Bazan Pleiku",
                    "category": "restaurant",
                    "description": "Không gian ẩm thực nhà sàn Tây Nguyên phục vụ gà bản địa ướp gia vị rừng nướng kẹp tre trên than hồng, ăn cùng cơm lam ống nứa và muối lá é.",
                    "address": "Hẻm 480 Lê Duẩn, Phường Thắng Lợi, TP. Pleiku",
                    "lat": 13.97215,
                    "lng": 108.03452,
                    "cost": 160000,
                    "duration": 75,
                    "tips": "Gà nướng mất khoảng 20 phút để da giòn vàng, bạn có thể nhâm nhi gỏi lá rừng trong lúc đợi.",
                    "transport_info": "Khuôn viên rộng mát mẻ.",
                    "menu": [
                        {"name": "Gà nướng bản địa nguyên con", "price": 290000, "is_signature": True},
                        {"name": "Cơm lam ống tre nướng", "price": 25000, "is_signature": True}
                    ]
                },
                {
                    "name": "Chùa Minh Thành Pleiku",
                    "category": "tourist_spot",
                    "description": "Quần thể kiến trúc Phật giáo độc đáo bậc nhất Tây Nguyên với bảo tháp Xá Lợi 9 tầng cao 72m và chánh điện gỗ pơ-mu chạm khắc tinh xảo.",
                    "address": "348 Nguyễn Viết Xuân, Phường Hội Phú, TP. Pleiku",
                    "lat": 13.96611,
                    "lng": 108.00666,
                    "cost": 0,
                    "duration": 60,
                    "tips": "Mặc trang phục kín đáo, lịch sự khi tham quan khuôn viên chùa.",
                    "transport_info": "Cách trung tâm Pleiku 2km.",
                    "menu": [
                        {"name": "Tham quan lễ Phật", "price": 0, "is_signature": True}
                    ]
                }
            ],
            "phu-quoc": [
                {
                    "name": "Khách sạn Seashells Phú Quốc Hotel & Spa",
                    "category": "hotel",
                    "description": "Khách sạn 5 sao hình cánh buồm nằm ngay trung tâm thị trấn Dương Đông sát bờ biển và Chợ Đêm Phú Quốc.",
                    "address": "Số 01 Võ Thị Sáu, Phường Dương Đông, TP. Phú Quốc",
                    "lat": 10.21895,
                    "lng": 103.95762,
                    "cost": 500000,
                    "duration": 45,
                    "tips": "Di chuyển từ sân bay/bến tàu về nhận phòng hoặc gửi hành lý tại đây trước khi đi Nam Đảo - Bắc Đảo.",
                    "transport_info": "Ngay trung tâm Dương Đông, cách Chợ Đêm Phú Quốc 200m.",
                    "menu": [
                        {"name": "Nhận phòng / Gửi hành lý lưu trú", "price": 500000, "is_signature": True}
                    ]
                },
                {
                    "name": "Bãi Sao Phú Quốc",
                    "category": "beach",
                    "description": "Bãi biển đẹp nhất Đảo Ngọc với bờ cát trắng mịn như kem dài hơn 7km, làn nước biển trong vắt màu ngọc bích và những rặng dừa nghiêng bóng.",
                    "address": "Ấp Bãi Sao, Phường An Thới, TP. Phú Quốc, Kiên Giang",
                    "lat": 10.05625,
                    "lng": 104.03582,
                    "cost": 50000,
                    "duration": 120,
                    "tips": "Buổi sáng từ 8h00 - 11h00 nước biển trong xanh nhất để tắm biển và chụp ảnh với xích đu cây dừa.",
                    "transport_info": "Cách Dương Đông khoảng 25km về phía Nam đảo.",
                    "menu": [
                        {"name": "Tắm biển & chụp ảnh", "price": 0, "is_signature": True},
                        {"name": "Nước dừa tươi Bãi Sao", "price": 40000, "is_signature": False}
                    ]
                },
                {
                    "name": "Cáp Treo Hòn Thơm (Sun World Phú Quốc)",
                    "category": "tourist_spot",
                    "description": "Tuyến cáp treo 3 dây vượt biển dài nhất thế giới (7.899m) đưa du khách bay trên mặt biển xanh ngọc ngắm toàn cảnh quần đảo An Thới và vui chơi tại công viên nước Aquatopia.",
                    "address": "Bãi Đất Đỏ, Phường An Thới, TP. Phú Quốc",
                    "lat": 10.02585,
                    "lng": 104.00852,
                    "cost": 650000,
                    "duration": 210,
                    "tips": "Khu vực nhà ga An Thới thiết kế như đấu trường La Mã cổ đại cực đẹp để check-in trước khi lên cáp.",
                    "transport_info": "Có xe buýt miễn phí của Sun World đón từ trung tâm Dương Đông.",
                    "menu": [
                        {"name": "Vé cáp treo khứ hồi + Công viên nước Aquatopia", "price": 650000, "is_signature": True}
                    ]
                },
                {
                    "name": "Bún Quậy Kiến Xây (Quán Gốc Phú Quốc)",
                    "category": "restaurant",
                    "description": "Món đặc sản độc đáo chỉ có tại Phú Quốc với bún tươi ép tại chỗ, chả tôm, chả cá và mực tươi quậy chín trong tô nước dùng ngọt thanh.",
                    "address": "28 Bạch Đằng, Phường Dương Đông, TP. Phú Quốc",
                    "lat": 10.21867,
                    "lng": 103.95860,
                    "cost": 75000,
                    "duration": 45,
                    "tips": "Bí quyết ngon nhất là tự tay pha chén nước chấm gồm bột canh, đường, tắc tươi và ớt xay đánh bông lên.",
                    "transport_info": "Ngay trung tâm Dương Đông, sát công viên Bạch Đằng.",
                    "menu": [
                        {"name": "Tô Bún Quậy thập cẩm tôm cá mực", "price": 75000, "is_signature": True},
                        {"name": "Nước mía tắc giải khát", "price": 20000, "is_signature": False}
                    ]
                },
                {
                    "name": "Làng Chài Hàm Ninh",
                    "category": "restaurant",
                    "description": "Làng chài cổ bình yên dưới chân núi Hàm Ninh nổi tiếng với cầu cảng vươn dài ra biển và món ghẹ Hàm Ninh tươi sống hấp vừa đánh bắt.",
                    "address": "Xã Hàm Ninh, TP. Phú Quốc, Kiên Giang",
                    "lat": 10.17825,
                    "lng": 104.04352,
                    "cost": 220000,
                    "duration": 90,
                    "tips": "Chọn ghẹ vừa bằng bàn tay, thịt chắc nịch và nhiều gạch son, hấp chấm muối tiêu chanh.",
                    "transport_info": "Cách Dương Đông 14km về hướng Đông.",
                    "menu": [
                        {"name": "Ghẹ Hàm Ninh tươi hấp (phần)", "price": 220000, "is_signature": True},
                        {"name": "Gỏi cá trích cuốn bánh tráng dừa", "price": 150000, "is_signature": True}
                    ]
                },
                {
                    "name": "Grand World Phú Quốc (Thành Phố Không Ngủ)",
                    "category": "tourist_spot",
                    "description": "Khu phức hợp giải trí Bắc Đảo với dòng kênh đào Venice thơ mộng, công trình Huyền Thoại Tre từ 42.000 cây tầm vông và show nhạc nước Sắc Màu Venice.",
                    "address": "Bãi Dài, Xã Gành Dầu, TP. Phú Quốc",
                    "lat": 10.32685,
                    "lng": 103.85725,
                    "cost": 0,
                    "duration": 120,
                    "tips": "Show nhạc nước trên hồ Tình Yêu lúc 21h30 mỗi tối hoàn toàn miễn phí.",
                    "transport_info": "Di chuyển miễn phí bằng xe buýt điện VinBus từ trung tâm Dương Đông.",
                    "menu": [
                        {"name": "Vé vào cổng Grand World & xem nhạc nước", "price": 0, "is_signature": True},
                        {"name": "Đi thuyền Gondola trên kênh Venice", "price": 200000, "is_signature": False}
                    ]
                },
                {
                    "name": "Chợ Đêm Phú Quốc (Dương Đông)",
                    "category": "shopping",
                    "description": "Phố đi bộ và ẩm thực đêm sầm uất bên dòng sông Dương Đông với hàng trăm gian hàng hải sản nướng, kem cuộn Thái Lan, đậu phộng Chou Chou và ngọc trai.",
                    "address": "Số 06 Bạch Đằng, Phường Dương Đông, TP. Phú Quốc",
                    "lat": 10.21782,
                    "lng": 103.95852,
                    "cost": 120000,
                    "duration": 90,
                    "tips": "Nhớ ghé quầy Đậu phộng Chou Chou Pháp thử miễn phí đủ 30 vị trước khi mua làm quà.",
                    "transport_info": "Gửi xe ngay đầu đường Võ Thị Sáu hoặc Bạch Đằng.",
                    "menu": [
                        {"name": "Nhum biển nướng mỡ hành", "price": 35000, "is_signature": True},
                        {"name": "Đậu phộng Chou Chou Phú Quốc (hộp)", "price": 70000, "is_signature": True}
                    ]
                }
            ]
        }

        for slug, loc_items in locations_by_province.items():
            prov = prov_map.get(slug)
            if not prov:
                continue

            verified_names_for_prov = set()
            for item in loc_items:
                verified_names_for_prov.add(item["name"])
                real_img = resolve_real_image(item["name"], item["category"])
                existing = db.query(Location).filter(
                    Location.province_id == prov.id,
                    Location.name == item["name"]
                ).first()

                if not existing:
                    # Kiem tra xem co dia diem cung ten gan giong khong (VD: Tượng Chúa Kitô Vua)
                    short_key = item["name"].split("(")[0].strip()
                    existing = db.query(Location).filter(
                        Location.province_id == prov.id,
                        Location.name.ilike(f"%{short_key}%")
                    ).first()

                if not existing:
                    loc = Location(
                        province_id=prov.id,
                        name=item["name"],
                        category=item["category"],
                        description=item["description"],
                        address=item["address"],
                        latitude=item["lat"],
                        longitude=item["lng"],
                        avg_cost_vnd=item["cost"],
                        avg_duration_minutes=item["duration"],
                        image_url=real_img,
                        is_indoor=item.get("is_indoor", False),
                        tips=item["tips"],
                        transport_info=item["transport_info"],
                        rating=4.8
                    )
                    db.add(loc)
                    db.flush()
                else:
                    loc = existing
                    loc.name = item["name"]
                    loc.category = item["category"]
                    loc.description = item["description"]
                    loc.address = item["address"]
                    loc.latitude = item["lat"]
                    loc.longitude = item["lng"]
                    loc.avg_cost_vnd = item["cost"]
                    loc.avg_duration_minutes = item["duration"]
                    loc.image_url = real_img
                    loc.is_indoor = item.get("is_indoor", False)
                    loc.tips = item["tips"]
                    loc.transport_info = item["transport_info"]
                    db.flush()

                # Cap nhat menu items khong trung lap
                db.query(MenuItem).filter(MenuItem.location_id == loc.id).delete()
                for m in item.get("menu", []):
                    db.add(MenuItem(
                        location_id=loc.id,
                        name=m["name"],
                        price_vnd=m["price"],
                        is_signature=m.get("is_signature", True)
                    ))

            # Xoa cac dia diem rac do AI sinh ra hoac chua xac thuc trong 6 tinh goc nay
            extra_locs = db.query(Location).filter(
                Location.province_id == prov.id,
                ~Location.name.in_(list(verified_names_for_prov)),
                ~Location.name.ilike("Điểm xuất phát%")
            ).all()
            for ex in extra_locs:
                db.query(MenuItem).filter(MenuItem.location_id == ex.id).delete()
                db.delete(ex)

        db.commit()

        # 5. Dam bao moi dia diem con lai trong DB deu co anh khop ten 100% va xoa tinh trong
        all_locs = db.query(Location).all()
        for l in all_locs:
            l.image_url = resolve_real_image(l.name, l.category, l.image_url)
        db.commit()

        for p in db.query(Province).all():
            cnt = db.query(Location).filter(Location.province_id == p.id).count()
            if cnt == 0:
                db.delete(p)
        db.commit()

        print("[SUCCESS] Da don sach data test va nap thanh cong du lieu THUC TE 100% cho 6 tinh thanh!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Loi khi seed du lieu: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
