# 🧭 Đi Cùng Lạc (Di Cung Lac)

> **Nền tảng hỗ trợ lập kế hoạch và tối ưu hóa trải nghiệm du lịch thông minh ứng dụng Trí tuệ Nhân tạo (AI)**  
> *Sứ mệnh: Lịch trình thật – Toạ độ thật – Trải nghiệm thật – Đáng tiền thật*

---

## 📑 Mục lục
1. [Giới thiệu dự án](#-giới-thiệu-dự-án)
2. [Các chức năng chính](#-các-chức-năng-chính)
3. [Tài khoản thử nghiệm hệ thống](#-tài-khoản-thử-nghiệm-hệ-thống)
4. [Công nghệ sử dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
5. [Cấu trúc thư mục dự án](#-cấu-trúc-thư-mục-dự-án)
6. [Hướng dẫn cài đặt & Khởi chạy](#-hướng-dẫn-cài-đặt--khởi-chạy)
7. [Thành viên nhóm & Phân công nhiệm vụ](#-thành-viên-nhóm--phân-công-nhiệm-vụ)

---

## 🌟 Giới thiệu dự án

Khi lên kế hoạch du lịch tự túc, người dùng thường gặp phải các vấn đề:
- Mất nhiều thời gian tra cứu và xâu chuỗi các điểm tham quan, ăn uống rải rác.
- Lịch trình không tối ưu về vị trí địa lý, dẫn đến việc di chuyển lòng vòng tốn thời gian và chi phí.
- Khó kiểm soát và dự toán ngân sách chi tiêu thực tế.
- Nhiều thông tin review trên mạng thiếu tính xác thực hoặc bị thương mại hóa.

**Đi Cùng Lạc** được xây dựng để giải quyết triệt để các vấn đề trên thông qua việc ứng dụng **Trí tuệ nhân tạo (Google Gemini AI)** kết hợp với **Bản đồ số thực tế (OSRM & Leaflet)**:
- Tự động gợi ý lịch trình chi tiết theo từng ngày, từng khung giờ.
- **Tối ưu hóa cung đường di chuyển thực tế**: Điểm khởi đầu mỗi ngày luôn là khách sạn lưu trú trung tâm, các điểm tham quan và ẩm thực tiếp theo được sắp xếp liền mạch theo khoảng cách đường bộ ngắn nhất.
- Kiểm soát tài chính minh bạch: So sánh trực quan giữa chi phí ước tính thực tế và ngân sách mong muốn của du khách.
- Kho dữ liệu địa điểm thực tế xác thực tọa độ GPS, menu món ăn đặc sản kèm giá và mẹo du lịch hữu ích.

---

## ✨ Các chức năng chính

### 1. 🗺️ Lập lịch trình thông minh (AI Smart Trip Planner)
- **Tùy biến điểm đến:** Hỗ trợ lập lịch trình cho tất cả 63 tỉnh thành trên cả nước hoặc các địa danh du lịch nổi tiếng (Đà Lạt, Vũng Tàu, Tây Ninh, Phú Quốc, Pleiku, Nha Trang, Hà Giang, Đà Nẵng...).
- **Cuốn lịch chọn ngày linh hoạt:** Lựa chọn `Ngày đi ➔ Ngày về` trực quan, tự động tính toán chính xác số ngày và số đêm.
- **Tùy chọn phong cách du lịch:** Nghỉ dưỡng, Check-in sống ảo, Khám phá văn hóa, Ẩm thực đặc sản, Phượt bụi...
- **Dự toán & Kiểm soát ngân sách chuyến đi:** Cho phép chọn mức ngân sách (*Tiết kiệm, Vừa phải, Sang chảnh*) và nhập số tiền ngân sách cụ thể (VNĐ). Hệ thống tự động đối chiếu tổng chi phí chuyến đi với ngân sách đã đặt để cảnh báo trong tầm chi tiêu hay vượt ngân sách.
- **Bản đồ tương tác trực quan (Interactive Map):**
  - Hiển thị toàn bộ lộ trình đường bộ thực tế (tính toán khoảng cách kilomet và thời gian di chuyển từng chặng qua OSRM).
  - Tương tác camera: Bấm vào bất kỳ điểm dừng nào trên danh sách lịch trình, bản đồ sẽ tự động di chuyển (`flyTo`) đến vị trí đó và hiển thị popup chi tiết.
- **Chỉnh sửa lịch trình thời gian thực:**
  - Bấm `+ Thêm điểm` vào từng ngày để bổ sung điểm đến mong muốn.
  - Xóa điểm dừng tùy ý: Bản đồ lộ trình và bảng tính toán chi phí sẽ tự động cập nhật ngay lập tức.
- **Lưu trữ & Xuất file:**
  - Lưu lịch trình vào mục **"Chuyến đi của tôi"** để quản lý và xem lại bất cứ lúc nào.
  - **Xuất file PDF** lịch trình chi tiết, chuyên nghiệp để in ấn hoặc mang theo khi di chuyển.

---

### 2. 🏖️ Khám phá Địa điểm & Ẩm thực thực tế (Explore & Reviews)
- **Kho dữ liệu địa điểm thực tế:** Lưu trữ danh sách điểm du lịch, nhà hàng, quán ăn đặc sản, quán cà phê, khách sạn...
- **Bộ lọc thông minh:** Tìm kiếm nhanh theo từ khóa, lọc theo tỉnh/thành phố và phân loại danh mục.
- **Chi tiết địa điểm xác thực:**
  - Tọa độ GPS chuẩn xác trên bản đồ.
  - **Menu món ăn đặc sản kèm giá tiền niêm yết rõ ràng.**
  - Mẹo du lịch thực tế (giờ đi đẹp nhất, lưu ý gửi xe, kinh nghiệm trải nghiệm).
  - Nút chuyển hướng mở trực tiếp trên **Google Maps**.
- **Đánh giá cộng đồng:** Xem và gửi đánh giá, chấm điểm sao kèm bình luận thực tế cho từng địa điểm.

---

### 3. 👑 Phân quyền & Gói thành viên VIP (Membership & VietQR)
- **Cơ chế phân quyền tài khoản chặt chẽ:**
  - **Tài khoản Thường (User):** Hỗ trợ lập lịch trình tối đa 2 Ngày 1 Đêm, lưu tối đa 2 chuyến đi trong hệ thống.
  - **Tài khoản VIP:** Mở khóa toàn bộ tính năng cao cấp, không giới hạn số ngày lập lịch trình (3N2Đ, 4N3Đ, 5N4Đ...), không giới hạn số lượng chuyến đi đã lưu.
- **Thanh toán nâng cấp VIP tiện lợi:**
  - Tích hợp cổng thanh toán mã **VietQR** tự động sinh mã theo gói dịch vụ.
  - Các gói linh hoạt: **Gói Khám phá (7 Ngày)**, **Gói Vi vu (1 Tháng - 30 Ngày)**, **Gói Trải nghiệm VIP (1 Năm - 365 Ngày)**.
  - Xác nhận kích hoạt VIP tự động ngay sau khi hoàn tất chuyển khoản.

---

### 4. 🤖 Trợ lý du lịch ảo AI Chatbot
- Tích hợp biểu tượng Chatbot thông minh ở góc màn hình.
- Sẵn sàng giải đáp, tư vấn món ăn ngon, trang phục phù hợp, thời tiết và kinh nghiệm di chuyển theo ngữ cảnh thực tế của từng địa phương.

---

### 5. ⚙️ Trung tâm Quản trị Hệ thống (Admin Dashboard)
Trang quản trị toàn diện dành riêng cho tài khoản Quản trị viên (`role: admin`) với giao diện hiện đại:
- **Tab 1 - Tổng quan số liệu (Overview):** Biểu đồ và thống kê tổng số người dùng, thành viên VIP, số chuyến đi đã tạo, tổng kho địa điểm và số lượt đánh giá.
- **Tab 2 - Quản trị Người dùng (User Management):**
  - Tìm kiếm và lọc người dùng theo vai trò (*Admin, VIP, Thường*).
  - Phân quyền nhanh: Nâng cấp tài khoản lên Admin hoặc hạ về User.
  - Cấp/gia hạn VIP nhanh trực tiếp (+7 Ngày, +1 Tháng, +1 Năm) hoặc hủy gói VIP.
  - Xóa tài khoản người dùng vi phạm.
  - Nút thêm mới tài khoản người dùng với cấu hình role và hạn VIP ban đầu.
- **Tab 3 - Quản lý Chuyến đi (Itineraries):** Theo dõi toàn bộ lịch trình người dùng đã tạo trên hệ thống, xem thông tin chi tiết hoặc xóa lịch trình không hợp lệ.
- **Tab 4 - Quản lý Địa điểm (Locations):**
  - Xem danh sách tọa độ GPS, mức giá và mẹo du lịch của tất cả địa điểm.
  - Thêm mới địa điểm vào bất kỳ tỉnh thành nào (hỗ trợ nhập cả tỉnh mới ngoài 63 tỉnh sẵn có).
  - Xóa địa điểm khỏi cơ sở dữ liệu.
  - **Cơ chế kho địa điểm tự mở rộng:** Khi người dùng lập lịch trình ở bất kỳ tỉnh thành mới nào trên cả nước, AI sẽ tự động phân tích, xác thực tọa độ GPS và tự lưu tỉnh mới cùng địa điểm mới vào CSDL.
- **Tab 5 - Kiểm duyệt Đánh giá (Reviews):** Kiểm duyệt, xóa các bình luận hoặc đánh giá vi phạm tiêu chuẩn cộng đồng.

---

## 🔐 Tài khoản thử nghiệm hệ thống

| Vai trò | Email đăng nhập | Mật khẩu | Quyền hạn & Mục đích kiểm thử |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@dicunglac.vn` | `admin123` | Toàn quyền quản trị hệ thống, duyệt đánh giá, quản lý người dùng, địa điểm & chuyến đi. |
| **Thành viên VIP (1 Năm)** | `vip@dicunglac.vn` | `vip123` | Không giới hạn số ngày lịch trình, không giới hạn lưu chuyến đi. |
| **Thành viên Thường** | `user@dicunglac.vn` | `user123` | Kiểm thử giới hạn tài khoản (tối đa 2N1Đ) và luồng nâng cấp VIP qua VietQR. |

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### Frontend
- **Ngôn ngữ & Thư viện:** React 18, TypeScript
- **Công cụ build:** Vite
- **Định dạng giao diện:** Tailwind CSS
- **Bản đồ số & Lộ trình:** Leaflet.js, OpenStreetMap, OSRM Routing Service
- **Icon & Thông báo:** React Icons, React Hot Toast
- **Điều hướng:** React Router DOM (v6)

### Backend
- **Framework:** Python FastAPI (RESTful API hiệu năng cao)
- **ORM & Database:** SQLAlchemy ORM, SQLite (mặc định môi trường local) / PostgreSQL
- **Bảo mật & Xác thực:** JWT (JSON Web Tokens), Bcrypt (Passlib)
- **Trí tuệ nhân tạo (AI):** Google Gemini AI SDK (`google-genai`)
- **Định vị & Geocoding:** OpenStreetMap Nominatim, OSRM
- **Xuất báo cáo:** ReportLab (PDF Generation)
- **Server:** Uvicorn ASGI

---

## 📂 Cấu trúc thư mục dự án

```
CNPM/
├── backend/                        # Nguồn Backend FastAPI (Python)
│   ├── app/
│   │   ├── models/                 # Cấu trúc CSDL SQLAlchemy (User, Province, Location, Itinerary, Review...)
│   │   ├── routers/                # API Endpoints
│   │   │   ├── admin.py            # API Quản trị hệ thống (Stats, Users, VIP, Itineraries, Locations...)
│   │   │   ├── auth.py             # API Đăng ký, Đăng nhập, Token JWT, Thông tin User
│   │   │   ├── chatbot.py          # API Trợ lý du lịch ảo AI Chatbot
│   │   │   ├── itineraries.py      # API Lưu, quản lý và xuất PDF lịch trình
│   │   │   ├── locations.py        # API Khám phá địa điểm, menu món ăn, đánh giá
│   │   │   ├── payments.py         # API Nâng cấp VIP qua mã thanh toán VietQR
│   │   │   └── planner.py          # API Lập lịch trình thông minh AI & Tối ưu lộ trình GPS
│   │   ├── services/               # Nghiệp vụ xác thực mật khẩu & gọi dịch vụ bên ngoài
│   │   ├── database.py             # Cấu hình kết nối cơ sở dữ liệu
│   │   ├── seed_data.py            # Script khởi tạo 96 địa điểm thực tế ban đầu
│   │   └── main.py                 # Điểm khởi động ứng dụng FastAPI
│   ├── requirements.txt            # Danh sách thư viện Python cần thiết
│   └── dicunglac.db                # Cơ sở dữ liệu SQLite
│
├── frontend/                       # Nguồn Frontend React (TypeScript + Vite)
│   ├── src/
│   │   ├── components/             # Các component giao diện tái sử dụng
│   │   │   ├── Footer.tsx          # Chân trang
│   │   │   ├── Navbar.tsx          # Thanh điều hướng chính (hỗ trợ hiển thị VIP/Admin)
│   │   │   ├── PaymentModal.tsx    # Bảng thanh toán nâng cấp VIP (VietQR)
│   │   │   ├── RouteMap.tsx        # Bản đồ lộ trình Leaflet tương tác
│   │   │   └── TravelAssistantModal.tsx # Cửa sổ Trợ lý ảo AI Chatbot
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx     # Quản lý trạng thái đăng nhập & phân quyền toàn cục
│   │   ├── pages/                  # Các trang giao diện chính
│   │   │   ├── AdminDashboard.tsx  # Trang Trung tâm Quản trị Admin
│   │   │   ├── Explore.tsx         # Trang Khám phá địa điểm & ẩm thực
│   │   │   ├── Home.tsx            # Trang chủ tìm kiếm & chọn lịch trình
│   │   │   ├── Login.tsx           # Trang Đăng nhập
│   │   │   ├── MyTrips.tsx         # Trang Chuyến đi của tôi (lịch trình đã lưu)
│   │   │   ├── PlanTrip.tsx        # Trang Lập kế hoạch du lịch thông minh
│   │   │   └── Register.tsx        # Trang Đăng ký tài khoản
│   │   ├── services/
│   │   │   └── api.ts              # Cấu hình Axios Client gọi Backend
│   │   ├── App.tsx                 # Router & Cấu trúc định tuyến chính
│   │   └── main.tsx
│   ├── package.json                # Danh sách dependencies Frontend
│   ├── tailwind.config.js          # Cấu hình Tailwind CSS
│   └── vite.config.ts              # Cấu hình Vite
│
└── README.md                       # Tài liệu hướng dẫn dự án
```

---

## 🛠️ Hướng dẫn cài đặt & Khởi chạy

### 1. Yêu cầu hệ thống
- **Node.js:** Phiên bản 18.x trở lên
- **Python:** Phiên bản 3.10 trở lên
- Trình quản lý gói: `npm` và `pip`

---

### 2. Cài đặt & Khởi chạy Backend

Mở một cửa sổ dòng lệnh tại thư mục gốc của dự án:

```powershell
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo Python (nếu chưa có)
python -m venv venv

# Kích hoạt môi trường ảo
# Trên Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Trên macOS / Linux:
# source venv/bin/activate

# Cài đặt các thư viện phụ thuộc
pip install -r requirements.txt

# Khởi chạy máy chủ Backend (FastAPI)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Backend sẽ chạy tại: **http://127.0.0.1:8000**
- Tài liệu API tương tác (Swagger UI): **http://127.0.0.1:8000/docs**

---

### 3. Cài đặt & Khởi chạy Frontend

Mở một cửa sổ dòng lệnh mới tại thư mục gốc của dự án:

```powershell
# Di chuyển vào thư mục frontend
cd frontend

# Cài đặt các gói thư viện
npm install

# Khởi chạy máy chủ phát triển Frontend
npm run dev -- --host 127.0.0.1 --port 5173
```

- Ứng dụng Web sẽ hoạt động tại: **http://127.0.0.1:5173**

---

## 👥 Thành viên nhóm & Phân công nhiệm vụ

| STT | Họ và tên | Mã số sinh viên (MSSV) | Vai trò chính | Nhiệm vụ phụ trách cụ thể |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Trần Hải Đăng** *(Trưởng nhóm)* | `231A010065` | Frontend Lead & Tích hợp hệ thống | • Thiết kế toàn bộ giao diện người dùng UI/UX (React TypeScript, Tailwind CSS)<br>• Tích hợp bản đồ lộ trình Leaflet tương tác, cuốn lịch trực quan, modal VietQR<br>• Đồng bộ phiên đăng nhập, xử lý State Management & kết nối API |
| **2** | **Lê Trọng Hiếu** | `231A290152` | Backend & AI Smart Planner | • Phát triển thuật toán AI Trip Planner (Google Gemini AI + OSRM Routing)<br>• Tối ưu hóa thứ tự cung đường di chuyển thực tế (km, phút) theo tọa độ GPS<br>• Xây dựng module tính toán, đối chiếu ngân sách và dịch vụ AI Chatbot |
| **3** | **Phạm Đức Nhân** | `231A290154` | Backend & Kiến trúc CSDL | • Thiết kế kiến trúc Database Models (SQLAlchemy) & Quản lý Session<br>• Xây dựng hệ thống Xác thực người dùng (Auth JWT, Bcrypt, Google Login)<br>• Xây dựng API Quản lý Tỉnh thành (Provinces) & Kho Địa điểm (Locations) |
| **4** | **Lê Phú An** | `231A290083` | Backend & Quản trị Hệ thống | • Xây dựng hệ thống API Quản trị Admin Dashboard (Users, Trips, Reviews, Stats)<br>• Xây dựng module Đánh giá/Review cộng đồng, Yêu thích (Wishlist)<br>• Xây dựng module thanh toán nâng cấp VIP (VietQR) và xuất báo cáo lịch trình PDF |
