# 📖 MÔ TẢ CHI TIẾT 18 CHỨC NĂNG – ĐI CÙNG LẠC

---

## 🥇 CORE – 6 chức năng bắt buộc

---

### 1. 🔐 Đăng ký / Đăng nhập

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng tạo tài khoản và đăng nhập để sử dụng các tính năng cá nhân (lưu lịch trình, đánh giá, wishlist…) |
| **Actor** | Khách (chưa có tài khoản), Người dùng |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Đăng ký | Nhập họ tên, email, mật khẩu | Kiểm tra email trùng → Mã hóa mật khẩu → Lưu DB | Tạo tài khoản thành công → Chuyển sang trang đăng nhập |
| Đăng nhập | Nhập email, mật khẩu | So khớp email + mật khẩu → Tạo JWT token | Đăng nhập thành công → Vào trang chủ, hiện tên user trên navbar |
| Xem thông tin | Nhấn avatar trên navbar | Đọc token → Lấy thông tin user từ DB | Hiển thị: tên, email, role |
| Đăng xuất | Nhấn nút "Đăng xuất" | Xóa token khỏi trình duyệt | Quay về trang chủ ở chế độ khách |

**Quy tắc:**
- Email không được trùng
- Mật khẩu tối thiểu 6 ký tự
- Token hết hạn sau 24 giờ
- Có 2 role: `user` (mặc định) và `admin`

---

