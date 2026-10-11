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

  const provinceId = Number(searchParams.get('provinceId')) || 1;
  const numDays = Number(searchParams.get('days')) || 3;
  const numNights = Number(searchParams.get('nights')) || 2;
  const prompt = searchParams.get('prompt') || '';

  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [weather, setWeather] = useState<{ temp: string; condition: string; icon: string; tip: string } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      itineraryAPI.generate(provinceId, numDays, numNights, prompt),
      axios.get(`/api/ai/weather?province_id=${provinceId}`).then((r) => r.data).catch(() => null),
    ])
      .then(([itinData, weatherData]) => {
        setItinerary(itinData);
        setWeather(weatherData);
      })
      .catch((err) => {
        console.error(err);
        toast.error('Có lỗi xảy ra khi tạo lịch trình');
      })
      .finally(() => setLoading(false));
  }, [provinceId, numDays, numNights, prompt]);

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
        <h2 className="text-lg font-bold text-slate-700">AI đang phân tích và sắp xếp lịch trình tối ưu...</h2>
        <p className="text-sm text-slate-400">Đang quét các địa điểm và tính toán chi phí thực tế</p>
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
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <FaMapMarkerAlt className="text-emerald-500" />
            Điểm đến: <span className="font-semibold text-slate-700">{itinerary.province.name}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <FaShareAlt /> Chia sẻ
          </button>
          <button
            onClick={handleSaveTrip}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50"
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
    </div>
  );
};
