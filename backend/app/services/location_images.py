"""
Thu vien anh that (Real High Quality Photo Database) cho cac dia diem du lich, danh lam thang canh,
quan an, quan ca phe, chua chien va dac san tai Viet Nam.
"""
from typing import Optional

# Database anh thuc te chat luong cao theo dia diem & danh muc
REAL_LOCATION_IMAGES = {
    # === TÂY NINH ===
    "núi bà đen": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "kdl núi bà đen": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "bà đen": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "toà thánh tây ninh": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "tòa thánh": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "bò tơ năm sánh": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    "bò tơ tây ninh": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    "bánh tráng phơi sương": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "hoàng minh": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "bánh canh trảng bàng": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
    "út huệ": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
    "chùa gò kén": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    "chợ tây ninh": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "muối tôm": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "cà phê sinh thái": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    "hồ dầu tiếng": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "ma thiên lãnh": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",

    # === VŨNG TÀU ===
    "tượng chúa kitô": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "tượng chúa kito": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "bánh khọt": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "vú sữa": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "hải đăng vũng tàu": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "hải đăng": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "bãi sau": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "bãi trước": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "bạch dinh": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    "mũi nghinh phong": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "chợ đêm vũng tàu": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "bún riêu tôm": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
    "bé mặn": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800",
    "gành hào": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800",
    "hải sản": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800",

    # === ĐÀ LẠT ===
    "hồ xuân hương": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "thung lũng tình yêu": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "langbiang": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    "đồi chè cầu đất": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800",
    "lẩu gà lá é": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    "bánh tráng nướng": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
    "chợ đêm đà lạt": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "quán cafe view": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    "tiệm cà phê": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
    "chùa linh phước": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "ve chai": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "thác datanla": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800",

    # === PHÚ QUỐC ===
    "bãi sao": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "bãi kem": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "chợ đêm phú quốc": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "grand world": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    "hòn thơm": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
    "làng chài hàm ninh": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800",

    # === BẾN TRE & MIỀN TÂY ===
    "cồn phụng": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "kẹo dừa": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
    "chợ nổi": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "vườn trái cây": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800",
}

# Bo anh chat luong cao theo category mac dinh (Thuc an, Quan cafe, Bien, Phong canh, Pho dem)
CATEGORY_FALLBACK_IMAGES = {
    "restaurant": [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800",
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800",
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
    ],
    "cafe": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800",
    ],
    "tourist_spot": [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800",
    ],
    "beach": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800",
        "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800",
    ],
    "shopping": [
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800",
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800",
    ],
    "hotel": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800",
    ]
}

def resolve_real_image(name: str, category: str, fallback_url: Optional[str] = None) -> str:
    """
    Tim anh that tuong thich cao nhat theo ten dia diem hoac loai hinh dia diem.
    """
    if not name:
        return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"

    name_lower = name.lower()

    # 1. Kiem tra theo ten dia diem cu the
    for keyword, url in REAL_LOCATION_IMAGES.items():
        if keyword in name_lower:
            return url

    # 2. Neu fallback_url hop le va khong phai url placeholder cu
    if fallback_url and "photo-1507525428034" not in fallback_url and "unsplash" in fallback_url:
        return fallback_url

    # 3. Kiem tra theo category
    cat_lower = (category or "").lower()
    if cat_lower in CATEGORY_FALLBACK_IMAGES:
        images = CATEGORY_FALLBACK_IMAGES[cat_lower]
        # Hash ten dia diem de luon lay 1 anh nhat quan
        idx = abs(hash(name_lower)) % len(images)
        return images[idx]

    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800"
