import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provinceAPI } from '../services/api';
import { Province } from '../types';
import { FaMapMarkerAlt, FaCalendarAlt, FaMagic, FaCheckCircle, FaStar, FaCrosshairs, FaCompass } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const Home: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [destination, setDestination] = useState<string>('Tây Ninh');
  const [startLocation, setStartLocation] = useState<string>('TP. Hồ Chí Minh');
  const [numDays, setNumDays] = useState<number>(2);
  const [numNights, setNumNights] = useState<number>(1);
  const [prompt, setPrompt] = useState<string>('');
  const navigate = useNavigate();

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

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      toast('Đang xác định vị trí của bạn...', { icon: '📍' });
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setStartLocation(`Vị trí của tôi (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
          toast.success('Đã cập nhật vị trí xuất phát!');
        },
        () => {
          setStartLocation('TP. Hồ Chí Minh');
          toast.error('Không thể truy cập GPS, đặt mặc định TP. Hồ Chí Minh');
        }
      );
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const dest = destination.trim();
    if (!dest) {
      toast.error('Vui lòng nhập điểm đến bạn muốn đi!');
      return;
    }
    navigate(`/plan?destination=${encodeURIComponent(dest)}&start=${encodeURIComponent(startLocation)}&days=${numDays}&nights=${numNights}&prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-[#faf9f5] to-[#faf9f5] pt-14 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 pastel-yellow-badge text-xs sm:text-sm font-bold px-4 py-1.5 rounded-full shadow-2xs">
            <span>✨ Trợ lý AI Du Lịch Thông Minh</span>
            <span className="opacity-40">•</span>
            <span>Khám phá mọi miền Việt Nam</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Lên kế hoạch du lịch <br />
            <span className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-600 bg-clip-text text-transparent">
              Mọi Nẻo Đường Việt Nam
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
            Nhập bất kỳ điểm đến nào (Tây Ninh, Vũng Tàu, Đà Lạt, quê bạn,...), AI tự động đề xuất lộ trình tối ưu Google Maps kèm bóc tách dự toán chi phí thực tế.
          </p>

          {/* Quick Plan Form */}
          <div className="mt-8 pastel-card p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-md max-w-2xl mx-auto text-left">
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Điểm đến tự do */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FaMapMarkerAlt className="text-amber-500 text-sm" /> Điểm đến của bạn (Nhập tự do)
                  </span>
                  <span className="text-[11px] font-normal text-amber-700 lowercase">AI tự tìm địa điểm & đường đi</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Nhập nơi bạn muốn đến (vd: Tây Ninh, Núi Bà Đen, Bến Tre, Đà Lạt, Sapa...)"
                    className="w-full bg-slate-50/70 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 pl-10 transition"
                  />
                  <FaCompass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base" />
                </div>

                {/* Gợi ý điểm đến phổ biến */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Gợi ý nhanh:</span>
                  {quickDestinations.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setDestination(item.name)}
                      className={`text-xs px-2.5 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                        destination.toLowerCase() === item.name.toLowerCase()
                          ? 'pastel-yellow-badge font-bold shadow-2xs scale-105'
                          : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Điểm xuất phát */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FaCrosshairs className="text-blue-500" /> Điểm xuất phát của bạn
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    📍 Lấy vị trí GPS hiện tại
                  </button>
                </label>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="Vd: TP. Hồ Chí Minh, Bình Dương, Nhà tôi..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Số ngày & số đêm */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FaCalendarAlt className="text-emerald-500" /> Số ngày đi
                  </label>
                  <select
                    value={numDays}
                    onChange={(e) => {
                      const d = Number(e.target.value);
                      setNumDays(d);
                      setNumNights(Math.max(0, d - 1));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[1, 2, 3, 4, 5, 7].map((d) => (
                      <option key={d} value={d}>{d} ngày</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Số đêm nghỉ
                  </label>
                  <select
                    value={numNights}
                    onChange={(e) => setNumNights(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {[0, 1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>{n} đêm</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Yêu cầu đặc biệt */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Sở thích / Yêu cầu riêng cho AI (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Vd: Thích ăn bò tơ / hải sản, leo núi, đi chùa tâm linh, ngân sách tiết kiệm..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 pastel-yellow-btn font-black py-4 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <FaMagic className="text-amber-800" />
                AI Tự động lên lịch trình ngay
              </button>
            </form>
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
