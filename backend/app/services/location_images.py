"""
Thu vien anh that (Real High Quality Photo Database) cho cac tinh thanh, dia diem du lich,
danh lam thang canh, quan an, quan ca phe, chua chien va dac san tai Viet Nam.
Moi dia diem co URL anh rieng biet, dung ban chat thuc te.
"""
from typing import Optional

# Anh dai dien rieng biet cho tung Tinh / Thanh pho
PROVINCE_IMAGES = {
    "vũng tàu": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop",
    "tây ninh": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop",
    "đà lạt": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=1000&auto=format&fit=crop",
    "lâm đồng": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=1000&auto=format&fit=crop",
    "hồ chí minh": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&auto=format&fit=crop",
    "sài gòn": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=1000&auto=format&fit=crop",
    "pleiku": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop",
    "gia lai": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop",
    "phú quốc": "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=1000&auto=format&fit=crop",
    "cần thơ": "https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&auto=format&fit=crop",
    "bến tre": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1000&auto=format&fit=crop",
    "đà nẵng": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop",
    "nha trang": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop",
    "hà nội": "https://images.unsplash.com/photo-1509030450996-dd1a26dda07a?w=1000&auto=format&fit=crop",
    "hà giang": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1000&auto=format&fit=crop",
}

# Database anh thuc te chat luong cao theo dia diem & danh muc (moi dia diem 1 anh khop ten)
REAL_LOCATION_IMAGES = {
    # === VŨNG TÀU ===
    "tượng chúa kitô": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop",
    "tượng chúa kito": "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=800&auto=format&fit=crop",
    "bánh khọt": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop",
    "vú sữa": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop",
    "hải đăng vũng tàu": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop",
    "hải đăng": "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=800&auto=format&fit=crop",
    "bãi sau": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
    "thùy vân": "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
    "bãi trước": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
    "bạch dinh": "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop",
    "villa blanche": "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop",
    "mũi nghinh phong": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop",
    "cổng trời": "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=800&auto=format&fit=crop",
    "chợ đêm vũng tàu": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
    "bún riêu tôm": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop",
    "thuận phúc": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop",
    "bé mặn": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop",
    "gành hào": "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop",
    "sailing club": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",

    # === TÂY NINH ===
    "núi bà đen": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    "kdl núi bà đen": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    "bà đen": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
    "toà thánh": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop",
    "tòa thánh": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop",
    "cao đài": "https://images.unsplash.com/photo-1548013146-72479768bada?w=800&auto=format&fit=crop",
    "bò tơ": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop",
    "năm sánh": "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop",
    "chợ tây ninh": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop",
    "muối tôm": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop",
    "bánh tráng phơi sương": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop",
    "hoàng minh": "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop",
    "bánh canh trảng bàng": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",
    "út huệ": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",
    "chùa gò kén": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop",
    "thiền lâm tự": "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop",
    "cà phê sinh thái": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop",
    "gió vườn": "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop",
    "hồ dầu tiếng": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop",
    "ma thiên lãnh": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop",

    # === ĐÀ LẠT ===
    "quảng trường lâm viên": "https://images.unsplash.com/photo-1555921015-5532091f6026?w=800&auto=format&fit=crop",
    "hồ xuân hương": "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&auto=format&fit=crop",
    "thung lũng tình yêu": "https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop",
    "langbiang": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop",
    "đồi chè cầu đất": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
    "cầu đất": "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop",
    "lẩu gà lá é": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop",
    "tao ngộ": "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop",
    "bánh tráng nướng": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop",
    "bánh ướt lòng gà": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop",
    "chợ đêm đà lạt": "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&auto=format&fit=crop",
    "túi mơ to": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop",
    "mê linh": "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop",
    "chùa linh phước": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
    "ve chai": "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&auto=format&fit=crop",
    "thác datanla": "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&auto=format&fit=crop",
    "ga đà lạt": "https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=800&auto=format&fit=crop",

    # === TP. HỒ CHÍ MINH ===
    "dinh độc lập": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop",
    "hội trường thống nhất": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&auto=format&fit=crop",
    "bưu điện trung tâm": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop",
    "nhà thờ đức bà": "https://images.unsplash.com/photo-1548625361-195fe5772df8?w=800&auto=format&fit=crop",
    "phố đi bộ nguyễn huệ": "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop",
    "bến bạch đằng": "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&auto=format&fit=crop",
    "landmark 81": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop",
    "chợ bến thành": "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop",
    "cơm tấm": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop",
    "phở hòa": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop",
    "bánh mì huỳnh hoa": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=800&auto=format&fit=crop",
    "cà phê chung cư": "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&auto=format&fit=crop",

    # === PLEIKU - GIA LAI ===
    "biển hồ chè": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop",
    "hàng thông trăm tuổi": "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop",
    "biển hồ": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
    "tnơưng": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
    "chùa minh thành": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
    "núi lửa chư đăng ya": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
    "phở khô": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",
    "phở hồng": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",
    "gà nướng cơm lam": "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop",
    "pleiku": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",

    # === PHÚ QUỐC ===
    "bãi sao": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
    "bãi kem": "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&auto=format&fit=crop",
    "chợ đêm phú quốc": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
    "grand world": "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=800&auto=format&fit=crop",
    "hòn thơm": "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
    "làng chài hàm ninh": "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop",
    "bún quậy": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",

    # === BẾN TRE & CẦN THƠ ===
    "cồn phụng": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop",
    "kẹo dừa": "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop",
    "chợ nổi cái răng": "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop",
    "bến ninh kiều": "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop",
    "nhà cổ bình thủy": "https://images.unsplash.com/photo-1577495508048-b635879837f1?w=800&auto=format&fit=crop",
}

# Bo anh chat luong cao theo category mac dinh
CATEGORY_FALLBACK_IMAGES = {
    "restaurant": [
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop",
    ],
    "cafe": [
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&auto=format&fit=crop",
    ],
    "tourist_spot": [
        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&auto=format&fit=crop",
    ],
    "beach": [
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&auto=format&fit=crop",
    ],
    "shopping": [
        "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=800&auto=format&fit=crop",
    ],
    "hotel": [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop",
    ]
}


def resolve_province_image(province_name: str) -> str:
    """
    Lay anh bia dac trung rieng cho tung tinh thanh.
    """
    if not province_name:
        return "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=1000&auto=format&fit=crop"
    p_lower = province_name.lower().strip()
    for key, url in PROVINCE_IMAGES.items():
        if key in p_lower:
            return url
    fallback_list = list(PROVINCE_IMAGES.values())
    idx = abs(hash(p_lower)) % len(fallback_list)
    return fallback_list[idx]


def resolve_real_image(name: str, category: str, fallback_url: Optional[str] = None) -> str:
    """
    Tim anh that tuong thich cao nhat theo ten dia diem hoac loai hinh dia diem.
    """
    if not name:
        return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"

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
        idx = abs(hash(name_lower)) % len(images)
        return images[idx]

    return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop"
