import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { itineraryAPI } from '../services/api';
import { Itinerary } from '../types';
import { ItineraryTimeline } from '../components/ItineraryTimeline';
import { useAuth } from '../contexts/AuthContext';
import { FaBookmark, FaShareAlt, FaMoneyBillWave, FaMapMarkerAlt, FaCalendarAlt, FaSpinner, FaCloudSun } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const PlanTrip: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const savedTripId = searchParams.get('itineraryId');
  const destination = searchParams.get('destination') || '';
  const startLocation = searchParams.get('start') || '';
  const provinceId = searchParams.get('provinceId') ? Number(searchParams.get('provinceId')) : undefined;
  const numDays = Number(searchParams.get('days')) || 2;
  const numNights = Number(searchParams.get('nights')) || 1;
  const prompt = searchParams.get('prompt') || '';

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<{ temp: string; condition: string; icon: string; tip: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showCostModal, setShowCostModal] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    if (savedTripId) {
      // Tai lich trinh da luu
      itineraryAPI.getById(Number(savedTripId))
        .then((itinData) => {
          setItinerary(itinData);
          const pId = itinData.province?.id || 1;
          return axios.get(`/api/ai/weather?province_id=${pId}`)
            .then((r) => setWeather(r.data))
            .catch(() => null);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Không thể tải lịch trình đã lưu');
        })
        .finally(() => setLoading(false));
    } else {
      itineraryAPI.generate({
        destination: destination || undefined,
        start_location: startLocation || undefined,
        province_id: provinceId,
        num_days: numDays,
        num_nights: numNights,
        prompt: prompt,
      })
        .then((itinData) => {
          setItinerary(itinData);
          const pId = itinData.province?.id || 1;
          return axios.get(`/api/ai/weather?province_id=${pId}`)
            .then((r) => setWeather(r.data))
            .catch(() => null);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Có lỗi xảy ra khi tạo lịch trình AI');
        })
        .finally(() => setLoading(false));
    }
  }, [savedTripId, destination, startLocation, provinceId, numDays, numNights, prompt]);

  const handleSaveTrip = async () => {
    if (!user) {
      toast('Vui lòng đăng nhập để lưu lịch trình vào tài khoản', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (!itinerary) return;

    setSaving(true);
    try {
      await itineraryAPI.save(itinerary);
      toast.success('Đã lưu lịch trình thành công!');
      navigate('/my-trips');
    } catch (e) {
      console.error(e);
      toast.error('Không thể lưu lịch trình lúc này');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã sao chép liên kết chia sẻ!');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="text-4xl text-emerald-500 animate-spin" />
        <h2 className="text-lg font-bold text-slate-700">AI đang phân tích và thiết kế lịch trình {destination ? `tại ${destination}` : ''}...</h2>
        <p className="text-sm text-slate-400">Đang định vị toạ độ thực tế, tính toán quãng đường và ngân sách ẩm thực</p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-700">Không tìm thấy dữ liệu lịch trình</h2>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Info */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            <FaCalendarAlt />
            {itinerary.num_days} Ngày {itinerary.num_nights} Đêm
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{itinerary.title}</h1>
          <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-4 gap-y-1">
            <p className="flex items-center gap-1">
              <FaMapMarkerAlt className="text-emerald-500" />
              Điểm đến: <span className="font-semibold text-slate-700">{itinerary.province.name}</span>
            </p>
            {startLocation && (
              <p className="flex items-center gap-1 text-slate-500">
                <span className="text-blue-500 font-bold">📍</span>
                Xuất phát: <span className="font-medium text-slate-700">{startLocation}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
            title="In hoặc xuất PDF"
          >
            🖨️ In / Xuất PDF
          </button>
          <button
            onClick={() => setShowCostModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs sm:text-sm hover:bg-amber-100 transition-colors cursor-pointer"
          >
            💰 Sổ chi tiêu
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FaShareAlt /> Chia sẻ
          </button>
          <button
            onClick={handleSaveTrip}
            disabled={saving}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
          >
            <FaBookmark /> {saving ? 'Đang lưu...' : 'Lưu chuyến đi'}
          </button>
        </div>
      </div>

      {/* Weather Badge */}
      {weather && (
        <div className="bg-sky-50 border border-sky-200/80 p-4 rounded-2xl flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{weather.icon}</span>
            <div>
              <span className="font-bold text-sky-900 text-sm">{weather.temp} - {weather.condition}</span>
              <p className="text-sky-700">{weather.tip}</p>
            </div>
          </div>
          <span className="hidden sm:inline-block bg-sky-200/60 text-sky-800 font-semibold px-2.5 py-1 rounded-lg text-[11px]">
            Dự báo thông minh
          </span>
        </div>
      )}

      {/* Cost Summary Box */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl">
            <FaMoneyBillWave />
          </div>
          <div>
            <h4 className="text-sm font-medium text-emerald-100">Chi phí dự kiến cho chuyến đi</h4>
            <div className="text-2xl sm:text-3xl font-black tracking-tight">
              {itinerary.total_cost.toLocaleString('vi-VN')} VNĐ <span className="text-xs font-normal text-emerald-200">/ người</span>
            </div>
          </div>
        </div>
        <p className="text-xs text-emerald-100 text-center sm:text-right max-w-xs">
          Bao gồm vé tham quan, ăn uống 3 bữa, cà phê và chi phí di chuyển cơ bản nội thành.
        </p>
      </div>

      {/* Timeline Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800">Lịch trình chi tiết từng ngày</h2>
        <ItineraryTimeline days={itinerary.days} />
      </div>

      {/* Sổ tay chi tiêu Modal */}
      {showCostModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <h3 className="text-lg font-black text-slate-800">Sổ Tay Chi Tiêu Chuyến Đi</h3>
              </div>
              <button
                onClick={() => setShowCostModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase">Tổng dự toán chuyến đi</span>
              <span className="text-xl font-black text-emerald-700">
                {itinerary.total_cost.toLocaleString('vi-VN')} VNĐ
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">Bóc tách ngân sách thực tế:</p>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span>🍜</span>
                  <span className="font-bold text-slate-700">Ẩm thực & Bữa ăn chính</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {itinerary.days.reduce((acc, d) => acc + d.items.filter(i => i.location?.category === 'restaurant').reduce((s, i) => s + (i.location?.avg_cost_vnd || 0), 0), 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span>🎟️</span>
                  <span className="font-bold text-slate-700">Vé tham quan, cáp treo & check-in</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {itinerary.days.reduce((acc, d) => acc + d.items.filter(i => i.location?.category === 'tourist_spot' || i.location?.category === 'beach').reduce((s, i) => s + (i.location?.avg_cost_vnd || 0), 0), 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span>☕</span>
                  <span className="font-bold text-slate-700">Cà phê thư giãn & đồ uống</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {itinerary.days.reduce((acc, d) => acc + d.items.filter(i => i.location?.category === 'cafe').reduce((s, i) => s + (i.location?.avg_cost_vnd || 0), 0), 0).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <span>🛵</span>
                  <span className="font-bold text-slate-700">Xăng xe & di chuyển ({itinerary.num_days} ngày)</span>
                </div>
                <span className="font-extrabold text-slate-900">
                  {((itinerary.num_days || 2) * 100000).toLocaleString('vi-VN')} VNĐ
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              * Giá tiền được tính toán dựa trên bảng giá thực tế niêm yết tại các địa điểm và menu đặc sản của quán.
            </p>

            <button
              onClick={() => setShowCostModal(false)}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
