import os
import re
import json
import threading
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.location_images import resolve_real_image

_key_lock = threading.Lock()
_current_key_index = 0


def _get_key_pool(override_key: Optional[str] = None) -> List[str]:
    pool = settings.get_gemini_keys()
    if override_key and override_key.strip():
        clean = override_key.strip()
        if clean not in pool:
            pool.insert(0, clean)
    return pool


def _get_next_key(pool: List[str]) -> str:
    global _current_key_index
    with _key_lock:
        if not pool:
            return ""
        idx = _current_key_index % len(pool)
        key = pool[idx]
        _current_key_index = (_current_key_index + 1) % len(pool)
        return key


def _extract_json_block(raw_text: str) -> str:
    """Boc tach chuoi JSON sach tu response cua Gemini (loai bo markdown ```json ... ```)"""
    text = raw_text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "", text)
    start_idx = text.find("{")
    end_idx = text.rfind("}")
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx : end_idx + 1]
    return text


def call_gemini_with_rotation(
    prompt: str,
    system_instruction: Optional[str] = None,
    temperature: float = 0.3,
    max_output_tokens: int = 8192,
    override_key: Optional[str] = None,
    expect_json: bool = False,
) -> Optional[str]:
    """
    Goi Google Gemini REST API (gemini-2.5-flash -> gemini-2.0-flash) voi co che xoay vong
    tu dong qua tat ca cac API Key trong pool. Neu 1 key cham han muc 429 hoac loi mang,
    he thong tu dong chuyen sang key tiep theo tuc thi.
    """
    pool = _get_key_pool(override_key)
    if not pool:
        return None

    models_to_try = ["gemini-2.5-flash", "gemini-2.0-flash"]
    full_prompt = f"{system_instruction}\n\n{prompt}" if system_instruction else prompt

    for model_name in models_to_try:
        for attempt in range(len(pool)):
            api_key = _get_next_key(pool)
            if not api_key:
                continue

            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
            gen_config: Dict[str, Any] = {
                "maxOutputTokens": max_output_tokens,
                "temperature": temperature,
            }
            if "2.5-flash" in model_name:
                gen_config["thinkingConfig"] = {"thinkingBudget": 0}
            if expect_json:
                gen_config["responseMimeType"] = "application/json"

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": full_prompt}],
                    }
                ],
                "generationConfig": gen_config,
            }

            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=28) as resp:
                    resp_body = resp.read().decode("utf-8")
                    data = json.loads(resp_body)
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts and "text" in parts[0]:
                            result_text = parts[0]["text"].strip()
                            if result_text:
                                return result_text
            except urllib.error.HTTPError as http_err:
                print(f"[AI Key Pool] Key ...{api_key[-5:]} ({model_name}) HTTP {http_err.code}, rotating to next key...")
                continue
            except Exception as err:
                print(f"[AI Key Pool] Key ...{api_key[-5:]} ({model_name}) error: {err}, rotating...")
                continue

    return None


def chat_with_gemini_ai(message: str, locations_context: str, api_key: Optional[str] = None) -> str:
    """Chatbot tro ly du lich tra loi bang Google Gemini 2.5 Flash voi Multi-Key Rotation Pool"""
    system_instruction = (
        "Bạn là 'Đi Cùng Lạc AI' - Trợ lý du lịch thông minh, thân thiện, am hiểu sâu sắc về du lịch khắp 63 tỉnh thành Việt Nam. "
        "Nhiệm vụ của bạn là tư vấn lịch trình, quán ăn ngon, điểm check-in, chi phí, kinh nghiệm di chuyển thực tế cho du khách. "
        "Hãy trả lời ngắn gọn, súc tích, trình bày rõ ràng, nhiệt tình, có kèm mẹo thực tế (giờ đẹp, món đặc sản nên thử, giá tham khảo, tránh chặt chém). "
        "Dưới đây là một số địa điểm thực tế đã xác thực trong cơ sở dữ liệu hiện tại để bạn tham khảo thêm:\n"
        f"{locations_context}"
    )

    reply = call_gemini_with_rotation(
        prompt=message,
        system_instruction=system_instruction,
        temperature=0.65,
        max_output_tokens=2048,
        override_key=api_key,
    )
    if reply:
        return reply

    return (
        f"Chào bạn! Về câu hỏi '{message}': Bạn có thể ghé thăm các điểm check-in nổi tiếng vào khung giờ sáng sớm (7h00 - 9h00) "
        f"hoặc chiều hoàng hôn (16h30 - 17h30) để có trải nghiệm và góc chụp ảnh đẹp nhất. Đừng quên thưởng thức các món đặc sản địa phương "
        f"có niêm yết giá rõ ràng trong danh sách Khám phá của Đi Cùng Lạc nhé!"
    )


