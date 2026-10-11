# 👥 BẢNG PHÂN CÔNG NHIỆM VỤ BACKEND (4 THÀNH VIÊN)

> **Lưu ý:** Bảng này **chỉ phân công phần Backend & Database** cho 4 thành viên. Phần Frontend giao diện không nằm trong bảng này (DMC phụ trách riêng).

---

## 📊 TỔNG QUAN PHÂN CHIA BACKEND

| Thành viên | Khối lượng phụ trách | Số API / Module | Tính chất công việc |
|---|---|---|---|
| 🗄️ **Thành viên 1** | **Setup Database & Nền tảng** + 3 Chức năng cơ sở | 10 Bảng DB + Seed data + 10 API | Nặng phần kiến trúc DB và dữ liệu mẫu |
| 🧠 **Thành viên 2** | **Lõi Lịch trình (Planner Algorithm)** + 4 Chức năng | Thuật toán cốt lõi + 9 API | Nặng phần tư duy thuật toán và logic điều phối |
| 🛡️ **Thành viên 3** | **Tương tác, Quản trị Admin & Hồ sơ** + 5 Chức năng | 18 API | Nặng phần nghiệp vụ CRUD, phân quyền & thống kê |
| 🚀 **Thành viên 4** | **Tiện ích, Tích hợp API ngoài & Nhóm** + 6 Chức năng | 12 API + Tích hợp dịch vụ | Nặng phần thư viện mở rộng (PDF, Weather, Group) |

---

## 🗄️ THÀNH VIÊN 1: SETUP DATABASE & NỀN TẢNG (3 CHỨC NĂNG)

> **Mục tiêu chính:** Hoàn thành toàn bộ cấu trúc DB và dữ liệu trong Tuần 1 để 3 thành viên còn lại có dữ liệu test API.

### 1. Công việc hạ tầng Database & Khung dự án:
- Cài đặt và cấu hình kết nối PostgreSQL qua SQLAlchemy (`database.py`, `config.py`).
- Xây dựng đầy đủ **10 Database Models** (`User`, `Province`, `Location`, `Itinerary`, `ItineraryItem`, `Review`, `Wishlist`, `Expense`, `TripMember`, `Notification`).
- Khai báo các Pydantic Schemas cơ bản (Base schemas).
- Viết file `seed_data.py` nạp sẵn dữ liệu chuẩn:
  - Tỉnh/thành: Vũng Tàu, Đà Lạt.
  - Hơn 40 địa điểm có tọa độ GPS thật, phân loại (bãi biển, quán ăn, cafe, điểm tham quan, khách sạn).

### 2. Các chức năng Backend phụ trách:
* **Chức năng 1 - 🔐 Xác thực & Tài khoản (Auth):**
  - `POST /api/auth/register`: Đăng ký tài khoản (mã hóa mật khẩu bcrypt).
  - `POST /api/auth/login`: Đăng nhập, cấp JWT Token.
  - `GET /api/auth/me`: Lấy thông tin user hiện tại (Dependency `get_current_user`).
* **Chức năng 2 - 📍 Quản lý Tỉnh thành & Khám phá Địa điểm:**
  - `GET /api/provinces`: Danh sách các tỉnh/thành du lịch.
  - `GET /api/provinces/{id}`: Chi tiết tỉnh/thành.
  - `GET /api/provinces/{id}/locations`: Danh sách địa điểm theo tỉnh (kèm lọc theo danh mục: ăn uống, check-in, cafe...).
  - `GET /api/locations/{id}`: Chi tiết một địa điểm.
  - `GET /api/locations/search`: Tìm kiếm địa điểm theo từ khóa, khoảng giá, rating.
* **Chức năng 8 - ❤️ Yêu thích (Wishlist):**
  - `POST /api/wishlist/{location_id}`: Thêm địa điểm vào danh sách yêu thích.
  - `DELETE /api/wishlist/{location_id}`: Xóa khỏi yêu thích.
  - `GET /api/wishlist`: Xem toàn bộ danh sách địa điểm đã lưu của user.

---

## 🧠 THÀNH VIÊN 2: LÕI THUẬT TOÁN LỊCH TRÌNH (4 CHỨC NĂNG)

> **Mục tiêu chính:** Xây dựng thuật toán phân bổ lịch trình tự động thông minh (trọng tâm của đồ án).

