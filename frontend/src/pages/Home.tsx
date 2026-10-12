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

          {/* Modern Floating Pill Search Bar (Airbnb / Traveloka Style) */}
          <div className="mt-8 max-w-4xl mx-auto">
            <form 
              onSubmit={handleGenerate} 
              className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-3xl sm:rounded-full shadow-xl border-2 border-amber-200/90 hover:border-amber-300 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3"
            >
              {/* Segment 1: Điểm đến */}
              <div className="flex-1 px-4 py-2 hover:bg-amber-50/50 rounded-2xl sm:rounded-full transition text-left relative">
                <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <FaMapMarkerAlt className="text-amber-500" /> Điểm đến
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Tây Ninh, Đà Lạt...)"
                  className="w-full bg-transparent border-none text-slate-800 font-black text-sm focus:outline-none placeholder:text-slate-400 p-0 mt-0.5"
                />
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200" />

              {/* Segment 2: Điểm xuất phát */}
              <div className="flex-1 px-4 py-2 hover:bg-amber-50/50 rounded-2xl sm:rounded-full transition text-left relative">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                    <FaCrosshairs className="text-blue-500" /> Điểm đi
                  </label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    className="text-[10px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    📍 GPS
                  </button>
                </div>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => setStartLocation(e.target.value)}
                  placeholder="TP. Hồ Chí Minh..."
                  className="w-full bg-transparent border-none text-slate-800 font-bold text-sm focus:outline-none placeholder:text-slate-400 p-0 mt-0.5 truncate"
                />
              </div>

              <div className="hidden sm:block w-px h-8 bg-slate-200" />

              {/* Segment 3: Thời gian */}
              <div className="w-full sm:w-36 px-4 py-2 hover:bg-amber-50/50 rounded-2xl sm:rounded-full transition text-left">
                <label className="block text-[11px] font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1">
                  <FaCalendarAlt className="text-emerald-500" /> Thời gian
                </label>
                <select
                  value={numDays}
                  onChange={(e) => {
                    const d = Number(e.target.value);
                    setNumDays(d);
                    setNumNights(Math.max(0, d - 1));
                  }}
                  className="w-full bg-transparent border-none text-slate-800 font-bold text-sm focus:outline-none p-0 mt-0.5 cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 7].map((d) => (
                    <option key={d} value={d}>{d} ngày {Math.max(0, d - 1)} đêm</option>
                  ))}
                </select>
              </div>

              {/* Action Button: AI Generate */}
              <button
                type="submit"
                className="pastel-yellow-btn px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl sm:rounded-full font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0 hover:scale-105"
                title="Khám phá và lập tour tự động"
              >
                <FaMagic className="text-amber-900 text-base" />
                <span>Lên lịch trình</span>
              </button>
            </form>

            {/* Quick chips pills underneath */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Khám phá nhanh:</span>
              {quickDestinations.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setDestination(item.name)}
                  className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer shadow-2xs ${
                    destination.toLowerCase() === item.name.toLowerCase()
                      ? 'pastel-yellow-badge scale-105 border-amber-300'
                      : 'bg-white hover:bg-amber-50/80 text-slate-600 border border-slate-200/90'
                  }`}
                >
                  {item.tag || item.name}
                </button>
              ))}
            </div>
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
