import React, { useState } from 'react';

export const PeanutRider: React.FC = () => {
  const [honkCount, setHonkCount] = useState(0);
  const [honkText, setHonkText] = useState('');

  const handleHonk = () => {
    const messages = [
      '🚗 Píp píp! Ô tô Bé Lạc dẫn đoàn nè! 🥜',
      '🛵 Bíp bíp! Xe máy rồ ga ôm cua! 💨',
      '🚲 Kính coong! Bé Lạc đạp xe chill chill! 🌸',
      '🎉 Đoàn phượt Đi Cùng Lạc xuất phát! 🚀'
    ];
    setHonkText(messages[honkCount % messages.length]);
    setHonkCount((prev) => prev + 1);
  };

  return (
    <div className="absolute -bottom-2.5 left-0 right-0 h-11 pointer-events-none overflow-hidden z-20">
      {/* Vạch đường lộ trình nét đứt chạy ngầm dưới navbar */}
      <div className="absolute bottom-1 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* ĐOÀN 3 PHƯƠNG TIỆN: Ô TÔ 🚗 + XE MÁY 🛵 + XE ĐẠP 🚲 */}
      <div
        className="peanut-rider-container absolute bottom-0.5 flex items-end gap-3 cursor-pointer pointer-events-auto"
        onClick={handleHonk}
        title="Bấm vào đoàn xe Bé Lạc để bóp còi píp píp & kính coong!"
      >
        {/* Bóng thoại còi xe vui nhộn khi bấm */}
        {honkText && (
          <div className="absolute -top-6 left-12 bg-white border border-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce z-40">
            {honkText}
          </div>
        )}

        {/* ================= 1. XE Ô TÔ MUI TRẦN DU LỊCH 🚗 ================= */}
        <div className="relative animate-peanut-bounce">
          <svg
            width="82"
            height="36"
            viewBox="0 0 135 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xs select-none"
          >
            {/* Khói pô ô tô */}
            <g className="animate-pulse">
              <circle cx="8" cy="48" r="3.5" fill="#cbd5e1" opacity="0.6" />
              <circle cx="16" cy="50" r="4.5" fill="#94a3b8" opacity="0.5" />
            </g>

            {/* BÁNH XE SAU Ô TÔ */}
            <g className="animate-spin" style={{ transformOrigin: '32px 48px', animationDuration: '0.35s' }}>
              <circle cx="32" cy="48" r="11" fill="#1e293b" />
              <circle cx="32" cy="48" r="7" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="32" cy="48" r="3.5" fill="#0f172a" />
              <line x1="32" y1="37" x2="32" y2="59" stroke="#f59e0b" strokeWidth="2" />
              <line x1="21" y1="48" x2="43" y2="48" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* BÁNH XE TRƯỚC Ô TÔ */}
            <g className="animate-spin" style={{ transformOrigin: '102px 48px', animationDuration: '0.35s' }}>
              <circle cx="102" cy="48" r="11" fill="#1e293b" />
              <circle cx="102" cy="48" r="7" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="102" cy="48" r="3.5" fill="#0f172a" />
              <line x1="102" y1="37" x2="102" y2="59" stroke="#f59e0b" strokeWidth="2" />
              <line x1="91" y1="48" x2="113" y2="48" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* THÂN XE Ô TÔ MUI TRẦN (Màu cam đỏ thể thao) */}
            <path
              d="M 18 48 L 22 36 L 46 36 L 62 36 L 86 36 L 102 38 L 122 42 L 126 50 L 112 50 L 92 50 L 42 50 L 22 50 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            {/* Kính chắn gió mui trần nghiêng thể thao */}
            <path d="M 82 36 L 94 22 L 98 36 Z" fill="#38bdf8" opacity="0.8" stroke="#0284c7" strokeWidth="1" />
            {/* Gương chiếu hậu ô tô */}
            <circle cx="84" cy="32" r="2.5" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* ĐÈN PHA Ô TÔ */}
            <polygon points="122,40 128,39 128,45 122,44" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            <polygon points="128,39 148,32 148,52 128,45" fill="#fef08a" opacity="0.3" />

            {/* Vali hành lý du lịch ở ghế sau */}
            <rect x="36" y="27" width="16" height="10" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <line x1="44" y1="27" x2="44" y2="37" stroke="#b45309" strokeWidth="1" />

            {/* BÉ LẠC TÀI XẾ LÁI Ô TÔ (Đeo kính râm ngầu, cầm vô lăng) */}
            <g transform="rotate(4 68 20)">
              {/* Thân bé Lạc */}
              <path
                d="M 64 12 C 59 13, 58 19, 61 24 C 59 26, 59 31, 63 35 C 68 38, 74 37, 76 33 C 77 29, 76 25, 73 23 C 77 20, 77 14, 72 12 C 68 10, 66 11, 64 12 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              {/* Kính râm đen ngầu */}
              <rect x="63" y="16" width="6" height="4" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="71" y="15" width="6" height="4" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <line x1="69" y1="17" x2="71" y2="17" stroke="#0f172a" strokeWidth="1.5" />
              {/* Miệng cười tươi */}
              <path d="M 67 23 Q 70 25 73 22" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Mũ lưỡi trai phượt thủ đội ngược cá tính */}
              <path d="M 62 13 C 62 5, 76 5, 76 13 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              <path d="M 60 13 L 53 14" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
              {/* Tay cầm vô lăng ô tô */}
              <circle cx="83" cy="30" r="5" stroke="#334155" strokeWidth="2" fill="none" />
              <path d="M 68 26 Q 76 27 82 29" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>

        {/* ================= 2. XE MÁY MOTOR PHƯỢT CẶP ĐÔI 🛵 ================= */}
        <div className="relative animate-peanut-bounce" style={{ animationDelay: '0.12s' }}>
          <svg
            width="76"
            height="36"
            viewBox="0 0 130 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xs select-none"
          >
            {/* Khói pô xe máy */}
            <g className="animate-pulse">
              <circle cx="6" cy="46" r="3.5" fill="#cbd5e1" opacity="0.6" />
              <circle cx="13" cy="48" r="4.5" fill="#94a3b8" opacity="0.5" />
            </g>

            {/* BÁNH XE SAU XE MÁY */}
            <g className="animate-spin" style={{ transformOrigin: '28px 46px', animationDuration: '0.35s' }}>
              <circle cx="28" cy="46" r="12" fill="#1e293b" />
              <circle cx="28" cy="46" r="8" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="28" cy="46" r="4" fill="#0f172a" />
              <line x1="28" y1="34" x2="28" y2="58" stroke="#f59e0b" strokeWidth="2" />
              <line x1="16" y1="46" x2="40" y2="46" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* BÁNH XE TRƯỚC XE MÁY */}
            <g className="animate-spin" style={{ transformOrigin: '98px 46px', animationDuration: '0.35s' }}>
              <circle cx="98" cy="46" r="12" fill="#1e293b" />
              <circle cx="98" cy="46" r="8" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="98" cy="46" r="4" fill="#0f172a" />
              <line x1="98" y1="34" x2="98" y2="58" stroke="#f59e0b" strokeWidth="2" />
              <line x1="86" y1="46" x2="110" y2="46" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* KHUNG XE MÁY SPORTBIKE (Vàng cam cá tính) */}
            <path
              d="M 28 46 L 44 42 L 62 36 L 80 32 L 95 38 L 98 46 L 88 44 L 68 46 L 46 48 Z"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="2"
            />
            {/* Đèn pha */}
            <polygon points="96,33 104,31 104,38 96,36" fill="#fef08a" stroke="#eab308" strokeWidth="1" />

            {/* BÉ LẠC NGỒI SAU ÔM EO */}
            <g transform="rotate(-4 48 22)">
              <path
                d="M 44 14 C 40 15, 39 20, 42 24 C 40 26, 40 30, 43 33 C 47 36, 52 35, 54 31 C 55 28, 54 24, 52 22 C 55 19, 55 14, 51 12 C 47 10, 46 11, 44 14 Z"
                fill="#fde047"
                stroke="#d97706"
                strokeWidth="1.8"
              />
              <circle cx="43" cy="20" r="1.6" fill="#f43f5e" opacity="0.7" />
              <circle cx="51" cy="19" r="1.6" fill="#f43f5e" opacity="0.7" />
              <path d="M 42 14 C 42 6, 53 6, 53 14 Z" fill="#ec4899" stroke="#be185d" strokeWidth="1.4" />
              <path d="M 48 25 Q 58 26 66 27" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            {/* BÉ LẠC TÀI XẾ XE MÁY */}
            <g transform="rotate(8 68 20)">
              <path
                d="M 64 12 C 59 13, 58 19, 61 24 C 59 26, 59 31, 63 35 C 68 38, 74 37, 76 33 C 77 29, 76 25, 73 23 C 77 20, 77 14, 72 12 C 68 10, 66 11, 64 12 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              <path d="M 61 13 C 61 4, 76 4, 76 13 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
              <path d="M 68 25 Q 78 25 88 26" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>

        {/* ================= 3. XE ĐẠP DU LỊCH CHILL CHILL 🚲 ================= */}
        <div className="relative animate-peanut-bounce" style={{ animationDelay: '0.22s' }}>
          <svg
            width="65"
            height="36"
            viewBox="0 0 115 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xs select-none"
          >
            {/* BÁNH XE SAU XE ĐẠP (Nan hoa thanh mảnh) */}
            <g className="animate-spin" style={{ transformOrigin: '24px 46px', animationDuration: '0.35s' }}>
              <circle cx="24" cy="46" r="12" fill="none" stroke="#334155" strokeWidth="2.5" />
              <circle cx="24" cy="46" r="3" fill="#64748b" />
              <line x1="24" y1="34" x2="24" y2="58" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="12" y1="46" x2="36" y2="46" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="15" y1="37" x2="33" y2="55" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="15" y1="55" x2="33" y2="37" stroke="#94a3b8" strokeWidth="1.2" />
            </g>

            {/* BÁNH XE TRƯỚC XE ĐẠP */}
            <g className="animate-spin" style={{ transformOrigin: '88px 46px', animationDuration: '0.35s' }}>
              <circle cx="88" cy="46" r="12" fill="none" stroke="#334155" strokeWidth="2.5" />
              <circle cx="88" cy="46" r="3" fill="#64748b" />
              <line x1="88" y1="34" x2="88" y2="58" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="76" y1="46" x2="100" y2="46" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="79" y1="37" x2="97" y2="55" stroke="#94a3b8" strokeWidth="1.2" />
              <line x1="79" y1="55" x2="97" y2="37" stroke="#94a3b8" strokeWidth="1.2" />
            </g>

            {/* KHUNG XE ĐẠP THỂ THAO (Màu xanh ngọc mint mát mẻ) */}
            <line x1="24" y1="46" x2="52" y2="46" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="24" y1="46" x2="44" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="52" y1="46" x2="44" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="52" y1="46" x2="74" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="44" y1="30" x2="74" y2="30" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="74" y1="30" x2="88" y2="46" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

            {/* YÊN XE ĐẠP */}
            <path d="M 38 29 L 48 29" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

            {/* CỔ XE & GHI ĐÔNG XE ĐẠP CÓ CHUÔNG KÍNH COONG */}
            <line x1="74" y1="30" x2="72" y2="21" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="68" y1="21" x2="78" y2="21" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
            {/* Chuông xe đạp nhỏ xíu */}
            <circle cx="70" cy="18" r="2" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />

            {/* BÀN ĐẠP PEDAN QUAY QUAY */}
            <circle cx="52" cy="46" r="3.5" fill="#475569" />
            <line x1="52" y1="46" x2="56" y2="52" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

            {/* BÉ LẠC ĐẠP XE ĐẠP CƯỜI TƯƠI RÓI */}
            <g transform="rotate(2 50 18)">
              {/* Thân bé Lạc */}
              <path
                d="M 46 12 C 41 13, 40 19, 43 24 C 41 26, 41 31, 45 35 C 50 38, 56 37, 58 33 C 59 29, 58 25, 55 23 C 59 20, 59 14, 54 12 C 50 10, 48 11, 46 12 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              {/* Khuôn mặt cười tít mắt */}
              <circle cx="45" cy="20" r="1.8" fill="#f43f5e" opacity="0.7" />
              <circle cx="55" cy="19" r="1.8" fill="#f43f5e" opacity="0.7" />
              <path d="M 46 17 Q 48 15 49 17" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M 52 16 Q 54 14 55 16" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              <path d="M 49 22 Q 51 25 53 22" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
              {/* Nón bảo hiểm xe đạp thể thao màu xanh dương */}
              <path d="M 43 13 C 43 5, 57 5, 57 13 Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
              {/* Tay lái xe đạp */}
              <path d="M 52 25 Q 62 24 72 22" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Chân đạp pedan */}
              <path d="M 48 34 L 54 44" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