### Các chức năng Backend phụ trách:
* **Chức năng 3 - 🧠 Thuật toán gợi ý lịch trình tự động (`services/planner.py`):**
  - `POST /api/itineraries/generate`:
    - Nhận vào: `province_id`, `num_days`, `num_nights`.
    - Thuật toán tự động lọc địa điểm, phân chia thời gian theo khung giờ (08:00, 11:30, 14:00, 17:00, 19:00).
    - Xen kẽ hợp lý giữa: tham quan ngoài trời, quán ăn, quán cà phê nghỉ chân, điểm ngắm hoàng hôn.
    - Sắp xếp thứ tự các điểm gần nhau để tối ưu di chuyển.
* **Chức năng 4 - ✏️ Chỉnh sửa lịch trình:**
  - `POST /api/itineraries/{id}/items`: Thêm thủ công 1 địa điểm mới vào ngày cụ thể.
  - `DELETE /api/itineraries/{id}/items/{item_id}`: Xóa 1 địa điểm khỏi lịch trình.
  - `PUT /api/itineraries/{id}/items/{item_id}`: Cập nhật giờ ghé thăm, thứ tự hoặc chuyển sang ngày khác.
* **Chức năng 5 - 💾 Lưu & Quản lý lịch trình:**
  - `POST /api/itineraries`: Lưu lịch trình chính thức vào tài khoản user.
  - `GET /api/itineraries/my`: Lấy danh sách các chuyến đi của user.
  - `GET /api/itineraries/{id}`: Xem chi tiết toàn bộ lịch trình và các ngày.
  - `DELETE /api/itineraries/{id}`: Xóa lịch trình.
  - `PATCH /api/itineraries/{id}/status`: Cập nhật trạng thái (`planned` - sắp đi, `ongoing` - đang đi, `completed` - đã xong).
* **Chức năng 6 - 💰 Tính toán chi phí dự kiến:**
  - `GET /api/itineraries/{id}/costs`: Tự động quét các địa điểm trong lịch trình và tổng hợp chi phí dự kiến bóc tách theo: ăn uống, vé vào cổng, di chuyển, cà phê.

---

## 🛡️ THÀNH VIÊN 3: REVIEW, QUẢN TRỊ ADMIN & HỒ SƠ (5 CHỨC NĂNG)

> **Mục tiêu chính:** Phụ trách toàn bộ hệ thống tương tác người dùng, module quản trị Admin và báo cáo cá nhân.

### Các chức năng Backend phụ trách:
* **Chức năng 7 - ⭐ Đánh giá & Review:**
  - `POST /api/locations/{id}/reviews`: Tạo đánh giá mới (số sao 1-5, nhận xét, link ảnh).
  - `GET /api/locations/{id}/reviews`: Lấy danh sách đánh giá của địa điểm và tự động tính điểm rating trung bình.
  - `DELETE /api/reviews/{id}`: Xóa đánh giá (chính chủ mới được xóa).
* **Chức năng 9 - 🔗 Chia sẻ lịch trình:**
  - `POST /api/itineraries/{id}/share`: Tạo mã chia sẻ công khai (`share_code`).
  - `GET /api/shared/{share_code}`: API cho phép bất kỳ ai có link đều xem được chi tiết lịch trình (không bắt buộc đăng nhập).
  - `POST /api/shared/{share_code}/clone`: Cho phép người khác copy lịch trình được chia sẻ vào tài khoản của họ.
* **Chức năng 10 - 🔧 Quản trị hệ thống (Admin):**
  - `GET /api/admin/dashboard`: Thống kê tổng số: người dùng, địa điểm, lịch trình đã tạo, đánh giá.
  - `GET /api/admin/users`: Danh sách tất cả người dùng hệ thống.
  - `PATCH /api/admin/users/{id}`: Khóa hoặc mở khóa tài khoản người dùng.
  - `POST /api/admin/locations`: Thêm địa điểm du lịch mới vào cơ sở dữ liệu.
  - `PUT /api/admin/locations/{id}`: Sửa thông tin địa điểm (giá, giờ mở cửa, ảnh...).
  - `DELETE /api/admin/locations/{id}`: Xóa địa điểm.
  - `DELETE /api/admin/reviews/{id}`: Quyền Admin xóa review spam/xấu.
* **Chức năng 13 - 📊 Quản lý & So sánh ngân sách thực tế:**
  - `POST /api/itineraries/{id}/expenses`: Lưu chi phí thực tế mà người dùng đã tiêu sau chuyến đi.
  - `GET /api/itineraries/{id}/budget-compare`: Tính toán chênh lệch giữa ngân sách dự kiến và chi tiêu thực tế.
* **Chức năng 17 - 👤 Hồ sơ cá nhân & Thống kê du lịch:**
  - `GET /api/users/me/profile` & `PUT /api/users/me/profile`: Xem và cập nhật thông tin cá nhân.
  - `GET /api/users/me/stats`: Tổng kết thống kê (đã tạo bao nhiêu trip, ghé bao nhiêu tỉnh thành, đã viết bao nhiêu review).