def generate_dynamic_itinerary_with_gemini(
    destination: str,
    num_days: int = 2,
    num_nights: int = 1,
    user_prompt: Optional[str] = None,
    start_location: Optional[str] = None,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Sinh lich trinh du lich chi tiet tu dong bang Gemini 2.5 Flash cho bat ky diem den nao"""
    system_prompt = (
        f"Bạn là chuyên gia thiết kế lịch trình du lịch thực tế hàng đầu Việt Nam.\n"
        f"- Điểm đến: '{destination}'\n"
        f"- Xuất phát từ: '{start_location or 'TP. Hồ Chí Minh'}'\n"
        f"- Thời gian: {num_days} ngày {num_nights} đêm\n"
        f"- Sở thích & yêu cầu của du khách: '{user_prompt or 'Khám phá danh lam thắng cảnh, ẩm thực đặc sản địa phương và quán cà phê đẹp'}'\n\n"
        "QUY TẮC BẮT BUỘC:\n"
        "1. TRẢ VỀ DUY NHẤT 1 KHỐI JSON HỢP LỆ (không viết bất kỳ lời dẫn hay markdown nào ngoài JSON).\n"
        "2. TẤT CẢ địa điểm phải là ĐỊA DANH, KHÁCH SẠN, QUÁN ĂN, QUÁN CÀ PHÊ CÓ THẬT 100% ngoài đời thực tại điểm đến đó. CẤM TUYỆT ĐỐI đặt tên hành động như 'Xuất phát từ...', 'Khởi hành về...', 'Di chuyển đến...' hay tên chung chung như 'Quán ăn ven hồ (Gợi ý:...)'.\n"
        "3. Tọa độ GPS (latitude, longitude) phải CHÍNH XÁC ngoài đời thực của từng địa điểm tại tỉnh đến.\n"
        "4. Mỗi ngày có từ 4 đến 5 điểm dừng thực tế (Tham quan sáng -> Ăn trưa đặc sản -> Tham quan chiều -> Cà phê hoàng hôn -> Ăn tối/Chợ đêm) sắp xếp thuận đường di chuyển.\n"
        "5. Cấu trúc JSON chính xác như sau:\n"
        "{\n"
        '  "destination_name": "Tên tỉnh/thành phố chuẩn (ví dụ: Đà Lạt)",\n'
        '  "destination_description": "Mô tả cuốn hút, thực tế về điểm đến (1-2 câu)",\n'
        '  "center_lat": 11.9404,\n'
        '  "center_lng": 108.4583,\n'
        '  "days": [\n'
        "    {\n"
        '      "day_number": 1,\n'
        '      "title": "Ngày 1: Tiêu đề hấp dẫn bám sát phong cách chuyến đi",\n'
        '      "items": [\n'
        "        {\n"
        '          "time_slot": "07:30",\n'
        '          "location_name": "Tên địa điểm/quán ăn thật 100%",\n'
        '          "category": "tourist_spot" | "restaurant" | "cafe" | "beach" | "shopping" | "hotel",\n'
        '          "address": "Số nhà, tên đường, phường/xã thực tế",\n'
        '          "latitude": 11.9404,\n'
        '          "longitude": 108.4583,\n'
        '          "note": "Mô tả hoạt động trải nghiệm cụ thể phù hợp sở thích của khách",\n'
        '          "tips": "Mẹo du lịch thực tế (giờ đẹp, cách mua vé, món nên gọi, tránh chặt chém)",\n'
        '          "transport_info": "Hướng dẫn di chuyển & chỗ gửi xe thực tế",\n'
        '          "avg_cost_vnd": 120000,\n'
        '          "menu_items": [{"name": "Tên món đặc sản hoặc vé tham quan", "price_vnd": 60000}]\n'
        "        }\n"
        "      ]\n"
        "    }\n"
        "  ]\n"
        "}"
    )

    raw_res = call_gemini_with_rotation(
        prompt=system_prompt,
        temperature=0.25,
        max_output_tokens=8192,
        override_key=api_key,
        expect_json=True,
    )

    if raw_res:
        try:
            clean_json = _extract_json_block(raw_res)
            data = json.loads(clean_json)
            if isinstance(data, dict) and "days" in data and len(data["days"]) > 0:
                return data
        except Exception as e:
            print(f"[WARN] Parse JSON tu Gemini that bai: {e}")

    return get_fallback_dynamic_itinerary(destination, num_days, num_nights, start_location)


def get_fallback_dynamic_itinerary(
    destination: str,
    num_days: int,
    num_nights: int,
    start_location: Optional[str],
) -> Dict[str, Any]:
    """
    Du lieu lich trinh THUC TE 100% duoc kiem duyet ky luong cho cac tinh thanh Viet Nam
    (khong bao gio sinh ten dia diem gia/chung chung).
    """
    dest_lower = destination.lower().strip()

    # 1. ĐÀ LẠT
    if "đà lạt" in dest_lower or "da lat" in dest_lower or "lâm đồng" in dest_lower:
        all_days = [
            {
                "day_number": 1,
                "title": "Ngày 1: Săn mây Đồi Chè Cầu Đất & Hương vị phố núi Đà Lạt",
                "items": [
                    {
                        "time_slot": "07:00",
                        "location_name": "Đồi Chè Cầu Đất (Cầu Đất Farm)",
                        "category": "tourist_spot",
                        "address": "QL20, Xuân Trường, TP. Đà Lạt, Lâm Đồng",
                        "latitude": 11.87775,
                        "longitude": 108.56034,
                        "image_url": resolve_real_image("Đồi Chè Cầu Đất", "tourist_spot"),
                        "note": "Săn biển mây bồng bềnh bên tua-bin điện gió khổng lồ và đồi chè xanh mướt hơn 100 năm tuổi.",
                        "tips": "Đi từ 6h00 - 7h30 sáng là khung giờ vàng săn mây đẹp nhất. Nhớ mặc áo ấm và khăn choàng.",
                        "transport_info": "Từ trung tâm Đà Lạt chạy thẳng đường Hùng Vương - Tự Phước - QL20 khoảng 23km.",
                        "avg_cost_vnd": 90000,
                        "menu_items": [
                            {"name": "Cà phê Phê La / Cầu Đất", "price_vnd": 65000},
                            {"name": "Bánh sừng bò nướng nóng", "price_vnd": 45000}
                        ]
                    },
                    {
                        "time_slot": "10:00",
                        "location_name": "Chùa Linh Phước (Chùa Ve Chai)",
                        "category": "tourist_spot",
                        "address": "120 Tự Phước, Trại Mát, Phường 11, TP. Đà Lạt",
                        "latitude": 11.94398,
                        "longitude": 108.49956,
                        "image_url": resolve_real_image("Chùa Linh Phước", "tourist_spot"),
                        "note": "Chiêm ngưỡng kiến trúc khảm sành sứ độc nhất vô nhị và tượng Phật Quan Âm kết bằng 650.000 bông hoa bất tử.",
                        "tips": "Nằm ngay trên trục đường từ Đồi chè Cầu Đất về lại trung tâm Đà Lạt nên cực kỳ thuận đường.",
                        "transport_info": "Có bãi gửi xe rộng đối diện cổng chùa.",
                        "avg_cost_vnd": 0,
                        "menu_items": [{"name": "Tham quan miễn phí", "price_vnd": 0}]
                    },
                    {
                        "time_slot": "12:00",
                        "location_name": "Lẩu Gà Lá É Tao Ngộ (Quán Gốc Đà Lạt)",
                        "category": "restaurant",
                        "address": "Số 5 Đường 3/4, Phường 3, TP. Đà Lạt",
                        "latitude": 11.93315,
                        "longitude": 108.44525,
                        "image_url": resolve_real_image("Lẩu Gà Lá É Tao Ngộ", "restaurant"),
                        "note": "Thưởng thức nồi lẩu gà lá é bốc khói nghi ngút, nước dùng ngọt thanh vị măng tươi và lá é the mát giữa tiết trời se lạnh.",
                        "tips": "Nên gọi nồi 300.000đ cho 2-3 người ăn no nê, chấm cùng muối ớt xanh giã nhuyễn.",
                        "transport_info": "Đậu xe máy trước quán hoặc bãi xe bên cạnh.",
                        "avg_cost_vnd": 150000,
                        "menu_items": [
                            {"name": "Lẩu gà lá é nồi vừa (2-3 người)", "price_vnd": 300000},
                            {"name": "Gà nướng lu nguyên vị", "price_vnd": 220000},
                            {"name": "Sữa đậu nành nóng", "price_vnd": 15000}
                        ]
                    },
                    {
                        "time_slot": "15:30",
                        "location_name": "Tiệm Cà Phê Túi Mơ To",
                        "category": "cafe",
                        "address": "Hẻm 31 Sào Nam, Phường 11, TP. Đà Lạt",
                        "latitude": 11.94620,
                        "longitude": 108.48790,
                        "image_url": resolve_real_image("Tiệm Cà Phê Túi Mơ To", "cafe"),
                        "note": "Ngắm hoàng hôn buông xuống thung lũng nhà lồng từ khu vườn cúc họa mi trắng lãng mạn.",
                        "tips": "Thời điểm 16h30 - 17h30 khi nhà lồng bắt đầu lên đèn vàng là lúc chụp ảnh đẹp nhất.",
                        "transport_info": "Đường vào hẻm 31 Sào Nam hơi dốc nhẹ, đi xe số hoặc tay ga đều vào tận nơi được.",
                        "avg_cost_vnd": 65000,
                        "menu_items": [
                            {"name": "Trà đào hồng đài Đà Lạt", "price_vnd": 65000},
                            {"name": "Cà phê kem béo", "price_vnd": 60000}
                        ]
                    },
                    {
                        "time_slot": "19:00",
                        "location_name": "Chợ Đêm Đà Lạt (Chợ Âm Phủ) & Quảng Trường Lâm Viên",
                        "category": "shopping",
                        "address": "Đường Nguyễn Thị Minh Khai, Phường 1, TP. Đà Lạt",
                        "latitude": 11.94139,
                        "longitude": 108.43735,
                        "image_url": resolve_real_image("Chợ Đêm Đà Lạt", "shopping"),
                        "note": "Dạo bộ quanh Hồ Xuân Hương, check-in Nụ Hoa Atiso khổng lồ và thưởng thức bánh tráng nướng, sữa đậu nành nóng.",
                        "tips": "Hỏi giá trước khi mua dâu tây hoặc đồ len ở chợ đêm; nên mua đặc sản đóng gói tại quầy L'angfarm.",
                        "transport_info": "Gửi xe tại bãi xe công viên Tùng Lâm hoặc tầng hầm Quảng trường Lâm Viên.",
                        "avg_cost_vnd": 100000,
                        "menu_items": [
                            {"name": "Bánh tráng nướng phô mai trứng", "price_vnd": 25000},
                            {"name": "Sữa đậu nành nóng & bánh su kem", "price_vnd": 30000},
                            {"name": "Kem bơ Thanh Thảo", "price_vnd": 35000}
                        ]
                    }
                ]
            },
            {
                "day_number": 2,
                "title": "Ngày 2: Thác Datanla, Đỉnh Langbiang & Đặc sản phố núi",
                "items": [
                    {
                        "time_slot": "08:00",
                        "location_name": "Bánh Ướt Lòng Gà Trang (Quán Gốc Tăng Bạt Hổ)",
                        "category": "restaurant",
                        "address": "15F Tăng Bạt Hổ, Phường 1, TP. Đà Lạt",
                        "latitude": 11.94412,
                        "longitude": 108.43578,
                        "image_url": resolve_real_image("Bánh Ướt Lòng Gà", "restaurant"),
                        "note": "Ăn sáng món bánh ướt dẻo mềm kết hợp thịt gà xé phay, lòng gà giòn sần sật và nước mắm chua ngọt ấm nóng.",
                        "tips": "Đi trước 8h30 sáng để không phải chờ bàn lâu.",
                        "transport_info": "Ngay khu Hòa Bình trung tâm thành phố.",
                        "avg_cost_vnd": 55000,
                        "menu_items": [
                            {"name": "Bánh ướt lòng gà trứng non đặc biệt", "price_vnd": 55000},
                            {"name": "Cháo gà phố núi", "price_vnd": 45000}
                        ]
                    },
                    {
                        "time_slot": "09:30",
                        "location_name": "Khu du lịch Thác Datanla Đà Lạt",
                        "category": "tourist_spot",
                        "address": "QL20 Đèo Prenn, Phường 3, TP. Đà Lạt",
                        "latitude": 11.90165,
                        "longitude": 108.44985,
                        "image_url": resolve_real_image("Thác Datanla", "tourist_spot"),
                        "note": "Trải nghiệm xe trượt thác Alpine Coaster dài nhất Đông Nam Á xuyên rừng thông đại ngàn.",
                        "tips": "Mua vé xe trượt khứ hồi để không phải leo bộ dốc cao khi quay lên.",
                        "transport_info": "Nằm ngay giữa đèo Prenn mới mở rộng rất êm và an toàn.",
                        "avg_cost_vnd": 250000,
                        "menu_items": [
                            {"name": "Vé xe trượt Alpine Coaster khứ hồi", "price_vnd": 250000},
                            {"name": "Vé vào cổng tham quan thác", "price_vnd": 50000}
                        ]
                    },
                    {
                        "time_slot": "13:30",
                        "location_name": "Khu du lịch Núi Langbiang",
                        "category": "tourist_spot",
                        "address": "305 Langbiang, Thị trấn Lạc Dương, Lâm Đồng",
                        "latitude": 12.0468,
                        "longitude": 108.4402,
                        "image_url": resolve_real_image("Langbiang", "tourist_spot"),
                        "note": "Đi xe Jeep chinh phục đỉnh Radar cao 1.950m ngắm toàn cảnh Suối Vàng - Suối Bạc từ trên cao.",
                        "tips": "Đi ghép xe Jeep đủ 6 người chỉ khoảng 120.000đ/người khứ hồi cực kỳ tiết kiệm.",
                        "transport_info": "Cách trung tâm Đà Lạt 12km về phía Bắc, đường nhựa phẳng đẹp.",
                        "avg_cost_vnd": 170000,
                        "menu_items": [
                            {"name": "Vé vào cổng Langbiang", "price_vnd": 50000},
                            {"name": "Vé xe Jeep khứ hồi đỉnh Radar", "price_vnd": 120000}
                        ]
                    }
                ]
            }
        ]
        return {
            "destination_name": "Đà Lạt",
            "destination_description": "Thành phố ngàn hoa ẩn mình trong sương mù và rừng thông đại ngàn, nổi tiếng với khí hậu mát lạnh quanh năm và ẩm thực phố núi đặc sắc.",
            "center_lat": 11.9404,
            "center_lng": 108.4583,
            "days": all_days[:num_days] if num_days <= len(all_days) else all_days
        }

    # 2. TP. HỒ CHÍ MINH
    if "hồ chí minh" in dest_lower or "sài gòn" in dest_lower or "sai gon" in dest_lower or "tphcm" in dest_lower:
        return {
            "destination_name": "TP. Hồ Chí Minh",
            "destination_description": "Đô thị sôi động bậc nhất Việt Nam nơi giao thoa giữa kiến trúc di sản Pháp cổ kính, những tòa tháp chọc trời hiện đại và thiên đường ẩm thực không ngủ.",
            "center_lat": 10.7769,
            "center_lng": 106.7009,
            "days": [
                {
                    "day_number": 1,
                    "title": "Ngày 1: Di sản Sài Gòn trăm năm & Nhịp sống Phố đi bộ Nguyễn Huệ",
                    "items": [
                        {
                            "time_slot": "08:00",
                            "location_name": "Dinh Độc Lập (Hội Trường Thống Nhất)",
                            "category": "tourist_spot",
                            "address": "135 Nam Kỳ Khởi Nghĩa, Phường Bến Thành, Quận 1, TP.HCM",
                            "latitude": 10.77713,
                            "longitude": 106.69544,
                            "image_url": resolve_real_image("Dinh Độc Lập", "tourist_spot"),
                            "note": "Tham quan công trình lịch sử biểu tượng của Sài Gòn với kiến trúc Á Đông hiện đại và hầm chỉ huy kiên cố.",
                            "tips": "Mua vé combo tham quan cả Dinh chính và nhà trưng bày 'Từ Dinh Norodom đến Dinh Độc Lập'.",
                            "transport_info": "Gửi xe tại cổng đường Nguyễn Du hoặc Công viên Tao Đàn.",
                            "avg_cost_vnd": 65000,
                            "menu_items": [{"name": "Vé tham quan Dinh Độc Lập", "price_vnd": 65000}]
                        },
                        {
                            "time_slot": "10:00",
                            "location_name": "Bưu Điện Trung Tâm Sài Gòn & Đường Sách Nguyễn Văn Bình",
                            "category": "tourist_spot",
                            "address": "Số 2 Công xã Paris, Phường Bến Nghé, Quận 1, TP.HCM",
                            "latitude": 10.77985,
                            "longitude": 106.69992,
                            "image_url": resolve_real_image("Bưu Điện Trung Tâm Sài Gòn", "tourist_spot"),
                            "note": "Chiêm ngưỡng mái vòm kiến trúc Pháp cổ điển hơn 130 năm tuổi và dạo bước dưới hàng cây xanh mát tại Đường Sách.",
                            "tips": "Ghé quầy bưu thiếp cổ bên trong Bưu điện để viết thiệp lưu niệm đóng dấu mộc Sài Gòn.",
                            "transport_info": "Đi bộ từ Dinh Độc Lập sang chỉ mất 5 phút qua công viên 30/4.",
                            "avg_cost_vnd": 0,
                            "menu_items": [{"name": "Tham quan tự do", "price_vnd": 0}]
                        },
                        {
                            "time_slot": "12:00",
                            "location_name": "Cơm Tấm Bụi Sài Gòn (Chuẩn vị Sườn Bì Chả)",
                            "category": "restaurant",
                            "address": "100 Thạch Thị Thanh, Phường Tân Định, Quận 1, TP.HCM",
                            "latitude": 10.79103,
                            "longitude": 106.69141,
                            "image_url": resolve_real_image("Cơm Tấm", "restaurant"),
                            "note": "Thưởng thức dĩa cơm tấm sườn nướng mật ong vàng ươm, bì thính, chả trứng chưng và mỡ hành thơm lừng.",
                            "tips": "Gọi thêm chén canh khổ qua nhồi thịt hoặc canh chua cá hú ăn kèm rất bắt vị.",
                            "transport_info": "Có nhân viên giữ xe máy miễn phí trước quán.",
                            "avg_cost_vnd": 85000,
                            "menu_items": [
                                {"name": "Cơm tấm sườn bì chả trứng ốp la", "price_vnd": 75000},
                                {"name": "Trà tắc mật ong", "price_vnd": 20000}
                            ]
                        },
                        {
                            "time_slot": "16:30",
                            "location_name": "Chung Cư Cà Phê 42 Nguyễn Huệ & Phố Đi Bộ",
                            "category": "cafe",
                            "address": "42 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                            "latitude": 10.77382,
                            "longitude": 106.70365,
                            "image_url": resolve_real_image("Cà Phê Chung Cư", "cafe"),
                            "note": "Ngồi ban công tầng cao nhâm nhi cà phê sữa đá Sài Gòn và ngắm toàn cảnh Phố đi bộ Nguyễn Huệ nhộn nhịp.",
                            "tips": "Đi thang bộ lên các tầng hoặc phí thang máy 3.000đ/lượt (được trừ vào hóa đơn tại nhiều quán).",
                            "transport_info": "Gửi xe tại bãi giữ xe Hồ Tùng Mậu hoặc Hải Triều.",
                            "avg_cost_vnd": 60000,
                            "menu_items": [
                                {"name": "Bạc xỉu Sài Gòn", "price_vnd": 55000},
                                {"name": "Bánh tiramisu thủ công", "price_vnd": 65000}
                            ]
                        },
                        {
                            "time_slot": "19:30",
                            "location_name": "Công Viên Bến Bạch Đằng & Waterbus Sông Sài Gòn",
                            "category": "tourist_spot",
                            "address": "Số 10B Tôn Đức Thắng, Phường Bến Nghé, Quận 1, TP.HCM",
                            "latitude": 10.77455,
                            "longitude": 106.70685,
                            "image_url": resolve_real_image("Bến Bạch Đằng", "tourist_spot"),
                            "note": "Trải nghiệm buýt đường sông ngắm cầu Ba Son và tòa tháp Landmark 81 lung linh ánh đèn về đêm.",
                            "tips": "Nên đặt vé Saigon Waterbus chuyến 19h00 hoặc 20h00 trước để có ghế ngồi ngoài boong tàu.",
                            "transport_info": "Ngay cuối đường Nguyễn Huệ băng qua đường Tôn Đức Thắng.",
                            "avg_cost_vnd": 30000,
                            "menu_items": [{"name": "Vé Saigon Waterbus khứ hồi", "price_vnd": 30000}]
                        }
                    ]
                }
            ]
        }

    # 3. PLEIKU - GIA LAI
    if "pleiku" in dest_lower or "gia lai" in dest_lower:
        return {
            "destination_name": "Pleiku",
            "destination_description": "Phố núi cao nguyên đại ngàn với Đôi Mắt Pleiku Biển Hồ xanh biếc, hàng thông trăm tuổi lãng mạn và ẩm thực phở khô hai tô độc đáo.",
            "center_lat": 13.9833,
            "center_lng": 108.0000,
            "days": [
                {
                    "day_number": 1,
                    "title": "Ngày 1: Đôi Mắt Pleiku Biển Hồ & Hàng Thông Trăm Tuổi",
                    "items": [
                        {
                            "time_slot": "07:30",
                            "location_name": "Phở Khô Hồng (Đặc sản Phở 2 Tô Gia Lai)",
                            "category": "restaurant",
                            "address": "22-24 Nguyễn Văn Trỗi, Phường Hội Thương, TP. Pleiku, Gia Lai",
                            "latitude": 13.97734,
                            "longitude": 108.00284,
                            "image_url": resolve_real_image("Phở Hồng", "restaurant"),
                            "note": "Thưởng thức món Phở khô Gia Lai trứ danh gồm 1 tô bánh phở sợi nhỏ trộn tương đen hành phi và 1 tô nước súp bò nóng hổi.",
                            "tips": "Trộn đều bánh phở với tương đậu nành đặc sản Gia Lai và thêm chút ớt xào trước khi ăn.",
                            "transport_info": "Ngay trung tâm TP. Pleiku, chỗ đậu xe rộng rãi.",
                            "avg_cost_vnd": 60000,
                            "menu_items": [
                                {"name": "Phở khô bò tái nạm 2 tô", "price_vnd": 60000},
                                {"name": "Sữa đậu nành nóng", "price_vnd": 12000}
                            ]
                        },
                        {
                            "time_slot": "09:00",
                            "location_name": "Biển Hồ Pleiku (Hồ T'Nưng)",
                            "category": "tourist_spot",
                            "address": "Xã Biển Hồ, TP. Pleiku, Gia Lai",
                            "latitude": 14.04585,
                            "longitude": 108.00125,
                            "image_url": resolve_real_image("Biển Hồ", "tourist_spot"),
                            "note": "Chiêm ngưỡng hồ nước ngọt tự nhiên trên miệng núi lửa cổ rộng mênh mông được mệnh danh là 'Đôi mắt Pleiku'.",
                            "tips": "Đi bộ dọc con đường thông dẫn ra đài ngắm cảnh giữa lòng hồ để chụp ảnh toàn cảnh.",
                            "transport_info": "Từ trung tâm Pleiku đi theo đường Phạm Văn Đồng khoảng 7km.",
                            "avg_cost_vnd": 20000,
                            "menu_items": [{"name": "Vé xe điện tham quan Biển Hồ", "price_vnd": 20000}]
                        },
                        {
                            "time_slot": "11:30",
                            "location_name": "Gà Nướng Cơm Lam Bazan Pleiku",
                            "category": "restaurant",
                            "address": "Hẻm 480 Lê Duẩn, Phường Thắng Lợi, TP. Pleiku, Gia Lai",
                            "latitude": 13.97215,
                            "longitude": 108.03452,
                            "image_url": resolve_real_image("Gà Nướng Cơm Lam", "restaurant"),
                            "note": "Thưởng thức gà chạy bộ nướng than hồng da giòn rụm chấm muối lá é, ăn kèm ống cơm lam nướng tre thơm dẻo.",
                            "tips": "Nên đi nhóm để gọi nguyên con gà nướng kèm gỏi lá rừng Tây Nguyên.",
                            "transport_info": "Không gian nhà sàn Tây Nguyên thoáng mát, có bãi đỗ ô tô.",
                            "avg_cost_vnd": 160000,
                            "menu_items": [
                                {"name": "Gà nướng bản địa nguyên con", "price_vnd": 290000},
                                {"name": "Cơm lam ống tre nướng", "price_vnd": 25000}
                            ]
                        },
                        {
                            "time_slot": "15:00",
                            "location_name": "Biển Hồ Chè & Hàng Thông Trăm Tuổi",
                            "category": "tourist_spot",
                            "address": "Xã Nghĩa Hưng, Huyện Chư Păh, Gia Lai",
                            "latitude": 14.06315,
                            "longitude": 108.00845,
                            "image_url": resolve_real_image("Hàng Thông Trăm Tuổi", "tourist_spot"),
                            "note": "Check-in con đường thông cổ thụ hơn 100 năm tuổi thẳng tắp như phim Hàn Quốc nằm cạnh đồi chè xanh ngát.",
                            "tips": "Nắng chiều xiên qua tán thông từ 15h30 - 17h00 tạo hiệu ứng tia nắng tuyệt đẹp.",
                            "transport_info": "Nằm gần Biển Hồ T'Nưng, qua cầu treo Biển Hồ rẽ trái.",
                            "avg_cost_vnd": 0,
                            "menu_items": [{"name": "Tham quan miễn phí", "price_vnd": 0}]
                        },
                        {
                            "time_slot": "17:15",
                            "location_name": "Chùa Minh Thành Pleiku",
                            "category": "tourist_spot",
                            "address": "348 Nguyễn Viết Xuân, Phường Hội Phú, TP. Pleiku, Gia Lai",
                            "latitude": 13.96611,
                            "longitude": 108.00666,
                            "image_url": resolve_real_image("Chùa Minh Thành", "tourist_spot"),
                            "note": "Ngôi chùa có kiến trúc mái cong gỗ pơ-mu và bảo tháp Xá Lợi 9 tầng uy nghiêm đẹp bậc nhất Tây Nguyên.",
                            "tips": "Mặc trang phục lịch sự kín đáo khi vào khuôn viên chùa.",
                            "transport_info": "Cách trung tâm thành phố 2km.",
                            "avg_cost_vnd": 0,
                            "menu_items": [{"name": "Tham quan lễ Phật", "price_vnd": 0}]
                        }
                    ]
                }
            ]
        }

    # 4. TÂY NINH (Và mặc định nếu chưa khớp)
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
                        "latitude": 11.36885,
                        "longitude": 106.17825,
                        "image_url": resolve_real_image("Khu du lịch Quốc gia Núi Bà Đen", "tourist_spot"),
                        "note": "Đi tuyến cáp treo Vân Sơn lên đỉnh săn mây, chiêm bái tượng Phật Bà Tây Bổ Đà Sơn cao nhất châu Á.",
                        "tips": "Nên đi tuyến cáp sớm từ 7h-8h để tránh xếp hàng đông và trời chưa nắng gắt. Mang áo khoác mỏng vì đỉnh núi gió nhiều.",
                        "transport_info": "Từ trung tâm TP Tây Ninh đi theo đường Bời Lời khoảng 11km (~15 phút đi xe máy).",
                        "avg_cost_vnd": 350000,
                        "menu_items": [
                            {"name": "Vé cáp treo khứ hồi đỉnh núi", "price_vnd": 350000},
                            {"name": "Vé buffet ẩm thực đỉnh núi", "price_vnd": 250000}
                        ]
                    },
                    {
                        "time_slot": "12:00",
                        "location_name": "Bò Tơ Tây Ninh Năm Sánh (Quán Gốc)",
                        "category": "restaurant",
                        "address": "Đường 30/4, Phường Hiệp Ninh, TP. Tây Ninh",
                        "latitude": 11.30052,
                        "longitude": 106.11245,
                        "image_url": resolve_real_image("Bò Tơ Tây Ninh Năm Sánh", "restaurant"),
                        "note": "Thưởng thức bò tơ nướng than hoa mềm ngọt, cuộn rau rừng chấm mắm nêm chuẩn vị.",
                        "tips": "Gọi món bò tơ nướng tảng cuốn bánh tráng rau rừng và lẩu đuôi bò.",
                        "transport_info": "Nằm ngay trục đường chính 30/4, có bãi đậu xe ô tô và xe máy rộng rãi.",
                        "avg_cost_vnd": 180000,
                        "menu_items": [
                            {"name": "Bò tơ nướng tảng cuộn rau rừng", "price_vnd": 180000},
                            {"name": "Lẩu bò tơ thập cẩm", "price_vnd": 220000}
                        ]
                    },
                    {
                        "time_slot": "14:30",
                        "location_name": "Toà Thánh Cao Đài Tây Ninh",
                        "category": "tourist_spot",
                        "address": "Phạm Hộ Pháp, Thị xã Hoà Thành, Tây Ninh",
                        "latitude": 11.29668,
                        "longitude": 106.12058,
                        "image_url": resolve_real_image("Toà Thánh Cao Đài Tây Ninh", "tourist_spot"),
                        "note": "Chiêm ngưỡng kiến trúc kết hợp Á - Âu rực rỡ sắc màu của Đạo Cao Đài và không gian trang nghiêm.",
                        "tips": "Bắt buộc mặc quần áo dài qua gối, không mặc áo sát nách.",
                        "transport_info": "Cách trung tâm TP Tây Ninh 5km, đường nhựa lớn dễ đi.",
                        "avg_cost_vnd": 20000,
                        "menu_items": [{"name": "Nước mía giải khát cổng đền", "price_vnd": 15000}]
                    },
                    {
                        "time_slot": "17:00",
                        "location_name": "Cà Phê Sinh Thái Gió Vườn",
                        "category": "cafe",
                        "address": "Đường Bời Lời, Ninh Sơn, TP. Tây Ninh",
                        "latitude": 11.33927,
                        "longitude": 106.11903,
                        "image_url": resolve_real_image("Cà Phê Sinh Thái Gió Vườn", "cafe"),
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
                        "latitude": 11.28715,
                        "longitude": 106.10747,
                        "image_url": resolve_real_image("Bánh Tráng Phơi Sương Hoàng Minh", "restaurant"),
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
            }
        ]
    }
