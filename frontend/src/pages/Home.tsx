import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provinceAPI } from '../services/api';
import { Province } from '../types';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaMagic,
  FaCrosshairs,
  FaExchangeAlt,
  FaMotorcycle,
  FaCar,
  FaBus,
  FaPlane,
  FaUsers,
  FaCoins,
  FaUtensils,
  FaUmbrellaBeach,
  FaCamera,
  FaSlidersH,
  FaChevronDown,
  FaChevronUp,
  FaSpinner,
  FaCompass
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<Province[]>([]);
  
  // Destination & Departure State
  const [destination, setDestination] = useState<string>('Tây Ninh');
  const [startLocation, setStartLocation] = useState<string>('TP. Hồ Chí Minh');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Date management: Departure & Return dates
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getUpcomingWeekend = () => {
    const today = new Date();
    const day = today.getDay();
    const diffToSat = (6 - day + 7) % 7 || 7;
    const sat = new Date(today);
    sat.setDate(today.getDate() + diffToSat);
    const sun = new Date(sat);
    sun.setDate(sat.getDate() + 1);
    return { start: formatDate(sat), end: formatDate(sun) };
  };

  const initialDates = getUpcomingWeekend();
  const [startDate, setStartDate] = useState<string>(initialDates.start);
  const [endDate, setEndDate] = useState<string>(initialDates.end);
  const [numDays, setNumDays] = useState<number>(2);
  const [numNights, setNumNights] = useState<number>(1);

  // Travel Preferences & Customization
  const [showPreferences, setShowPreferences] = useState<boolean>(false);
  const [travelStyle, setTravelStyle] = useState<string>('adventure');
  const [groupType, setGroupType] = useState<string>('couple');
  const [budgetLevel, setBudgetLevel] = useState<string>('standard');
  const [preferredVehicle, setPreferredVehicle] = useState<string>('motorcycle');
  const [customPrompt, setCustomPrompt] = useState<string>('');

  const quickStartCities = [
    'TP. Hồ Chí Minh',
    'Hà Nội',
    'Đà Nẵng',
    'Cần Thơ',
    'Bình Dương',
    'Hải Phòng'
  ];

  const quickDestinations = [
    { name: 'Tây Ninh', tag: '⛰️ Nóc nhà Nam Bộ' },
    { name: 'Vũng Tàu', tag: '🏖️ Biển & Hải sản' },
    { name: 'Đà Lạt', tag: '🌲 Thành phố sương mù' },
    { name: 'Phú Quốc', tag: '🏝️ Đảo Ngọc' },
    { name: 'Bến Tre', tag: '🚣 Miệt vườn sông nước' },
    { name: 'Cần Thơ', tag: '⛵ Chợ nổi Cái Răng' },
    { name: 'Hà Giang', tag: '🏍️ Đèo Mã Pí Lèng' },
  ];

  useEffect(() => {
    provinceAPI.getAll().then((data) => {
      setProvinces(data);
    }).catch(console.error);
  }, []);

  // Recalculate days and nights when dates change
  useEffect(() => {
    if (!startDate || !endDate) return;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const validDays = Math.max(1, diffDays);
    setNumDays(validDays);
    setNumNights(Math.max(0, validDays - 1));
  }, [startDate, endDate]);

  // Set quick date preset
  const applyDatePreset = (preset: 'weekend' | '3d2n' | '4d3n') => {
    const today = new Date();
    if (preset === 'weekend') {
      const dates = getUpcomingWeekend();
      setStartDate(dates.start);
      setEndDate(dates.end);
    } else if (preset === '3d2n') {
      const s = new Date(today);
      s.setDate(today.getDate() + 3);
      const e = new Date(s);
      e.setDate(s.getDate() + 2);
      setStartDate(formatDate(s));
      setEndDate(formatDate(e));
    } else if (preset === '4d3n') {
      const s = new Date(today);
      s.setDate(today.getDate() + 5);
      const e = new Date(s);
      e.setDate(s.getDate() + 3);
      setStartDate(formatDate(s));
      setEndDate(formatDate(e));
    }
  };

  // GPS Geolocation with Reverse Geocoding
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS');
      return;
    }
    setIsLocating(true);
    toast('Đang dò tìm vị trí GPS của bạn...', { icon: '📍' });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address;
            const detectedCity = addr?.city || addr?.state || addr?.county || addr?.province;
            if (detectedCity) {
              setStartLocation(detectedCity);
              toast.success(`Đã xác định vị trí hiện tại: ${detectedCity}!`);
              setIsLocating(false);
              return;
            }
          }
        } catch {
          // fallback
        }

        // Heuristic fallback
        if (latitude >= 10.0 && latitude <= 11.5 && longitude >= 106.0 && longitude <= 107.5) {
          setStartLocation('TP. Hồ Chí Minh');
        } else if (latitude >= 20.5 && latitude <= 21.5) {
          setStartLocation('Hà Nội');
        } else if (latitude >= 15.5 && latitude <= 16.5) {
          setStartLocation('Đà Nẵng');
        } else {
          setStartLocation('TP. Hồ Chí Minh');
        }
        toast.success('Đã cập nhật vị trí xuất phát!');
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        setStartLocation('TP. Hồ Chí Minh');
        toast.error('Không thể truy cập GPS, đặt vị trí mặc định TP. Hồ Chí Minh');
      },
      { timeout: 7000 }
    );
  };

  // Swap start & destination
  const handleSwap = () => {
    const temp = destination;
    setDestination(startLocation);
    setStartLocation(temp);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destination.trim();
    if (!dest) {
      toast.error('Vui lòng nhập điểm đến bạn muốn đi!');
      return;
    }

    // Build composed prompt
    const styleMap: Record<string, string> = {
      relax: 'Phong cách nghỉ dưỡng, thư thái, cảnh đẹp yên bình',
      adventure: 'Phong cách phượt, khám phá thiên nhiên và các cung đường đẹp',
      foodie: 'Tour ẩm thực chuyên sâu, thưởng thức nhiều món đặc sản nổi tiếng',
      photo: 'Check-in sống ảo, nhiều góc chụp ảnh đẹp',
      family: 'Du lịch gia đình, an toàn, thoải mái và nhiều trải nghiệm gắn kết'
    };

    const groupMap: Record<string, string> = {
      solo: 'Đi 1 mình (Solo backpacker)',
      couple: 'Cặp đôi (Lãng mạn, chill)',
      friends: 'Nhóm bạn thân 3-5 người năng động',
      family: 'Gia đình có trẻ nhỏ/người lớn tuổi'
    };

    const budgetMap: Record<string, string> = {
      budget: 'Ngân sách tiết kiệm tối ưu chi phí (< 1.5tr/người)',
      standard: 'Ngân sách tiêu chuẩn vừa phải (1.5tr - 3tr/người)',
      luxury: 'Ngân sách thoải mái, trải nghiệm dịch vụ cao cấp (> 3tr/người)'
    };

    const vehicleMap: Record<string, string> = {
      motorcycle: 'Đi bằng xe máy',
      car: 'Đi bằng ô tô riêng/tự lái',
      bus: 'Đi bằng xe khách/Limousine',
      plane: 'Đi bằng máy bay'
    };

    const fullPrompt = [
      styleMap[travelStyle] || '',
      groupMap[groupType] || '',
      budgetMap[budgetLevel] || '',
      vehicleMap[preferredVehicle] || '',
      customPrompt.trim()
    ].filter(Boolean).join('. ');

    const params = new URLSearchParams({
      destination: dest,
      start: startLocation,
      startDate: startDate,
      endDate: endDate,
      days: String(numDays),
      nights: String(numNights),
      prompt: fullPrompt
    });

    navigate(`/plan?${params.toString()}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-[#faf9f5] to-[#faf9f5] pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 pastel-yellow-badge text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-2xs">
            <span>✨ Trợ lý AI Du Lịch Thông Minh</span>
            <span className="opacity-40">•</span>
            <span>Khám phá mọi miền Việt Nam</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Lên kế hoạch du lịch <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 bg-clip-text text-transparent">
              Chuẩn Xác Từng Điểm Đến
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
            Nhận diện vị trí hiện tại, chọn ngày đi ngày về cụ thể, tuỳ chọn phong cách & ngân sách. AI sẽ tự động phân tích và tạo lịch trình Google Maps tối ưu 100% dữ liệu thật.
          </p>

          {/* Traveloka / Booking Styled Horizontal Floating Search Bar */}
          <div className="mt-8 max-w-5xl mx-auto space-y-3">
            <form
              onSubmit={handleGenerate}
              className="bg-white/95 backdrop-blur-md rounded-3xl lg:rounded-full p-2.5 sm:p-2 border border-amber-200/90 shadow-2xl flex flex-col lg:flex-row items-stretch lg:items-center gap-2"
            >
              {/* Segment 1: Điểm đi (Xuất phát) */}
              <div className="flex-1 px-4 py-2 hover:bg-amber-50/50 rounded-2xl lg:rounded-full transition text-left relative">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <FaCrosshairs className="text-blue-500" /> Điểm đi
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full transition"
                    title="Tự động nhận diện GPS vị trí thực"
                  >
                    {isLocating ? <FaSpinner className="animate-spin text-xs" /> : <span>📍 GPS vị trí</span>}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="TP. Hồ Chí Minh..."
                  className="w-full bg-transparent border-none text-slate-900 font-black text-sm focus:outline-none placeholder:text-slate-400 p-0 mt-0.5"
                />
              </div>

              {/* Swap Button (⇄) */}
              <button
                type="button"
                onClick={handleSwap}
                className="self-center w-7 h-7 rounded-full bg-slate-100 hover:bg-amber-100 text-slate-500 hover:text-amber-900 border border-slate-200 flex items-center justify-center cursor-pointer transition shrink-0"
                title="Đổi chiều xuất phát và điểm đến"
              >
                <FaExchangeAlt className="text-[10px] lg:rotate-0 rotate-90" />
              </button>

              <div className="hidden lg:block w-px h-8 bg-slate-200" />

              {/* Segment 2: Điểm đến */}
              <div className="flex-1 px-4 py-2 hover:bg-amber-50/50 rounded-2xl lg:rounded-full transition text-left relative">
                <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <FaMapMarkerAlt className="text-red-500" /> Điểm đến
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Tây Ninh, Đà Lạt...)"
                  className="w-full bg-transparent border-none text-slate-900 font-black text-sm focus:outline-none placeholder:text-slate-400 p-0 mt-0.5"
                />
              </div>

              <div className="hidden lg:block w-px h-8 bg-slate-200" />

              {/* Segment 3: Ngày đi & Ngày về Cụ thể */}
              <div className="px-4 py-2 hover:bg-amber-50/50 rounded-2xl lg:rounded-full transition text-left min-w-[240px]">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <FaCalendarAlt className="text-emerald-500" /> Thời gian
                  </label>
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.2 rounded-full">
                    {numDays}N{numNights}Đ
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="date"
                    required
                    value={startDate}
                    min={formatDate(new Date())}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    className="bg-transparent border-none text-slate-800 font-bold text-xs focus:outline-none cursor-pointer w-28 p-0"
                    title="Ngày khởi hành"
                  />
                  <span className="text-slate-400 text-xs">➔</span>
                  <input
                    type="date"
                    required
                    value={endDate}
                    min={startDate || formatDate(new Date())}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent border-none text-slate-800 font-bold text-xs focus:outline-none cursor-pointer w-28 p-0"
                    title="Ngày trở về"
                  />
                </div>
              </div>

              {/* Action Submit Button */}
              <button
                type="submit"
                className="pastel-yellow-btn px-6 sm:px-8 py-3.5 rounded-2xl lg:rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 hover:scale-105 transition-transform"
                title="Khám phá và lập tour tự động"
              >
                <FaMagic className="text-amber-950 text-base" />
                <span>Lên lịch trình</span>
              </button>
            </form>

            {/* Sub-bar: Gợi ý nhanh + Nút mở rộng tùy chọn phong cách */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-2 text-xs">
              {/* Quick destination chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Khám phá nhanh:</span>
                {quickDestinations.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setDestination(item.name)}
                    className={`text-[11px] px-3 py-1 rounded-full font-bold transition-all cursor-pointer shadow-2xs ${
                      destination.toLowerCase() === item.name.toLowerCase()
                        ? 'pastel-yellow-badge scale-105 border-amber-300'
                        : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/90'
                    }`}
                  >
                    {item.tag || item.name}
                  </button>
                ))}
              </div>

              {/* Nút Toggle tùy chọn chi tiết */}
              <button
                type="button"
                onClick={() => setShowPreferences(!showPreferences)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-amber-50 text-slate-700 font-bold rounded-full border border-slate-200/90 shadow-2xs cursor-pointer transition text-[11px]"
              >
                <FaSlidersH className="text-amber-600 text-[10px]" />
                <span>{showPreferences ? 'Thu gọn tùy chọn' : 'Tùy chọn nâng cao (Phong cách, ngân sách)'}</span>
                {showPreferences ? <FaChevronUp className="text-[10px] text-slate-400" /> : <FaChevronDown className="text-[10px] text-slate-400" />}
              </button>
            </div>

            {/* Quick Presets row */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">Lịch gợi ý:</span>
              <button
                type="button"
                onClick={() => applyDatePreset('weekend')}
                className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-amber-100 border border-slate-200/80 text-slate-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
              >
                🌴 Cuối tuần này (T7 - CN)
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('3d2n')}
                className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-amber-100 border border-slate-200/80 text-slate-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
              >
                🚀 3 Ngày 2 Đêm tuần sau
              </button>
              <button
                type="button"
                onClick={() => applyDatePreset('4d3n')}
                className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-amber-100 border border-slate-200/80 text-slate-700 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
              >
                🏖️ Kỳ nghỉ 4 Ngày 3 Đêm
              </button>
            </div>

            {/* Collapsible Advanced Preferences Panel */}
            {showPreferences && (
              <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xl space-y-4 animate-fade-in text-left text-xs max-w-4xl mx-auto">
                {/* Phong cách du lịch */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">🏖️ Phong cách chuyến đi:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { id: 'adventure', label: 'Phượt khám phá', icon: '🏍️' },
                      { id: 'relax', label: 'Nghỉ dưỡng & Chill', icon: '🏖️' },
                      { id: 'foodie', label: 'Ăn sập đặc sản', icon: '🍜' },
                      { id: 'photo', label: 'Sống ảo check-in', icon: '📸' },
                      { id: 'family', label: 'Gia đình gắn kết', icon: '👨‍👩‍👧‍👦' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTravelStyle(s.id)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          travelStyle === s.id
                            ? 'bg-amber-100 border-amber-400 text-amber-950 font-black shadow-2xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span className="block text-base mb-0.5">{s.icon}</span>
                        <span className="text-[11px] block">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nhóm & Thành viên */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <FaUsers className="text-amber-600" /> Thành viên:
                    </label>
                    <select
                      value={groupType}
                      onChange={(e) => setGroupType(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="solo">🧍 Đi 1 mình (Solo)</option>
                      <option value="couple">👫 Cặp đôi (2 người)</option>
                      <option value="friends">👥 Nhóm bạn (3 - 5 người)</option>
                      <option value="family">👨‍👩‍👧‍👦 Gia đình đông người</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <FaCoins className="text-amber-600" /> Mức ngân sách:
                    </label>
                    <select
                      value={budgetLevel}
                      onChange={(e) => setBudgetLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="budget">💰 Tiết kiệm (&lt; 1.5tr/người)</option>
                      <option value="standard">💳 Tiêu chuẩn (1.5 - 3tr/người)</option>
                      <option value="luxury">⭐ Thoải mái (&gt; 3tr/người)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 flex items-center gap-1">
                      <FaMotorcycle className="text-amber-600" /> Phương tiện ưu tiên:
                    </label>
                    <select
                      value={preferredVehicle}
                      onChange={(e) => setPreferredVehicle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="motorcycle">🏍️ Xe máy (Phượt)</option>
                      <option value="car">🚗 Ô tô riêng / Thuê xe</option>
                      <option value="bus">🚌 Xe khách / Limousine</option>
                      <option value="plane">✈️ Máy bay</option>
                    </select>
                  </div>
                </div>

                {/* Yêu cầu riêng cho AI */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">💡 Ghi chú hoặc sở thích riêng cho AI:</label>
                  <input
                    type="text"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ví dụ: Thích ngắm hoàng hôn, ăn nhiều đồ nướng, muốn ghé chùa chiền..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Provinces */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Điểm đến hàng đầu Việt Nam</h2>
          <p className="text-slate-500 text-sm">Các thành phố du lịch được tích hợp đầy đủ dữ liệu địa điểm xác thực</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {provinces.map((prov) => (
            <div
              key={prov.id}
              onClick={() => navigate(`/explore/${prov.id}`)}
              className="group relative h-80 rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200"
            >
              <img
                src={prov.image_url || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800'}
                alt={prov.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="text-xs bg-emerald-500/90 text-white font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Khám phá ngay
                </span>
                <h3 className="text-2xl font-black">{prov.name}</h3>
                <p className="text-slate-200 text-xs sm:text-sm line-clamp-2">{prov.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Core Values */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="text-emerald-400 text-3xl font-black">01</div>
            <h4 className="font-bold text-lg text-white">Lịch trình thật</h4>
            <p className="text-emerald-200/80 text-sm">Không tự sinh dữ liệu ảo. Toàn bộ địa chỉ, giá cả, thời gian mở cửa đều được xác thực từ thực tế.</p>
          </div>
          <div className="space-y-2">
            <div className="text-emerald-400 text-3xl font-black">02</div>
            <h4 className="font-bold text-lg text-white">Trải nghiệm thật</h4>
            <p className="text-emerald-200/80 text-sm">Lộ trình được tính toán logic theo khung giờ vàng: ngắm bình minh, ăn trưa đặc sản, cafe hoàng hôn.</p>
          </div>
          <div className="space-y-2">
            <div className="text-emerald-400 text-3xl font-black">03</div>
            <h4 className="font-bold text-lg text-white">Đáng tiền thật</h4>
            <p className="text-emerald-200/80 text-sm">Tự động cộng chi phí dự kiến để bạn chủ động ngân sách và kiểm soát chi tiêu chuyến đi.</p>
          </div>
        </div>
      </section>
    </div>
  );
};
