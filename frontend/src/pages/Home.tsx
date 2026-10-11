import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { provinceAPI } from '../services/api';
import { Province } from '../types';
import { FaMapMarkerAlt, FaCalendarAlt, FaMagic, FaCheckCircle, FaStar } from 'react-icons/fa';

export const Home: React.FC = () => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<number>(1);
  const [numDays, setNumDays] = useState<number>(3);
  const [numNights, setNumNights] = useState<number>(2);
  const [prompt, setPrompt] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    provinceAPI.getAll().then((data) => {
      setProvinces(data);
      if (data.length > 0) setSelectedProvince(data[0].id);
    }).catch(console.error);
  }, []);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/plan?provinceId=${selectedProvince}&days=${numDays}&nights=${numNights}&prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-slate-50 pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full shadow-sm">
            <span>✨ Ứng dụng AI thông minh</span>
            <span>•</span>
            <span>Dữ liệu thực tế 100%</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
            Lên kế hoạch du lịch <br />
            <span className="text-emerald-600 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
              Chỉ trong 30 giây
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
            Hệ thống tự động sắp xếp lịch trình chi tiết từ sáng đến tối, tối ưu quãng đường di chuyển và dự toán chi phí minh bạch cho chuyến đi của bạn.
          </p>

          {/* Quick Plan Form */}
          <div className="mt-10 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/50 max-w-2xl mx-auto text-left">
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-emerald-500" /> Điểm đến của bạn
                </label>
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

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
                    {[1, 2, 3, 4, 5].map((d) => (
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
                    {[0, 1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>{n} đêm</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Yêu cầu đặc biệt (tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Vd: Đi cùng gia đình, thích ăn hải sản, ngân sách tiết kiệm..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 text-base cursor-pointer"
              >
                <FaMagic />
                Tự động tạo lịch trình ngay
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
