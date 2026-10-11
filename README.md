# 🧭 Đi Cùng Lạc (Di Cung Lac)

> **Nền tảng hỗ trợ lập kế hoạch và tối ưu hóa trải nghiệm du lịch thông minh**  
> *Kim chỉ nam: Lịch trình thật – Trải nghiệm thật – Đáng tiền thật*

---

## 🌟 Giới thiệu đề tài
**Đi Cùng Lạc** là nền tảng web ứng dụng công nghệ hỗ trợ du khách khám phá địa điểm, trải nghiệm ẩm thực, văn hóa địa phương và tự động gợi ý lịch trình du lịch thông minh dựa trên thời gian, sở thích và ngân sách thực tế.

Hệ thống kết hợp dữ liệu xác thực, chống review ảo và tích hợp Trí tuệ nhân tạo (AI) giúp tối ưu hóa chuyến đi, tính toán chi phí minh bạch và dự báo các yếu tố thời tiết/mùa vụ.

---

## 🚀 Công nghệ sử dụng (Tech Stack)

### 🎨 Frontend
- **Framework:** ReactJS (TypeScript)
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Icons & UI:** React Icons, React Hot Toast
- **Bản đồ:** Leaflet.js / OpenStreetMap

### ⚙️ Backend & Database
- **Framework:** Python (FastAPI)
- **Database:** PostgreSQL (SQLAlchemy ORM + Alembic)
- **Xác thực:** JWT (JSON Web Tokens) + Bcrypt
- **Tích hợp AI:** Google Gemini API / OpenAI API (RAG architecture)
- **Dịch vụ mở rộng:** OpenWeatherMap API, ReportLab (Xuất PDF)

---

## 📂 Cấu trúc thư mục dự án

```
CNPM/
├── backend/                  # Mã nguồn FastAPI Backend
│   ├── app/
│   │   ├── models/           # Cấu trúc Database Models (SQLAlchemy)
│   │   ├── schemas/          # Pydantic Schemas (Request/Response)
│   │   ├── routers/          # API Endpoints (Auth, Locations, Planner...)
│   │   ├── services/         # Nghiệp vụ logic & Thuật toán AI Planner
│   │   ├── seed/             # Dữ liệu mẫu (Vũng Tàu, Đà Lạt...)
│   │   ├── config.py         # Cấu hình môi trường & Database
│   │   └── main.py           # Điểm khởi động ứng dụng FastAPI
│   ├── requirements.txt      # Danh sách thư viện Python
│   └── .env.example          # Mẫu cấu hình môi trường
│
├── frontend/                 # Mã nguồn React Frontend
│   ├── src/
│   │   ├── components/       # Các component UI tái sử dụng
│   │   ├── pages/            # Các trang giao diện chính (Home, Plan, Explore...)
│   │   ├── services/         # Kết nối gọi API backend
│   │   ├── types/            # Định nghĩa TypeScript interfaces
│   │   └── App.tsx
│   ├── package.json
│   └── tailwind.config.js
│
├── docs/                     # Tài liệu thiết kế & đặc tả hệ thống
└── README.md
```

---

## 👥 Thành viên nhóm & Phân công
- **Thành viên 1:** Setup Database PostgreSQL, Authentication API, Locations & Provinces API.
- **Thành viên 2:** Thuật toán AI Smart Trip Planner, Quản lý & Chỉnh sửa lịch trình, Tính toán chi phí.
- **Thành viên 3:** Hệ thống Review & Đánh giá, Quản trị Admin Dashboard, Chia sẻ lịch trình.
- **Thành viên 4:** Tích hợp AI Chatbot du lịch, Dự báo thời tiết, Xuất file PDF, Chuyến đi nhóm.
- **Frontend Lead:** Thiết kế toàn bộ giao diện người dùng & tích hợp luồng tương tác API.

---

## 📄 Bản quyền & Giấy phép
Dự án được xây dựng phục vụ môn học Công nghệ phần mềm (CNPM).
