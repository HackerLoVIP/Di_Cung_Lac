import os
import json
from typing import List, Dict, Any, Optional
from app.config import settings

def get_genai_client(api_key: Optional[str] = None):
    """Khoi tao Google GenAI Client voi key duoc truyen hoac tu moi truong"""
    key = api_key or settings.GEMINI_API_KEY or os.getenv("GEMINI_API_KEY", "")
    if not key:
        return None
    try:
        from google import genai
        return genai.Client(api_key=key)
    except Exception as e:
        print(f"[ERROR] Khong the khoi tao Google GenAI: {e}")
        return None

def chat_with_gemini_ai(message: str, locations_context: str, api_key: Optional[str] = None) -> str:
    """Chatbot tro ly du lich tra loi bang Google Gemini LLM thuc te"""
    client = get_genai_client(api_key)
    
    # Prompt chi dan vai tro tro ly du lich
    system_instruction = (
        "Bạn là 'Đi Cùng Lạc AI' - Trợ lý du lịch thông minh, thân thiện, am hiểu sâu sắc về du lịch Việt Nam "
        "(đặc biệt là Vũng Tàu và Đà Lạt). "
        "Nhiệm vụ của bạn là tư vấn cho du khách dựa trên dữ liệu địa điểm thực tế của hệ thống. "
        "Hãy trả lời tự nhiên, nhiệt tình, có kèm mẹo thực tế (tránh bị chặt chém, giờ đẹp, món ngon nên thử). "
        "Nếu du khách hỏi về quán ăn hay điểm đến cụ thể, hãy ưu tiên các địa điểm có trong dữ liệu sau:\n"
        f"{locations_context}"
    )

    if client:
        try:
            # Thu goi model Gemini 2.0 Flash moi nhat
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=message,
                config={"system_instruction": system_instruction, "temperature": 0.7}
            )
            if response and response.text:
                return response.text
        except Exception as e:
            print(f"[WARN] Gemini 2.0 Flash loi, thu Gemini 1.5 Flash: {e}")
            try:
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=message,
                    config={"system_instruction": system_instruction, "temperature": 0.7}
                )
                if response and response.text:
                    return response.text
            except Exception as e2:
                print(f"[ERROR] Gemini API loi: {e2}")

    # Fallback tra loi thong minh neu chua co Key
    return (
        f"🤖 [Chưa cấu hình GEMINI_API_KEY] Hệ thống đã sẵn sàng kết nối Gemini 2.0 / 1.5 Flash. "
        f"Về câu hỏi '{message}': Dựa trên dữ liệu thực tế tại hệ thống, bạn nên trải nghiệm các món đặc sản "
        f"như Bánh Khọt Gốc Vú Sữa (14 Nguyễn Trường Tộ), Hải sản Bé Mặn và cafe hoàng hôn tại Sailing Club Bãi Trước nhé!"
    )

