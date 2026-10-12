import React, { useState } from 'react';

export const PeanutRider: React.FC = () => {
  const [isHonking, setIsHonking] = useState(false);

  const handleHonk = () => {
    setIsHonking(true);
    setTimeout(() => setIsHonking(false), 2000);
  };

  return (
    <div className="absolute -bottom-3 left-0 right-0 h-10 pointer-events-none overflow-hidden z-20">
      {/* Vạch đường nét đứt mờ chạy ngang dưới navbar */}
      <div className="absolute bottom-1.5 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />

      {/* Xe Motor Bé Lạc chạy ngang */}
      <div
        className="peanut-rider-container absolute bottom-0 flex items-center cursor-pointer pointer-events-auto"
        onClick={handleHonk}
        title="Bấm vào Bé Lạc để bóp còi bíp bíp!"
      >
        {/* Bong bóng hội thoại Bíp bíp khi bấm */}
        {isHonking && (
          <div className="absolute -top-7 left-6 bg-white border border-amber-300 text-amber-950 font-black text-[10px] px-2 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce z-30">
            🛵 Bíp bíp! Đi cùng Lạc nha! 🥜
          </div>
        )}

        {/* SVG Bé Lạc lái Motor siêu cute */}
        <div className="relative animate-peanut-bounce">
          <svg
            width="75"
            height="46"
            viewBox="0 0 100 62"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-sm select-none"
          >
            {/* Khói xe phụt ra phía sau */}
            <g className="animate-pulse">
              <circle cx="8" cy="46" r="3.5" fill="#e2e8f0" opacity="0.7" />
              <circle cx="15" cy="48" r="4.5" fill="#cbd5e1" opacity="0.6" />
              <circle cx="3" cy="44" r="2.5" fill="#f1f5f9" opacity="0.5" />
            </g>

            {/* BÁNH XE SAU */}
            <g className="animate-spin" style={{ transformOrigin: '28px 46px', animationDuration: '0.4s' }}>
              <circle cx="28" cy="46" r="11" fill="#334155" />
              <circle cx="28" cy="46" r="7" fill="#94a3b8" />
              <circle cx="28" cy="46" r="3.5" fill="#f8fafc" />
              <line x1="28" y1="36" x2="28" y2="56" stroke="#475569" strokeWidth="1.5" />
              <line x1="18" y1="46" x2="38" y2="46" stroke="#475569" strokeWidth="1.5" />
            </g>

            {/* BÁNH XE TRƯỚC */}
            <g className="animate-spin" style={{ transformOrigin: '78px 46px', animationDuration: '0.4s' }}>
              <circle cx="78" cy="46" r="11" fill="#334155" />
              <circle cx="78" cy="46" r="7" fill="#94a3b8" />
              <circle cx="78" cy="46" r="3.5" fill="#f8fafc" />
              <line x1="78" y1="36" x2="78" y2="56" stroke="#475569" strokeWidth="1.5" />
              <line x1="68" y1="46" x2="88" y2="46" stroke="#475569" strokeWidth="1.5" />
            </g>

            {/* ỐNG PÔ XE */}
            <rect x="18" y="44" width="16" height="4" rx="2" fill="#64748b" />
            <rect x="14" y="45" width="6" height="2" rx="1" fill="#475569" />

            {/* KHUNG THÂN XE MOTOR PHƯỢT */}
            <path
              d="M 28 46 L 46 44 L 62 38 L 74 46 L 68 34 L 52 34 Z"
              fill="#f59e0b"
              stroke="#d97706"
              strokeWidth="2"
            />
            {/* Chắn bùn trước & sau */}
            <path d="M 20 40 Q 28 32 36 42" stroke="#d97706" strokeWidth="3" fill="none" />
            <path d="M 70 40 Q 78 32 86 42" stroke="#d97706" strokeWidth="3" fill="none" />

            {/* YÊN XE */}
            <path d="M 36 34 Q 44 32 54 35" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />

            {/* ĐẦU XE & GHI ĐÔNG */}
            <line x1="68" y1="36" x2="72" y2="24" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
            <line x1="68" y1="24" x2="76" y2="24" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
            {/* Gương chiếu hậu */}
            <circle cx="68" cy="20" r="2.5" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

            {/* ĐÈN PHA XE CHIẾU SÁNG */}
            <polygon points="76,28 83,26 83,32 76,30" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            <polygon points="83,25 99,19 99,38 83,33" fill="#fef08a" opacity="0.35" />

            {/* ================= BÉ LẠC (HẠT ĐẬU PHỘNG) ================= */}
            {/* Thân củ lạc (hình bầu dục 2 ngấn thon ở eo) */}
            <g transform="rotate(-6 48 24)">
              {/* Thân hạt đậu phộng */}
              <path
                d="M 44 14 
                   C 39 15, 38 21, 41 26 
                   C 39 28, 39 33, 43 36 
                   C 48 39, 54 38, 56 34 
                   C 57 30, 56 26, 53 24 
                   C 57 21, 57 15, 52 13 
                   C 48 11, 46 12, 44 14 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              {/* Vân vỏ đậu phộng dễ thương */}
              <path d="M 43 18 Q 45 19 44 22" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M 50 17 Q 52 19 50 21" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M 45 29 Q 47 31 46 34" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
              <path d="M 51 28 Q 53 31 51 34" stroke="#d97706" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />

              {/* MẮT CƯỜI TÍT HÍP VÀ MÁ HỒNG */}
              {/* Mắt trái & phải */}
              <path d="M 44 20 Q 46 18 47 20" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 50 19 Q 52 17 53 19" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Miệng cười xinh */}
              <path d="M 47 23 Q 49 26 51 23" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Má hồng */}
              <circle cx="43" cy="22" r="1.8" fill="#f43f5e" opacity="0.6" />
              <circle cx="53" cy="21" r="1.8" fill="#f43f5e" opacity="0.6" />

              {/* MŨ BẢO HIỂM PHƯỢT ĐỎ RỰC */}
              <path
                d="M 41 15 C 41 7, 56 6, 56 14 Z"
                fill="#ef4444"
                stroke="#b91c1c"
                strokeWidth="1.5"
              />
              {/* Kính bảo hộ trên mũ */}
              <rect x="44" y="11" width="9" height="3" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />

              {/* KHĂN RẰN PHƯỢT THỦ BAY TRONG GIÓ */}
              <path
                d="M 44 27 L 34 26 L 36 29 L 43 29 Z"
                fill="#fb923c"
                stroke="#ea580c"
                strokeWidth="1"
              />

              {/* TAY CẦM GHI ĐÔNG */}
              <path
                d="M 48 26 Q 58 26 68 25"
                stroke="#d97706"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