### 2. 📍 Khám phá địa điểm

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng duyệt, tìm kiếm và xem thông tin chi tiết các địa điểm du lịch, ăn uống, cà phê… tại một tỉnh/thành |
| **Actor** | Tất cả (không cần đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xem danh sách tỉnh | Vào trang chủ hoặc trang khám phá | Query bảng `provinces` | Hiển thị danh sách tỉnh dạng card (ảnh, tên, mô tả) |
| Chọn tỉnh | Nhấn vào card "Vũng Tàu" | Query `locations` WHERE province_id = ? | Hiển thị tất cả địa điểm ở Vũng Tàu dạng grid card |
| Lọc theo loại | Nhấn tab "Ăn uống" / "Tham quan" / "Cà phê" | Query thêm WHERE category = ? | Chỉ hiện địa điểm thuộc loại đã chọn |
| Tìm kiếm | Gõ "bánh khọt" vào ô tìm kiếm | Query WHERE name LIKE '%bánh khọt%' | Hiện kết quả tìm kiếm |
| Xem chi tiết | Nhấn vào card "Bánh Khọt Gốc Vú Sữa" | Query location by id | Hiển thị trang chi tiết: ảnh lớn, mô tả, địa chỉ, giờ mở cửa, giá trung bình, thời gian tham quan, đánh giá |

**Thông tin hiển thị trên mỗi card:**
- 🖼️ Hình ảnh
- 📛 Tên địa điểm
- 🏷️ Loại (icon + text): 🏖️ Bãi biển, 🍜 Quán ăn, ☕ Cà phê…
- ⭐ Điểm đánh giá (4.5/5)
- 💰 Giá trung bình (50.000đ)
- 📍 Địa chỉ ngắn

---

### 3. 🧠 Tạo lịch trình tự động

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Hệ thống tự động tạo lịch trình du lịch chi tiết từng ngày, từng giờ dựa trên điểm đến và số ngày người dùng nhập |
| **Actor** | Tất cả (không cần đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Chọn điểm đến | Dropdown chọn "Vũng Tàu" | — | Lưu province_id |
| Chọn số ngày | Nhập: 3 ngày | — | Lưu num_days |
| Chọn số đêm | Nhập: 2 đêm | — | Lưu num_nights |
| Nhấn "Tạo lịch trình" | Nhấn nút | 🧠 **Thuật toán Planner chạy** (xem bên dưới) | Hiển thị lịch trình dạng timeline |

**🧠 Thuật toán Planner làm gì:**

```
Bước 1: Lấy tất cả địa điểm ở Vũng Tàu từ DB
         → 25 địa điểm (chia theo loại)

Bước 2: Phân loại
         → tourist_spots: 5 | beaches: 3 | restaurants: 8
         → cafes: 4 | hotels: 3 | shopping: 2

Bước 3: Tạo lịch trình từng ngày
         NGÀY 1 (ngày đầu - đến nơi):
         ├── 09:00 → Check-in khách sạn (hotel)
         ├── 10:00 → Tham quan 1 (tourist_spot/beach)
         ├── 11:30 → Ăn trưa (restaurant)
         ├── 13:30 → Tham quan 2 (tourist_spot)
         ├── 16:00 → Cà phê chiều (cafe)
         ├── 17:30 → Hoạt động chiều (beach - hoàng hôn)
         └── 19:00 → Ăn tối (restaurant)

         NGÀY 2 (ngày giữa - full):
         ├── 08:00 → Tham quan 3 (tourist_spot)
         ├── 10:00 → Tham quan 4 (tourist_spot)
         ├── 11:30 → Ăn trưa (restaurant)
         ├── 13:30 → Tham quan 5 (tourist_spot/beach)
         ├── 15:30 → Shopping (shopping)
         ├── 16:30 → Cà phê (cafe)
         ├── 17:30 → Hoạt động chiều (beach)
         └── 19:00 → Ăn tối (restaurant)

         NGÀY 3 (ngày cuối - về sớm):
         ├── 08:00 → Ăn sáng (restaurant)
         ├── 09:00 → Tham quan cuối (tourist_spot)
         ├── 11:00 → Mua sắm đặc sản (shopping)
         ├── 12:00 → Ăn trưa (restaurant)
         └── 14:00 → Trả phòng, về

Bước 4: Sắp xếp theo khoảng cách gần nhau
         → Các điểm cùng ngày ưu tiên gần nhau

Bước 5: Tính tổng chi phí dự kiến
         → Cộng avg_cost_vnd của tất cả items
```

**Kết quả hiển thị:** Lịch trình dạng timeline dọc, mỗi ngày có tiêu đề, mỗi item có giờ + tên + thời gian + chi phí.

---

### 4. ✏️ Chỉnh sửa lịch trình

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng tùy chỉnh lịch trình sau khi hệ thống gợi ý, để phù hợp với sở thích cá nhân |
| **Actor** | Người dùng (chủ lịch trình) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xóa địa điểm | Nhấn nút ❌ cạnh "Hải đăng" | Xóa item khỏi lịch trình | Hải đăng biến mất, các item sau dồn lên |
| Thêm địa điểm | Nhấn "➕ Thêm" → Chọn "Hồ Mây" từ danh sách | Thêm item mới vào ngày + giờ chỉ định | Hồ Mây xuất hiện trong lịch trình |
| Đổi thứ tự | Kéo thả "Bãi Sau" lên trước "Cà phê" | Cập nhật order_in_day | Thứ tự thay đổi |
| Chuyển ngày | Kéo "Bãi Sau" từ Ngày 1 sang Ngày 2 | Cập nhật day_number | Địa điểm chuyển sang ngày khác |
| Đổi giờ | Nhấn vào giờ "08:00" → Sửa thành "09:00" | Cập nhật time_slot | Giờ thay đổi |

**Quy tắc:**
- Chi phí tổng tự động cập nhật khi thêm/xóa
- Không giới hạn số item mỗi ngày
- Có thể thêm địa điểm từ tỉnh khác (tự chịu trách nhiệm)

---

### 5. 💾 Lưu & Quản lý lịch trình

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng lưu lại lịch trình đã tạo/chỉnh sửa để xem lại sau, và quản lý danh sách các chuyến đi |
| **Actor** | Người dùng (đã đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Lưu lịch trình | Nhấn "💾 Lưu lịch trình" | Lưu itinerary + items vào DB, gắn user_id | Thông báo "Đã lưu!" |
| Xem danh sách | Vào trang "Chuyến đi của tôi" | Query itineraries WHERE user_id = ? | Danh sách lịch trình dạng card |
| Xem chi tiết | Nhấn vào lịch trình "Vũng Tàu 3N2Đ" | Query itinerary + items by id | Hiển thị lịch trình đầy đủ |
| Đổi trạng thái | Nhấn "Đánh dấu đang đi" | Update status = 'ongoing' | Badge đổi thành "🟢 Đang đi" |
| Xóa lịch trình | Nhấn "🗑️ Xóa" → Xác nhận | Delete itinerary + items | Lịch trình biến mất khỏi danh sách |

**Trạng thái lịch trình:**
| Trạng thái | Badge | Ý nghĩa |
|---|---|---|
| `planned` | 📋 Đã lên kế hoạch | Chưa đi |
| `ongoing` | 🟢 Đang đi | Đang trong chuyến |
| `completed` | ✅ Đã hoàn thành | Đi xong rồi |

---

### 6. 💰 Tính toán chi phí

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Tự động tổng hợp và hiển thị chi phí dự kiến cho chuyến đi, chia theo hạng mục và theo ngày |
| **Actor** | Tất cả (xem lịch trình là thấy chi phí) |

**Hệ thống sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Tính chi phí tổng | Lịch trình đã tạo | Cộng avg_cost_vnd của tất cả items | Tổng: 1.450.000đ |
| Chia theo hạng mục | — | Group by category rồi sum | 🍜 Ăn uống: 800K, 🎫 Vé: 150K, ☕ Cà phê: 200K |
| Chia theo ngày | — | Group by day_number rồi sum | Ngày 1: 500K, Ngày 2: 600K, Ngày 3: 350K |
| Cập nhật khi chỉnh sửa | Thêm/xóa địa điểm | Tính lại tổng | Chi phí thay đổi real-time |

**Hiển thị:**
```
💰 Chi phí dự kiến
┌──────────────────────────────────────┐
│ 🍜 Ăn uống          800.000đ  (55%) │ ██████████░░
│ ☕ Cà phê            200.000đ  (14%) │ ███░░░░░░░░░
│ 🎫 Vé tham quan      150.000đ  (10%) │ ██░░░░░░░░░░
│ 🚗 Di chuyển (ước)   300.000đ  (21%) │ ████░░░░░░░░
│─────────────────────────────────────│
│ 📊 TỔNG           1.450.000đ        │
└──────────────────────────────────────┘
```

---

## 🥈 NÂNG CAO – 4 chức năng

---

### 7. ⭐ Đánh giá & Review

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép người dùng chấm điểm và viết nhận xét về địa điểm đã đến, giúp người khác tham khảo |
| **Actor** | Người dùng (đã đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Viết review | Chọn số sao (1-5) + Viết bình luận + Upload ảnh (tùy chọn) | Lưu review vào DB, tính lại rating trung bình | Review xuất hiện ở trang địa điểm |
| Xem review | Vào trang chi tiết địa điểm | Query reviews WHERE location_id = ? ORDER BY created_at DESC | Danh sách review: sao + text + ảnh + tên người + ngày |
| Xóa review | Nhấn "Xóa" (chỉ review của mình) | Delete review, tính lại rating | Review biến mất |

**Quy tắc:**
- Mỗi user chỉ review 1 lần/địa điểm
- Rating trung bình = tổng sao / số review
- Admin có quyền xóa review vi phạm

---

### 8. ❤️ Wishlist (Yêu thích)

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép lưu những địa điểm hay để xem lại hoặc thêm vào lịch trình sau |
| **Actor** | Người dùng (đã đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Thêm yêu thích | Nhấn ❤️ trên card/trang chi tiết địa điểm | Lưu vào bảng wishlists | Icon chuyển thành ❤️ đỏ |
| Bỏ yêu thích | Nhấn ❤️ lần nữa | Xóa khỏi wishlists | Icon chuyển thành 🤍 trắng |
| Xem danh sách | Vào trang "Yêu thích" | Query wishlists JOIN locations WHERE user_id = ? | Danh sách địa điểm đã lưu dạng grid |
| Thêm vào lịch trình | Khi chỉnh sửa lịch trình → "Thêm từ Wishlist" | Hiện danh sách wishlist để chọn | Địa điểm được thêm vào lịch trình |

---

### 9. 🔗 Chia sẻ lịch trình

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép chia sẻ lịch trình cho bạn bè/người thân qua link, không cần đăng nhập cũng xem được |
| **Actor** | Người dùng (chủ lịch trình) → Người nhận (bất kỳ ai) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Tạo link | Nhấn "🔗 Chia sẻ" ở trang lịch trình | Tạo share_code ngẫu nhiên (VD: `abc123`), lưu vào DB | Hiện link: `dicunglac.com/s/abc123` + nút Copy |
| Copy link | Nhấn "📋 Copy" | Copy vào clipboard | Thông báo "Đã copy!" |
| Người khác xem | Mở link `dicunglac.com/s/abc123` | Query itinerary WHERE share_code = ? | Hiển thị lịch trình đầy đủ (chế độ chỉ xem) |
| Clone về | Người nhận nhấn "📥 Lưu về tài khoản" | Copy itinerary + items, gắn user_id mới | Lịch trình xuất hiện trong "Chuyến đi của tôi" |

---

### 10. 🔧 Trang Admin

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép quản trị viên quản lý toàn bộ dữ liệu hệ thống: người dùng, địa điểm, đánh giá |
| **Actor** | Admin (role = 'admin') |

**Admin sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xem dashboard | Vào `/admin` | Đếm tổng users, locations, itineraries, reviews | Thống kê: 1.250 users, 486 địa điểm, 3.780 lịch trình |
| Quản lý user | Xem danh sách users | Query all users | Bảng: tên, email, ngày tạo, trạng thái + nút Khóa/Mở |
| Khóa user | Nhấn "🔒 Khóa" | Update user status | User không thể đăng nhập |
| Thêm địa điểm | Nhập form: tên, loại, mô tả, địa chỉ, tọa độ, giá, ảnh | Insert vào bảng locations | Địa điểm mới xuất hiện trên website |
| Sửa địa điểm | Chỉnh thông tin | Update location | Thông tin cập nhật |
| Xóa địa điểm | Nhấn "🗑️ Xóa" → Xác nhận | Delete location | Biến mất khỏi hệ thống |
| Xóa review vi phạm | Nhấn "🗑️ Xóa" ở review | Delete review | Review bị gỡ |

---

## 🆕 BỔ SUNG – 4 chức năng

---

### 11. 📄 Xuất PDF lịch trình

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Tải lịch trình thành file PDF để in ra giấy hoặc xem offline khi không có mạng |
| **Actor** | Tất cả (ai xem lịch trình đều tải được) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Tải PDF | Nhấn "📄 Tải PDF" ở trang lịch trình | Backend tạo file PDF chứa: tiêu đề, lịch trình từng ngày, địa chỉ, chi phí | Tự động tải file `Vung-Tau-3N2D.pdf` |

**Nội dung file PDF:**
- Tên chuyến đi + ngày
- Lịch trình từng ngày (giờ, tên, địa chỉ, chi phí)
- Bảng tổng chi phí
- Ghi chú (nếu có)

---

### 12. 🌤️ Thời tiết theo ngày

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Hiển thị dự báo thời tiết tại điểm đến để người dùng biết trước nên mặc gì, mang gì |
| **Actor** | Tất cả |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xem thời tiết | Chọn ngày khởi hành khi tạo lịch trình | Backend gọi OpenWeatherMap API bằng tọa độ tỉnh + ngày | Hiện icon thời tiết cạnh mỗi ngày |
| Gợi ý thay đổi | — | Nếu ngày mưa → đề xuất địa điểm indoor | ⚠️ "Ngày 2 có mưa, đề xuất đổi Bãi Sau → Bảo tàng" |

**Hiển thị:**
```
📅 Ngày 1 (20/10) ☀️ 32°C Nắng
📅 Ngày 2 (21/10) 🌧️ 28°C Mưa  ⚠️ Nên đi trong nhà
📅 Ngày 3 (22/10) ⛅ 30°C Có mây
```

---

### 13. 📊 So sánh ngân sách thực tế

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Sau chuyến đi, người dùng nhập chi tiêu thật để so sánh với dự kiến, rút kinh nghiệm |
| **Actor** | Người dùng (chủ lịch trình, trạng thái "Đã hoàn thành") |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Nhập chi tiêu thực tế | Nhập số tiền thật cho từng hạng mục | Lưu vào bảng expenses | Hiển thị bảng so sánh |
| Xem so sánh | Vào trang lịch trình đã hoàn thành | So sánh planned_cost vs actual_cost | Bảng: Dự kiến / Thực tế / Chênh lệch (🔴 vượt / 🟢 tiết kiệm) |

---

### 14. 🎉 Gợi ý theo mùa / lễ hội

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Gợi ý điểm đến phù hợp nhất theo thời điểm hiện tại (tháng, mùa, lễ hội) |
| **Actor** | Tất cả (hiện trên trang chủ) |

**Hệ thống sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Tự động gợi ý | Tháng hiện tại (VD: tháng 10) | Query provinces WHERE best_months LIKE '%10%' | Hiện trên trang chủ: "🎉 Tháng 10 nên đi đâu?" + danh sách tỉnh |

**Ví dụ:**
```
🎉 Tháng 10 – Nên đi đâu?
├── 🏖️ Vũng Tàu – Cuối mùa mưa, biển đẹp
├── 🌿 Đà Lạt – Mùa hoa dã quỳ
└── 🏔️ Sapa – Lúa chín vàng
```

---

## 🚀 MỞ RỘNG – 4 chức năng

---

### 15. 👥 Lịch trình nhóm

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép nhiều người cùng xem và vote chọn địa điểm cho 1 chuyến đi chung |
| **Actor** | Người dùng (chủ trip + thành viên được mời) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Mời bạn | Nhấn "👥 Mời bạn bè" → Copy link mời | Tạo invite_code | Link: `dicunglac.com/join/xyz789` |
| Bạn tham gia | Mở link → Nhấn "Tham gia" | Thêm vào bảng trip_members | Bạn thấy lịch trình + có thể vote |
| Vote địa điểm | Nhấn 👍 hoặc 👎 cạnh mỗi địa điểm | Lưu vote | Hiện: "Hồ Mây 👍 3 / 👎 0" |
| Xem thành viên | — | Query trip_members | Danh sách: 👤 Minh (chủ), 👤 Lan, 👤 Hùng |

---

### 16. 📝 Ghi chú chuyến đi

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Cho phép ghi nhớ thông tin quan trọng cho từng địa điểm hoặc từng ngày |
| **Actor** | Người dùng (chủ lịch trình) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Thêm ghi chú | Nhấn 📝 cạnh địa điểm → Gõ "Đặt bàn trước 5h" | Lưu vào field note | Hiện ghi chú dưới tên địa điểm |
| Sửa ghi chú | Nhấn vào ghi chú → Sửa | Update note | Nội dung cập nhật |
| Xóa ghi chú | Nhấn ❌ | Xóa note | Ghi chú biến mất |

---

### 17. 👤 Hồ sơ & Thống kê cá nhân

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Hiển thị thông tin cá nhân và thống kê hoạt động du lịch của người dùng |
| **Actor** | Người dùng (đã đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xem profile | Vào trang `/profile` | Query user info | Ảnh, tên, email, ngày tham gia |
| Sửa profile | Đổi tên / upload ảnh | Update user | Thông tin cập nhật |
| Xem thống kê | — | Đếm itineraries, reviews, wishlists | 🗺️ 5 tỉnh đã đi, 📋 8 lịch trình, ⭐ 23 review |

---

### 18. 🔔 Thông báo nhắc nhở

| Hạng mục | Mô tả |
|---|---|
| **Mục đích** | Nhắc nhở người dùng về chuyến đi sắp tới hoặc hoạt động liên quan |
| **Actor** | Người dùng (đã đăng nhập) |

**Người dùng sẽ làm gì:**

| Thao tác | Input | Hệ thống xử lý | Output |
|---|---|---|---|
| Xem thông báo | Nhấn 🔔 trên navbar | Query notifications WHERE user_id = ? | Dropdown danh sách thông báo |
| Đánh dấu đã đọc | Nhấn vào thông báo | Update is_read = true | Thông báo hết highlight |

**Loại thông báo:**
| Loại | Thời điểm | Nội dung |
|---|---|---|
| ⏰ Nhắc trước | 1 ngày trước trip_date | "Ngày mai bạn đi Vũng Tàu! Kiểm tra lịch trình nhé" |
| 📋 Lịch trình ngày | Sáng mỗi ngày trong trip | "Hôm nay: 08:00 Bãi Trước, 11:30 Bánh khọt..." |
| 👥 Mời nhóm | Khi được mời | "Lan mời bạn tham gia chuyến Đà Lạt 4N3Đ" |
| ⭐ Review mới | Khi có review ở wishlist | "Có review mới cho Bánh Khọt Gốc Vú Sữa" |

---

## 📊 TỔNG KẾT

| Nhóm | Chức năng | Cần đăng nhập? |
|---|---|---|
| 🥇 Core | 1. Đăng ký/Đăng nhập | ❌ → ✅ |
| | 2. Khám phá địa điểm | ❌ |
| | 3. Tạo lịch trình tự động | ❌ |
| | 4. Chỉnh sửa lịch trình | ❌ |
| | 5. Lưu & Quản lý | ✅ |
| | 6. Tính toán chi phí | ❌ |
| 🥈 Nâng cao | 7. Đánh giá & Review | ✅ |
| | 8. Wishlist | ✅ |
| | 9. Chia sẻ lịch trình | ✅ (tạo) / ❌ (xem) |
| | 10. Admin | ✅ (admin only) |
| 🆕 Bổ sung | 11. Xuất PDF | ❌ |
| | 12. Thời tiết | ❌ |
| | 13. So sánh ngân sách | ✅ |
| | 14. Gợi ý theo mùa | ❌ |
| 🚀 Mở rộng | 15. Lịch trình nhóm | ✅ |
| | 16. Ghi chú | ✅ |
| | 17. Hồ sơ & Thống kê | ✅ |
| | 18. Thông báo | ✅ |