---

## 🚀 THÀNH VIÊN 4: TIỆN ÍCH, API BÊN THỨ 3 & NHÓM (6 CHỨC NĂNG)

> **Mục tiêu chính:** Phụ trách tích hợp các thư viện xử lý file, dịch vụ bên ngoài và tính năng du lịch theo nhóm.

### Các chức năng Backend phụ trách:
* **Chức năng 11 - 📄 Xuất PDF lịch trình:**
  - `GET /api/itineraries/{id}/export-pdf`: Sử dụng thư viện backend (ReportLab / WeasyPrint) tạo file PDF lịch trình chi tiết và trả về dạng file download.
* **Chức năng 12 - 🌤️ Dự báo thời tiết:**
  - `GET /api/weather?province_id=&date=`: Tích hợp OpenWeatherMap API, lấy nhiệt độ, trạng thái thời tiết tại tọa độ tỉnh để phục vụ gợi ý đi trong nhà/ngoài trời.
* **Chức năng 14 - 🎉 Gợi ý điểm đến theo mùa & Lễ hội:**
  - `GET /api/suggestions/seasonal?month=`: Lọc các tỉnh thành có mùa đẹp nhất tương ứng với tháng truyền vào.
* **Chức năng 15 - 👥 Lịch trình nhóm (Group Trips):**
  - `POST /api/itineraries/{id}/invite`: Tạo mã mời nhóm (`invite_code`).
  - `POST /api/itineraries/join/{invite_code}`: Người dùng tham gia vào nhóm chuyến đi.
  - `GET /api/itineraries/{id}/members`: Lấy danh sách thành viên trong chuyến đi.
  - `POST /api/itineraries/{id}/vote`: Bình chọn (thích/không thích) địa điểm trong chuyến đi nhóm.
* **Chức năng 16 - 📝 Ghi chú chuyến đi:**
  - `POST /api/itinerary-items/{id}/notes`: Thêm ghi chú cho từng địa điểm (VD: "mang áo khoác", "đặt bàn trước 5h").
  - `PUT /api/notes/{id}` & `DELETE /api/notes/{id}`: Chỉnh sửa và xóa ghi chú.
* **Chức năng 18 - 🔔 Thông báo nhắc nhở:**
  - `GET /api/notifications`: Lấy danh sách thông báo của user (nhắc trước chuyến đi 1 ngày, lời mời tham gia nhóm...).
  - `PATCH /api/notifications/{id}/read`: Đánh dấu thông báo đã đọc.

---

## ⏱️ TIẾN ĐỘ THỰC HIỆN BACKEND THEO TUẦN

| Giai đoạn | 🗄️ Thành viên 1 | 🧠 Thành viên 2 | 🛡️ Thành viên 3 | 🚀 Thành viên 4 |
|---|---|---|---|---|
| **Tuần 1** | **Setup DB + 10 Models + Seed data** + API Auth | Chuẩn bị logic thuật toán phân bổ lịch trình | Chuẩn bị cấu trúc CRUD Review & Admin | Đăng ký API Key Weather, nghiên cứu lib PDF |
| **Tuần 2** | API Tỉnh & Địa điểm + Wishlist | **Hoàn thành thuật toán Planner & API Generate** | Xây dựng API Review & Wishlist | Xây dựng API Thời tiết & Gợi ý theo mùa |
| **Tuần 3** | Hỗ trợ fix DB, tối ưu truy vấn | Hoàn thành API Chỉnh sửa & Lưu lịch trình | Xây dựng API Quản trị Admin Dashboard | Xây dựng API Ghi chú & Thông báo |
| **Tuần 4** | Kiểm tra toàn vẹn dữ liệu & index | Hoàn thành API Chi phí dự kiến | Xây dựng API Chia sẻ & Clone lịch trình | Xây dựng API Lịch trình nhóm & Vote |
| **Tuần 5** | Hỗ trợ kiểm thử các luồng dữ liệu | Tối ưu thuật toán Planner (tránh lặp điểm) | Xây dựng API So sánh chi phí & Stats User | Xây dựng API Xuất file PDF |
| **Tuần 6** | **Kiểm thử tích hợp API (Postman / Swagger)** | Tinh chỉnh thuật toán & Fix bug | Fix bug Admin & Review | Fix bug PDF & Nhóm |

---

> 📌 **Ghi chú phối hợp:** File Swagger/OpenAPI sẽ tự động sinh tại địa chỉ `http://localhost:8000/docs` khi chạy FastAPI, giúp các thành viên test API độc lập và người làm Frontend dễ dàng tích hợp.