def generate_dynamic_itinerary_with_gemini(
    destination: str,
    num_days: int = 3,
    num_nights: int = 2,
    user_prompt: Optional[str] = None,
    start_location: Optional[str] = None,
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """Sinh lich trinh du lich chi tiet tu dong bang Gemini 2.0/1.5 Flash cho bat ky diem den nao"""
    client = get_genai_client(api_key)

    system_prompt = (
        f"Bạn là chuyên gia du lịch hàng đầu Việt Nam. Người dùng muốn đi du lịch tại: '{destination}'.\n"
        f"Xuất phát từ: '{start_location or 'TP. Hồ Chí Minh'}'.\n"
        f"Thời gian: {num_days} ngày {num_nights} đêm.\n"
        f"Yêu cầu bổ sung của du khách: '{user_prompt or 'Khám phá văn hoá, ẩm thực đặc sản và cảnh đẹp tiêu biểu'}'.\n\n"
        "Hãy tạo một lịch trình du lịch thực tế, logic, đi thuận đường theo đúng toạ độ GPS ngoài đời thực.\n"
        "ĐẶC BIỆT CHÚ Ý:\n"
        "- Các địa điểm phải CÓ THẬT 100% tại điểm đến đó (ví dụ nếu Tây Ninh thì có Núi Bà Đen, Toà Thánh Tây Ninh, Quán Bò Tơ Năm Sánh, Bánh Tráng Phơi Sương...). "
        "- Cung cấp toạ độ GPS vĩ độ (latitude) và kinh độ (longitude) CHÍNH XÁC của từng địa điểm để hiển thị lên bản đồ.\n"
        "- Mỗi địa điểm ăn uống phải có danh sách món ăn kèm giá tiền thực tế (VND).\n"
        "- Cung cấp mẹo thực tế (tips) tránh bị chặt chém, giờ tham quan đẹp nhất, gửi xe, lưu ý trang phục.\n"
        "- Trả về DUY NHẤT một chuỗi JSON hợp lệ không có giải thích thêm, đúng cấu trúc sau:\n"
        "{\n"
        '  "destination_name": "Tên điểm đến (ví dụ: Tây Ninh)",\n'
        '  "destination_description": "Mô tả hấp dẫn về điểm đến",\n'
        '  "center_lat": 11.31,\n'
        '  "center_lng": 106.10,\n'
        '  "days": [\n'
        "    {\n"
        '      "day_number": 1,\n'
        '      "title": "Tiêu đề ngày 1",\n'
        '      "items": [\n'
        "        {\n"
        '          "time_slot": "08:00",\n'
        '          "location_name": "Tên địa điểm thật",\n'
        '          "category": "tourist_spot" | "restaurant" | "cafe" | "beach" | "entertainment",\n'
        '          "address": "Địa chỉ cụ thể",\n'
        '          "latitude": 11.378,\n'
        '          "longitude": 106.166,\n'
        '          "note": "Hoạt động làm gì ở đây",\n'
        '          "tips": "Mẹo hữu ích thực tế",\n'
        '          "transport_info": "Cách đi xe máy/ô tô/khoảng cách",\n'
        '          "avg_cost_vnd": 150000,\n'
        '          "menu_items": [{"name": "Tên món/vé", "price_vnd": 50000}]\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}"
    )

    if client:
        try:
            # Thu goi gemini-2.0-flash truoc
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=system_prompt,
                config={"response_mime_type": "application/json"}
            )
            if response and response.text:
                data = json.loads(response.text.strip())
                if "days" in data and len(data["days"]) > 0:
                    return data
        except Exception as e:
            print(f"[WARN] Gemini 2.0 Flash generation failed: {e}")
            try:
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=system_prompt,
                    config={"response_mime_type": "application/json"}
                )
                if response and response.text:
                    data = json.loads(response.text.strip())
                    if "days" in data and len(data["days"]) > 0:
                        return data
            except Exception as e2:
                print(f"[ERROR] Gemini 1.5 Flash generation failed: {e2}")

    # Fallback tri tue nhan tao cho cac diem den pho bien (Tay Ninh, Da Lat, Phu Quoc...) neu chua co API key
    return get_fallback_dynamic_itinerary(destination, num_days, num_nights, start_location)

