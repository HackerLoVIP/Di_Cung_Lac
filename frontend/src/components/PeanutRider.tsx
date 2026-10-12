import React, { useState } from 'react';

export const PeanutRider: React.FC = () => {
  const [honkCount, setHonkCount] = useState(0);
  const [honkText, setHonkText] = useState('');

  const handleHonk = () => {
    const messages = [
      '🛵 Bíp bíp! Đi phượt cùng Lạc nha! 🥜',
      '💨 Rồ ga lên đèo săn mây thôi nào! 🏔️',
      '✌️ Đoàn phượt Đi Cùng Lạc xuất phát! 🚀',
      '🎉 Ôm chặt eo Lạc nha, chuẩn bị ôm cua! 🏁'
    ];
    setHonkText(messages[honkCount % messages.length]);
    setHonkCount((prev) => prev + 1);
  };

  return (
    <div className="absolute -bottom-2.5 left-0 right-0 h-11 pointer-events-none overflow-hidden z-20">
      {/* Vạch đường cao tốc / lộ trình nét đứt chạy ngầm dưới navbar */}
      <div className="absolute bottom-1 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* ĐOÀN PHƯỢT 2 XE MOTOR CỦA CÁC BÉ LẠC */}
      <div
        className="peanut-rider-container absolute bottom-0.5 flex items-end gap-3.5 cursor-pointer pointer-events-auto"
        onClick={handleHonk}
        title="Bấm vào đoàn xe Bé Lạc để bóp còi bíp bíp!"
      >
        {/* Bóng thoại còi xe vui nhộn khi bấm */}
        {honkText && (
          <div className="absolute -top-6 left-6 bg-white border border-amber-400 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full shadow-md whitespace-nowrap animate-bounce z-40">
            {honkText}
          </div>
        )}

        {/* ================= XE 1: SPORTBIKE PHÂN KHỐI LỚN (CHỞ CẶP ĐÔI BÉ LẠC) ================= */}
        <div className="relative animate-peanut-bounce">
          <svg
            width="76"
            height="36"
            viewBox="0 0 130 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xs select-none"
          >
            {/* Khói pô xả ra sau */}
            <g className="animate-pulse">
              <circle cx="6" cy="46" r="3.5" fill="#cbd5e1" opacity="0.7" />
              <circle cx="13" cy="48" r="4.5" fill="#94a3b8" opacity="0.6" />
              <circle cx="2" cy="44" r="2.5" fill="#e2e8f0" opacity="0.5" />
            </g>

            {/* BÁNH XE SAU SPORTBIKE (Vành đúc thể thao) */}
            <g className="animate-spin" style={{ transformOrigin: '28px 46px', animationDuration: '0.35s' }}>
              <circle cx="28" cy="46" r="12" fill="#1e293b" />
              <circle cx="28" cy="46" r="8" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="28" cy="46" r="4" fill="#0f172a" />
              <line x1="28" y1="34" x2="28" y2="58" stroke="#f59e0b" strokeWidth="2" />
              <line x1="16" y1="46" x2="40" y2="46" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* BÁNH XE TRƯỚC SPORTBIKE */}
            <g className="animate-spin" style={{ transformOrigin: '98px 46px', animationDuration: '0.35s' }}>
              <circle cx="98" cy="46" r="12" fill="#1e293b" />
              <circle cx="98" cy="46" r="8" fill="#e2e8f0" stroke="#f59e0b" strokeWidth="1.5" />
              <circle cx="98" cy="46" r="4" fill="#0f172a" />
              <line x1="98" y1="34" x2="98" y2="58" stroke="#f59e0b" strokeWidth="2" />
              <line x1="86" y1="46" x2="110" y2="46" stroke="#f59e0b" strokeWidth="2" />
            </g>

            {/* PÔ ĐỘ AKRAPOVIC THỂ THAO */}
            <path d="M 16 45 L 36 41 L 38 46 L 16 48 Z" fill="#475569" stroke="#0f172a" strokeWidth="1" />
            <rect x="12" y="44" width="6" height="4" rx="1.5" fill="#f59e0b" />

            {/* DÀN ÁO KHUNG XE SPORTBIKE (Màu đỏ cam xe đua cực ngầu) */}
            <path
              d="M 28 46 L 44 42 L 62 36 L 80 32 L 95 38 L 98 46 L 88 44 L 68 46 L 46 48 Z"
              fill="#ef4444"
              stroke="#b91c1c"
              strokeWidth="2"
            />
            {/* Bình xăng gồ cao thể thao & Ốp sườn */}
            <path d="M 64 34 Q 76 28 84 34 L 78 40 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            {/* Kính chắn gió xe đua vuốt nhọn phía trước */}
            <path d="M 86 31 L 96 22 L 92 34 Z" fill="#38bdf8" opacity="0.8" stroke="#0284c7" strokeWidth="1" />

            {/* YÊN XE 2 TẦNG (Tầng trước cho tài xế, tầng sau vểnh cao) */}
            <path d="M 40 33 Q 48 31 58 35" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            <path d="M 58 35 Q 64 33 70 34" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />

            {/* TAY LÁI CLIP-ON & GƯƠNG CHIẾU HẬU */}
            <line x1="86" y1="32" x2="90" y2="25" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <circle cx="89" cy="22" r="2.5" fill="#cbd5e1" stroke="#334155" strokeWidth="1" />

            {/* ĐÈN PHA LED MẮT CÚ ĐÔI SIÊU SÁNG */}
            <polygon points="96,33 104,31 104,38 96,36" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            {/* Luồng sáng chiếu xa */}
            <polygon points="104,31 128,24 128,45 104,38" fill="#fef08a" opacity="0.35" />

            {/* ---------------- BÉ LẠC NGỒI SAU (ÔM EO DỄ THƯƠNG) ---------------- */}
            <g transform="rotate(-4 48 22)">
              {/* Thân củ lạc ngồi sau */}
              <path
                d="M 44 14 C 40 15, 39 20, 42 24 C 40 26, 40 30, 43 33 C 47 36, 52 35, 54 31 C 55 28, 54 24, 52 22 C 55 19, 55 14, 51 12 C 47 10, 46 11, 44 14 Z"
                fill="#fde047"
                stroke="#d97706"
                strokeWidth="1.8"
              />
              {/* Má hồng cute */}
              <circle cx="43" cy="20" r="1.6" fill="#f43f5e" opacity="0.7" />
              <circle cx="51" cy="19" r="1.6" fill="#f43f5e" opacity="0.7" />
              {/* Mắt cười tít mắt */}
              <path d="M 44 18 Q 46 16 47 18" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              <path d="M 49 17 Q 51 15 52 17" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              {/* Miệng cười xinh */}
              <path d="M 47 21 Q 48 23 50 21" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              {/* Nón bảo hiểm hồng tai mèo đáng yêu */}
              <path d="M 42 14 C 42 6, 53 6, 53 14 Z" fill="#ec4899" stroke="#be185d" strokeWidth="1.4" />
              {/* Tai mèo trên nón */}
              <polygon points="43,8 45,3 47,8" fill="#f472b6" stroke="#be185d" strokeWidth="0.8" />
              <polygon points="49,8 51,3 53,8" fill="#f472b6" stroke="#be185d" strokeWidth="0.8" />
              {/* Tay ôm eo Lạc tài xế */}
              <path d="M 48 25 Q 58 26 66 27" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            {/* ---------------- BÉ LẠC TÀI XẾ (NGỒI TRƯỚC LÁI MOTOR NGẦU) ---------------- */}
            <g transform="rotate(8 68 20)">
              {/* Thân củ lạc tài xế */}
              <path
                d="M 64 12 C 59 13, 58 19, 61 24 C 59 26, 59 31, 63 35 C 68 38, 74 37, 76 33 C 77 29, 76 25, 73 23 C 77 20, 77 14, 72 12 C 68 10, 66 11, 64 12 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              {/* Kính râm đen phi công siêu ngầu */}
              <rect x="63" y="16" width="6" height="4" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <rect x="71" y="15" width="6" height="4" rx="1.5" fill="#0f172a" stroke="#475569" strokeWidth="0.8" />
              <line x1="69" y1="17" x2="71" y2="17" stroke="#0f172a" strokeWidth="1.5" />
              {/* Miệng cười nhếch mép tự tin */}
              <path d="M 67 23 Q 70 25 73 22" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Nón bảo hiểm Fullface AGV ngầu lòi */}
              <path d="M 61 13 C 61 4, 76 4, 76 13 Z" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
              {/* Kính tráng gương nón bảo hiểm */}
              <path d="M 64 10 Q 72 8 76 11" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              {/* Khăn rằn bay phấp phới trong gió */}
              <path d="M 63 25 L 53 23 L 55 27 L 62 27 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
              {/* Tay nắm chặt ghi-đông xe */}
              <path d="M 68 25 Q 78 25 88 26" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>

        {/* ================= XE 2: ADVENTURE TOURING PHƯỢT THỦ (ĐI SAU BÁM ĐUÔI) ================= */}
        <div className="relative animate-peanut-bounce" style={{ animationDelay: '0.15s' }}>
          <svg
            width="76"
            height="36"
            viewBox="0 0 130 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="filter drop-shadow-xs select-none"
          >
            {/* Khói pô xe 2 */}
            <g className="animate-pulse">
              <circle cx="6" cy="46" r="3.5" fill="#cbd5e1" opacity="0.6" />
              <circle cx="13" cy="48" r="4.5" fill="#94a3b8" opacity="0.5" />
            </g>

            {/* BÁNH XE SAU ADVENTURE */}
            <g className="animate-spin" style={{ transformOrigin: '28px 46px', animationDuration: '0.35s' }}>
              <circle cx="28" cy="46" r="12" fill="#1e293b" />
              <circle cx="28" cy="46" r="8" fill="#e2e8f0" stroke="#0ea5e9" strokeWidth="1.5" />
              <circle cx="28" cy="46" r="4" fill="#0f172a" />
              <line x1="28" y1="34" x2="28" y2="58" stroke="#0ea5e9" strokeWidth="2" />
              <line x1="16" y1="46" x2="40" y2="46" stroke="#0ea5e9" strokeWidth="2" />
            </g>

            {/* BÁNH XE TRƯỚC ADVENTURE */}
            <g className="animate-spin" style={{ transformOrigin: '98px 46px', animationDuration: '0.35s' }}>
              <circle cx="98" cy="46" r="12" fill="#1e293b" />
              <circle cx="98" cy="46" r="8" fill="#e2e8f0" stroke="#0ea5e9" strokeWidth="1.5" />
              <circle cx="98" cy="46" r="4" fill="#0f172a" />
              <line x1="98" y1="34" x2="98" y2="58" stroke="#0ea5e9" strokeWidth="2" />
              <line x1="86" y1="46" x2="110" y2="46" stroke="#0ea5e9" strokeWidth="2" />
            </g>

            {/* THÙNG NHÔM PHƯỢT GIVI SAU ĐUÔI XE */}
            <rect x="14" y="27" width="14" height="12" rx="2" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
            <line x1="14" y1="33" x2="28" y2="33" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="21" cy="30" r="1.5" fill="#f59e0b" />

            {/* KHUNG THÂN XE ADVENTURE (Màu xanh dương touring cao ráo) */}
            <path
              d="M 28 46 L 42 40 L 60 35 L 78 30 L 92 37 L 98 46 L 86 44 L 64 45 L 44 47 Z"
              fill="#0284c7"
              stroke="#0369a1"
              strokeWidth="2"
            />
            {/* Kính chắn gió cao kiểu xe BMW GS Adventure */}
            <path d="M 82 28 L 88 16 L 84 28 Z" fill="#bae6fd" opacity="0.8" stroke="#38bdf8" strokeWidth="1" />

            {/* YÊN XE DÀI */}
            <path d="M 38 33 Q 54 30 72 33" stroke="#0f172a" strokeWidth="4.5" strokeLinecap="round" />

            {/* TAY LÁI CAO RÁO & BẢO VỆ TAY LÁI */}
            <line x1="82" y1="30" x2="84" y2="21" stroke="#334155" strokeWidth="3" strokeLinecap="round" />
            <circle cx="86" cy="19" r="2.5" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />

            {/* ĐÈN PHA TRỢ SÁNG SIÊU SÁNG */}
            <polygon points="94,32 102,30 102,37 94,35" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
            <polygon points="102,30 126,22 126,44 102,37" fill="#fef08a" opacity="0.3" />

            {/* ---------------- BÉ LẠC PHƯỢT THỦ NGỒI SAU GIƠ TAY CHECK-IN ---------------- */}
            <g transform="rotate(-6 48 20)">
              {/* Thân bé Lạc ngồi sau */}
              <path
                d="M 44 13 C 40 14, 39 19, 42 23 C 40 25, 40 29, 43 32 C 47 35, 52 34, 54 30 C 55 27, 54 23, 52 21 C 55 18, 55 13, 51 11 C 47 9, 46 10, 44 13 Z"
                fill="#fde047"
                stroke="#d97706"
                strokeWidth="1.8"
              />
              {/* Khuôn mặt tươi cười */}
              <circle cx="43" cy="19" r="1.6" fill="#f43f5e" opacity="0.7" />
              <circle cx="51" cy="18" r="1.6" fill="#f43f5e" opacity="0.7" />
              <path d="M 44 17 Q 46 15 47 17" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              <path d="M 49 16 Q 51 14 52 16" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              <path d="M 47 20 Q 48 23 50 20" stroke="#78350f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
              {/* Nón bảo hiểm phượt thủ xanh lá */}
              <path d="M 42 13 C 42 5, 53 5, 53 13 Z" fill="#10b981" stroke="#047857" strokeWidth="1.4" />
              {/* TAY GIƠ CHỮ V ✌️ CHECK-IN VUI VẺ */}
              <path d="M 38 12 L 32 4" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
              <text x="24" y="5" fontSize="8" fill="#d97706" fontWeight="bold">✌️</text>
              {/* Tay còn lại bám vai bạn lái */}
              <path d="M 48 24 Q 56 25 64 26" stroke="#d97706" strokeWidth="3" strokeLinecap="round" fill="none" />
            </g>

            {/* ---------------- BÉ LẠC TÀI XẾ XE 2 (ĐỘI NÓN BẢO HIỂM VÀNG) ---------------- */}
            <g transform="rotate(6 66 19)">
              <path
                d="M 64 12 C 59 13, 58 19, 61 24 C 59 26, 59 31, 63 35 C 68 38, 74 37, 76 33 C 77 29, 76 25, 73 23 C 77 20, 77 14, 72 12 C 68 10, 66 11, 64 12 Z"
                fill="#fcd34d"
                stroke="#d97706"
                strokeWidth="2"
              />
              <circle cx="63" cy="21" r="1.8" fill="#f43f5e" opacity="0.7" />
              <circle cx="73" cy="20" r="1.8" fill="#f43f5e" opacity="0.7" />
              <path d="M 64 18 Q 66 16 68 18" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 70 17 Q 72 15 74 17" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M 67 23 Q 69 26 72 23" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              {/* Nón bảo hiểm 3/4 màu vàng tươi */}
              <path d="M 62 13 C 62 4, 75 4, 75 13 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              {/* Kính phi công trên trán nón */}
              <rect x="65" y="7" width="9" height="3" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
              {/* Tay lái xe */}
              <path d="M 68 25 Q 76 24 84 23" stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