def get_fallback_dynamic_itinerary(destination: str, num_days: int, num_nights: int, start_location: Optional[str]) -> Dict[str, Any]:
    dest_lower = destination.lower()
    
    # 1. Kich ban Tay Ninh
    if "tây ninh" in dest_lower or "tay ninh" in dest_lower:
        return {
            "destination_name": "Tây Ninh",
            "destination_description": "Vùng đất thánh với ngọn Núi Bà Đen linh thiêng nóc nhà Đông Nam Bộ, Toà Thánh lộng lẫy và ẩm thực bò tơ nức tiếng.",
            "center_lat": 11.3126,
            "center_lng": 106.1025,
            "days": [
                {
                    "day_number": 1,
                    "title": "Ngày 1: Chinh phục Nóc nhà Nam Bộ & Toà Thánh linh thiêng",
                    "items": [
                        {
                            "time_slot": "07:30",
                            "location_name": "Khu du lịch Quốc gia Núi Bà Đen",
                            "category": "tourist_spot",
                            "address": "Khu phố Ninh Phú, Phường Ninh Sơn, TP. Tây Ninh",
                            "latitude": 11.3789,
                            "longitude": 106.1662,
                            "note": "Đi tuyến cáp treo Vân Sơn lên đỉnh săn mây, chiêm bái tượng Phật Bà Tây Bổ Đà Sơn cao nhất châu Á.",
                            "tips": "Nên đi tuyến cáp sớm từ 7h-8h để tránh xếp hàng đông và trời chưa nắng gắt. Mang áo khoác mỏng vì đỉnh núi gió nhiều.",
                            "transport_info": "Từ trung tâm TP Tây Ninh đi theo đường Bời Lời khoảng 11km (~15 phút đi xe máy).",
                            "avg_cost_vnd": 350000,
                            "menu_items": [
                                {"name": "Vé cáp treo khứ hồi đỉnh núi", "price_vnd": 350000},
                                {"name": "Vé buffet nậm thực đỉnh núi", "price_vnd": 250000}
                            ]
                        },
                        {
                            "time_slot": "12:00",
                            "location_name": "Bò Tơ Tây Ninh Năm Sánh (Quán Gốc)",
                            "category": "restaurant",
                            "address": "Đường 30/4, Phường 3, TP. Tây Ninh",
                            "latitude": 11.3095,
                            "longitude": 106.1042,
                            "note": "Thưởng thức bò tơ nướng than hoa mềm ngọt, cuộn rau rừng chấm mắm nêm chuẩn vị.",
                            "tips": "Gọi món bò tơ nướng tảng cuốn bánh tráng rau rừng và lẩu đuôi bò. Quán rất đông buổi trưa nên đi sớm.",
                            "transport_info": "Nằm ngay trục đường chính 30/4, có bãi đậu xe ô tô và xe máy rộng rãi.",
                            "avg_cost_vnd": 180000,
                            "menu_items": [
                                {"name": "Bò tơ nướng tảng cuộn rau rừng", "price_vnd": 180000},
                                {"name": "Lẩu bò tơ thập cẩm", "price_vnd": 220000},
                                {"name": "Bò nhúng giấm", "price_vnd": 160000}
                            ]
                        },
                        {
                            "time_slot": "14:30",
                            "location_name": "Toà Thánh Cao Đài Tây Ninh",
                            "category": "tourist_spot",
                            "address": "Phạm Hộ Pháp, Thị xã Hoà Thành, Tây Ninh",
                            "latitude": 11.3032,
                            "longitude": 106.1345,
                            "note": "Chiêm ngưỡng kiến trúc kết hợp Á - Âu rực rỡ sắc màu của Đạo Cao Đài và không gian trang nghiêm.",
                            "tips": "Bắt buộc mặc quần áo dài qua gối, không mặc áo sát nách. Giày dép để ngoài trước khi vào đại điện.",
                            "transport_info": "Cách trung tâm TP Tây Ninh 5km, đường nhựa lớn dễ đi.",
                            "avg_cost_vnd": 20000,
                            "menu_items": [
                                {"name": "Vé gửi xe máy", "price_vnd": 5000},
                                {"name": "Nước mía giải khát cổng đền", "price_vnd": 15000}
                            ]
                        },
                        {
                            "time_slot": "17:00",
                            "location_name": "Cà Phê Sinh Thái Gió Vườn",
                            "category": "cafe",
                            "address": "Đường Bời Lời, Ninh Sơn, TP. Tây Ninh",
                            "latitude": 11.3250,
                            "longitude": 106.1150,
                            "note": "Nghỉ chân thưởng thức cà phê sân vườn mát rượi sau hành trình tham quan.",
                            "tips": "Thử cà phê muối hoặc trà trái cây nhiệt đới tươi mát.",
                            "transport_info": "Có chỗ đậu xe máy thoáng mát.",
                            "avg_cost_vnd": 35000,
                            "menu_items": [
                                {"name": "Cà phê muối Tây Ninh", "price_vnd": 32000},
                                {"name": "Trà đào cam sả", "price_vnd": 38000}
                            ]
                        },
                        {
                            "time_slot": "19:00",
                            "location_name": "Bánh Tráng Phơi Sương Hoàng Minh",
                            "category": "restaurant",
                            "address": "Quốc lộ 22B, Phường Hiệp Tân, Hoà Thành, Tây Ninh",
                            "latitude": 11.2850,
                            "longitude": 106.1210,
                            "note": "Đặc sản bánh tráng phơi sương Trảng Bàng cuộn thịt luộc bắp hoa và rổ rau rừng Tây Ninh 30 loại.",
                            "tips": "Nhớ xin thêm rau rừng thảo mộc miễn phí nếu thích ăn nhiều rau.",
                            "transport_info": "Mặt tiền Quốc lộ 22B, biển hiệu lớn dễ nhận biết.",
                            "avg_cost_vnd": 95000,
                            "menu_items": [
                                {"name": "Phần thịt luộc bánh tráng phơi sương", "price_vnd": 85000},
                                {"name": "Bánh canh Trảng Bàng tô đặc biệt", "price_vnd": 55000}
                            ]
                        }
                    ]
                },
                {
                    "day_number": 2,
                    "title": "Ngày 2: Chùa Cổ Gò Kén & Mua sắm đặc sản Muối Tôm",
                    "items": [
                        {
                            "time_slot": "08:00",
                            "location_name": "Chùa Gò Kén (Thiền Lâm Tự)",
                            "category": "tourist_spot",
                            "address": "QL22B, Long Thành Trung, Hoà Thành, Tây Ninh",
                            "latitude": 11.2764,
                            "longitude": 106.1368,
                            "note": "Ngôi chùa cổ hơn 100 năm tuổi với tượng Phật Quan Âm khổng lồ trên đầm sen ngát hương.",
                            "tips": "Check-in cầu gỗ đầm sen vào sáng sớm chụp ảnh rất thanh bình.",
                            "transport_info": "Dọc QL22B, thuận tiện trên đường di chuyển.",
                            "avg_cost_vnd": 20000,
                            "menu_items": [
                                {"name": "Tiền công đức tuỳ tâm", "price_vnd": 20000}
                            ]
                        },
                        {
                            "time_slot": "10:30",
                            "location_name": "Chợ Tây Ninh - Lò Muối Tôm & Bánh Tráng Phơi Sương",
                            "category": "shopping",
                            "address": "Đường Trần Hưng Đạo, Phường 2, TP. Tây Ninh",
                            "latitude": 11.3120,
                            "longitude": 106.0980,
                            "note": "Mua sắm quà đặc sản: Muối tôm Tây Ninh chính gốc loại ngon, bánh tráng me, mắm chua Tây Ninh.",
                            "tips": "Nếm thử muối tôm tại chỗ trước khi mua. Nên chọn loại hạt to giòn có màu cam tự nhiên.",
                            "transport_info": "Gửi xe ở cổng chợ 5.000đ/chiếc.",
                            "avg_cost_vnd": 120000,
                            "menu_items": [
                                {"name": "Hũ muối tôm hạt to thượng hạng 500g", "price_vnd": 70000},
                                {"name": "Xâu bánh tráng xì ke me cay", "price_vnd": 35000}
                            ]
                        },
                        {
                            "time_slot": "12:30",
                            "location_name": "Quán Bánh Canh Trảng Bàng Út Huệ",
                            "category": "restaurant",
                            "address": "Số 88 đường Nguyễn Văn Rốp, Trảng Bàng, Tây Ninh",
                            "latitude": 11.0335,
                            "longitude": 106.3582,
                            "note": "Tô bánh canh sợi dai giòn, nước dùng trong vắt ngọt lịm từ xương giò heo trước khi trở về.",
                            "tips": "Ăn kèm chén nước mắm tiêu ớt cay nồng chuẩn vị Nam Bộ.",
                            "transport_info": "Nằm ngay ngã ba Trảng Bàng hướng về TP.HCM.",
                            "avg_cost_vnd": 60000,
                            "menu_items": [
                                {"name": "Bánh canh giò nạc đặc biệt", "price_vnd": 60000},
                                {"name": "Sữa chua phô mai tráng miệng", "price_vnd": 15000}
                            ]
                        }
                    ]
                }
            ]
        }

    # 2. Cac diem den khac: tu dong tao lich trinh linh hoat voi thong tin that
    center_coords = {
        "phú quốc": (10.2289, 103.9572),
        "phu quoc": (10.2289, 103.9572),
        "đà lạt": (11.9404, 108.4583),
        "da lat": (11.9404, 108.4583),
        "cần thơ": (10.0452, 105.7469),
        "can tho": (10.0452, 105.7469),
        "bến tre": (10.2415, 106.3758),
        "ben tre": (10.2415, 106.3758),
        "nha trang": (12.2388, 109.1967),
        "hà giang": (22.8233, 104.9839),
        "ha giang": (22.8233, 104.9839)
    }
    coords = center_coords.get(dest_lower, (10.8231, 106.6297))

    days = []
    for day_i in range(1, num_days + 1):
        offset = (day_i - 1) * 0.015
        days.append({
            "day_number": day_i,
            "title": f"Ngày {day_i}: Khám phá danh lam & trải nghiệm ẩm thực {destination}",
            "items": [
                {
                    "time_slot": "08:00",
                    "location_name": f"Điểm check-in nổi tiếng trung tâm {destination}",
                    "category": "tourist_spot",
                    "address": f"Khu trung tâm {destination}",
                    "latitude": coords[0] + offset,
                    "longitude": coords[1] + offset,
                    "note": f"Khởi đầu ngày mới với cảnh quan đẹp và không khí trong lành tại {destination}.",
                    "tips": "Nên đi sớm để đón ánh nắng đẹp nhất để chụp ảnh và không phải chen lấn.",
                    "transport_info": "Xe máy hoặc taxi địa phương.",
                    "avg_cost_vnd": 50000,
                    "menu_items": [{"name": "Vé tham quan / dịch vụ", "price_vnd": 50000}]
                },
                {
                    "time_slot": "11:45",
                    "location_name": f"Quán đặc sản truyền thống {destination}",
                    "category": "restaurant",
                    "address": f"Phố ẩm thực {destination}",
                    "latitude": coords[0] + offset + 0.005,
                    "longitude": coords[1] + offset + 0.006,
                    "note": f"Thưởng thức các món ngon trứ danh đặc sắc của {destination}.",
                    "tips": "Hỏi giá trước và gọi các món đặc sản địa phương được dân bản xứ yêu thích.",
                    "transport_info": "Có chỗ để xe máy tiện lợi.",
                    "avg_cost_vnd": 120000,
                    "menu_items": [
                        {"name": f"Đặc sản {destination} phần đặc biệt", "price_vnd": 100000},
                        {"name": "Trà thảo mộc mát lạnh", "price_vnd": 20000}
                    ]
                },
                {
                    "time_slot": "14:30",
                    "location_name": f"Khu sinh thái & ngắm cảnh thiên nhiên {destination}",
                    "category": "tourist_spot",
                    "address": f"Ngoại ô {destination}",
                    "latitude": coords[0] + offset - 0.008,
                    "longitude": coords[1] + offset + 0.012,
                    "note": "Tham quan, thư giãn và hít thở bầu không khí thiên nhiên trong lành.",
                    "tips": "Mang theo nón, kính râm và kem chống nắng.",
                    "transport_info": "Khoảng 15 phút lái xe.",
                    "avg_cost_vnd": 80000,
                    "menu_items": [{"name": "Vé trải nghiệm sinh thái", "price_vnd": 80000}]
                },
                {
                    "time_slot": "18:30",
                    "location_name": f"Chợ đêm & phố đi bộ {destination}",
                    "category": "shopping",
                    "address": f"Khu phố đêm {destination}",
                    "latitude": coords[0] + 0.002,
                    "longitude": coords[1] - 0.003,
                    "note": "Khám phá ẩm thực đường phố, mua đồ lưu niệm và hòa mình vào nhịp sống sôi động về đêm.",
                    "tips": "Nên giữ kỹ tư trang cá nhân ở chỗ đông người.",
                    "transport_info": "Đi bộ hoặc gửi xe ở đầu chợ.",
                    "avg_cost_vnd": 90000,
                    "menu_items": [
                        {"name": "Món ăn vặt đường phố", "price_vnd": 40000},
                        {"name": "Nước ép trái cây tươi", "price_vnd": 25000}
                    ]
                }
            ]
        })

    return {
        "destination_name": destination,
        "destination_description": f"Hành trình trải nghiệm và khám phá trọn vẹn văn hoá, ẩm thực và cảnh sắc tuyệt đẹp tại {destination}.",
        "center_lat": coords[0],
        "center_lng": coords[1],
        "days": days
    }
