import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { itineraryAPI, expenseAPI } from '../services/api';
import { Itinerary } from '../types';
import { ItineraryTimeline } from '../components/ItineraryTimeline';
import { RouteMap } from '../components/RouteMap';
import { useAuth } from '../contexts/AuthContext';
import { FaBookmark, FaShareAlt, FaMoneyBillWave, FaMapMarkerAlt, FaCalendarAlt, FaSpinner, FaCloudSun, FaPlus, FaTrash, FaCheck, FaEdit } from 'react-icons/fa';
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
  const [weather, setWeather] = useState<{
    temp: string;
    feels_like?: string;
    humidity?: string;
    wind_speed?: string;
    precipitation?: string;
    condition: string;
    icon: string;
    tip: string;
    location_name?: string;
    is_live?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'all' | 'map' | 'timeline'>('all');

  // Expense Tracker State
  interface ExpenseItem {
    id?: number;
    tempId?: string;
    title: string;
    category: string;
    planned_cost: number;
    actual_cost: number;
  }

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('food');
  const [newPlanned, setNewPlanned] = useState('');
  const [editingActualId, setEditingActualId] = useState<number | string | null>(null);
  const [tempActualVal, setTempActualVal] = useState('');

  const initDefaultExpenses = (itin: Itinerary) => {
    const list: ExpenseItem[] = [];
    itin.days?.forEach((day) => {
      day.items?.forEach((item) => {
        if (item.location) {
          let cat = 'sightseeing';
          if (item.location.category === 'restaurant') cat = 'food';
          else if (item.location.category === 'cafe') cat = 'cafe';
          else if (item.location.category === 'hotel') cat = 'hotel';

          const cost = item.location.avg_cost_vnd || 0;
          if (cost > 0) {
            list.push({
              tempId: `loc_${item.id}_${item.location.id}`,
              title: `${item.location.name} (Ngày ${day.day_number})`,
              category: cat,
              planned_cost: cost,
              actual_cost: 0
            });
          }
        }
      });
    });

    const numDaysVal = itin.num_days || 1;
    list.push({
      tempId: 'transport_default',
      title: `Xăng xe & di chuyển (${numDaysVal} ngày)`,
      category: 'transport',
      planned_cost: numDaysVal * 100000,
      actual_cost: 0
    });

    setExpenses(list);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Vui lòng nhập tên khoản chi');
      return;
    }
    const planned = Number(newPlanned) || 0;

    if (itinerary?.id) {
      try {
        const created = await expenseAPI.create({
          itinerary_id: itinerary.id,
          title: newTitle.trim(),
          category: newCategory,
          planned_cost: planned,
          actual_cost: 0,
        });
        setExpenses((prev) => [...prev, created]);
        toast.success('Đã thêm khoản chi mới');
      } catch (err) {
        toast.error('Lỗi khi lưu khoản chi');
      }
    } else {
      const newItem: ExpenseItem = {
        tempId: `custom_${Date.now()}`,
        title: newTitle.trim(),
        category: newCategory,
        planned_cost: planned,
        actual_cost: 0,
      };
      setExpenses((prev) => [...prev, newItem]);
      toast.success('Đã thêm khoản chi');
    }

    setNewTitle('');
    setNewPlanned('');
  };

  const handleDeleteExpense = async (item: ExpenseItem) => {
    if (item.id) {
      try {
        await expenseAPI.delete(item.id);
        setExpenses((prev) => prev.filter((x) => x.id !== item.id));
        toast.success('Đã xoá khoản chi');
      } catch {
        toast.error('Không thể xoá khoản chi');
      }
    } else {
      setExpenses((prev) => prev.filter((x) => x.tempId !== item.tempId));
      toast.success('Đã xoá khoản chi');
    }
  };

  const handleSaveActual = async (item: ExpenseItem) => {
    const val = Number(tempActualVal) || 0;
    if (item.id) {
      try {
        const updated = await expenseAPI.update(item.id, { actual_cost: val });
        setExpenses((prev) => prev.map((x) => (x.id === item.id ? updated : x)));
        toast.success('Đã lưu thực chi');
      } catch {
        toast.error('Lỗi cập nhật');
      }
    } else {
      setExpenses((prev) =>
        prev.map((x) => (x.tempId === item.tempId ? { ...x, actual_cost: val } : x))
      );
      toast.success('Đã lưu thực chi');
    }
    setEditingActualId(null);
  };

  const totalPlanned = expenses.reduce((sum, item) => sum + (item.planned_cost || 0), 0);
  const totalActual = expenses.reduce((sum, item) => sum + (item.actual_cost || 0), 0);
  const costDiff = totalPlanned - totalActual;

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'food':
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">🍜 Ẩm thực</span>;
      case 'cafe':
        return <span className="bg-orange-100 text-orange-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">☕ Cà phê</span>;
      case 'sightseeing':
        return <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">🎟️ Vé/Điểm</span>;
      case 'transport':
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">🛵 Đi lại</span>;
      case 'hotel':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">🏨 Khách sạn</span>;
      case 'shopping':
        return <span className="bg-pink-100 text-pink-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">🛍️ Mua sắm</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded-md font-semibold">📦 Khác</span>;
    }
  };


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

  useEffect(() => {
    if (!itinerary) return;
    if (itinerary.id) {
      expenseAPI.getByItineraryId(itinerary.id)
        .then((data) => {
          if (data && data.length > 0) {
            setExpenses(data);
          } else {
            initDefaultExpenses(itinerary);
          }
        })
        .catch(() => initDefaultExpenses(itinerary));
    } else {
      initDefaultExpenses(itinerary);
    }
  }, [itinerary]);


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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Info - Pastel Warm Theme */}
      <div className="pastel-card p-6 sm:p-8 rounded-3xl border border-amber-200/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold pastel-yellow-badge px-3.5 py-1 rounded-full shadow-2xs">
            <FaCalendarAlt className="text-amber-600" />
            <span>{itinerary.num_days} Ngày {itinerary.num_nights} Đêm</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{itinerary.title}</h1>
          <div className="text-xs sm:text-sm text-slate-500 flex flex-wrap items-center gap-x-5 gap-y-1.5">
            <p className="flex items-center gap-1.5 font-medium text-slate-700">
              <FaMapMarkerAlt className="text-amber-500" />
              Điểm đến: <span className="font-bold text-slate-900">{itinerary.province.name}</span>
            </p>
            {startLocation && (
              <p className="flex items-center gap-1.5 text-slate-500">
                <span className="text-amber-500 font-bold">📍</span>
                Xuất phát: <span className="font-medium text-slate-700">{startLocation}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveViewMode('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              ✨ Toàn cảnh
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('map')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'map'
                  ? 'bg-white text-amber-950 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              🗺️ Bản đồ lớn
            </button>
            <button
              type="button"
              onClick={() => setActiveViewMode('timeline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeViewMode === 'timeline'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              📋 Chi tiết
            </button>
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-2xs hover:scale-102"
            title="In hoặc xuất PDF"
          >
            🖨️ Xuất PDF
          </button>
          <button
            onClick={() => setShowCostModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl pastel-yellow-btn font-extrabold text-xs cursor-pointer shadow-xs"
          >
            💰 Sổ chi tiêu ({expenses.length})
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-all cursor-pointer shadow-2xs hover:scale-102"
          >
            <FaShareAlt /> Chia sẻ
          </button>
          <button
            onClick={handleSaveTrip}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 hover:scale-102"
          >
            <FaBookmark className="text-amber-400" /> {saving ? 'Đang lưu...' : 'Lưu chuyến đi'}
          </button>
        </div>
      </div>

      {/* Mini Info Bar (Weather & Estimated Budget - Pastel Accent) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Budget Card */}
        <div className="pastel-card p-4 sm:p-5 rounded-2xl border border-amber-200/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center text-xl shadow-2xs">
              <FaMoneyBillWave />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dự toán ngân sách ước tính</p>
              <div className="text-xl sm:text-2xl font-black text-slate-900">
                {itinerary.total_cost.toLocaleString('vi-VN')} đ <span className="text-xs font-normal text-slate-500">/ người</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowCostModal(true)}
            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 underline decoration-amber-300 underline-offset-4 cursor-pointer"
          >
            Chi tiết ➔
          </button>
        </div>

        {/* Detailed Real-Time Weather Card */}
        {weather ? (
          <div className="pastel-card p-4 sm:p-5 rounded-2xl border border-amber-200/60 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl sm:text-4xl filter drop-shadow-sm">{weather.icon || '☀️'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xl sm:text-2xl">{weather.temp}</span>
                    <span className="text-xs font-bold text-amber-950 bg-amber-200/80 px-2.5 py-0.5 rounded-lg border border-amber-300">
                      {weather.condition}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {weather.location_name ? `Vệ tinh Open-Meteo tại ${weather.location_name}` : 'Dữ liệu khí tượng thời gian thực'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE METEO
                </span>
              </div>
            </div>

            {/* Weather Metrics Bar */}
            <div className="grid grid-cols-4 gap-2 pt-1 border-t border-amber-100/70 text-center">
              <div className="bg-amber-50/60 rounded-xl p-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">Cảm nhận</span>
                <span className="text-xs font-black text-slate-800">{weather.feels_like || weather.temp}</span>
              </div>
              <div className="bg-amber-50/60 rounded-xl p-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">Độ ẩm</span>
                <span className="text-xs font-black text-blue-700">{weather.humidity || '75%'}</span>
              </div>
              <div className="bg-amber-50/60 rounded-xl p-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">Gió</span>
                <span className="text-xs font-black text-teal-700">{weather.wind_speed || '12 km/h'}</span>
              </div>
              <div className="bg-amber-50/60 rounded-xl p-1.5">
                <span className="text-[10px] text-slate-400 block font-medium">Lượng mưa</span>
                <span className="text-xs font-black text-indigo-700">{weather.precipitation || '0 mm'}</span>
              </div>
            </div>

            {/* Travel Advice Tip */}
            <p className="text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded-xl flex items-center gap-2 border border-amber-200/50">
              <span>💡</span>
              <span className="font-medium">{weather.tip}</span>
            </p>
          </div>
        ) : (
          <div className="pastel-card p-4 sm:p-5 rounded-2xl border border-amber-100/60 flex items-center text-xs text-slate-400">
            ☀️ Đang kết nối trạm vệ tinh khí tượng thời gian thực...
          </div>
        )}
      </div>

      {/* Main Map & Navigation Section (Hidden if activeViewMode === 'timeline') */}
      {(activeViewMode === 'all' || activeViewMode === 'map') && (
        <div className="pastel-card p-5 sm:p-6 rounded-3xl border border-amber-200/60 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-100/80 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🗺️ Bản Đồ Lộ Trình Thông Minh</span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/60 px-2.5 py-0.5 rounded-full">Google Maps Studio</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Rà chuột hoặc nhấp vào điểm dừng trên bản đồ để xem chi tiết lộ trình</p>
            </div>

            {/* Day Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {itinerary.days.map((day) => (
                <button
                  key={day.day_number}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day.day_number);
                    setActiveLocationId(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    selectedDay === day.day_number
                      ? 'bg-amber-400 text-amber-950 font-black shadow-xs scale-102'
                      : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/80 hover:border-amber-200'
                  }`}
                >
                  <span>Ngày {day.day_number}</span>
                  <span className="text-[10px] opacity-75">({day.items.length})</span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(0);
                  setActiveLocationId(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedDay === 0
                    ? 'bg-amber-400 text-amber-950 font-black shadow-xs scale-102'
                    : 'bg-white hover:bg-amber-50 text-slate-600 border border-slate-200/80 hover:border-amber-200'
                }`}
              >
                ✨ Toàn chuyến
              </button>
            </div>
          </div>

          {/* Master Google Maps Studio Container */}
          <div className={`rounded-2xl overflow-hidden border border-slate-200/80 shadow-2xs ${activeViewMode === 'map' ? 'min-h-[580px]' : ''}`}>
            <RouteMap
              items={
                selectedDay === 0
                  ? itinerary.days.flatMap((d) => d.items)
                  : itinerary.days.find((d) => d.day_number === selectedDay)?.items || itinerary.days[0]?.items || []
              }
              dayNumber={selectedDay || 1}
              activeLocationId={activeLocationId}
              onSelectLocation={(locId) => setActiveLocationId(locId)}
            />
          </div>
        </div>
      )}

      {/* Timeline Section (Hidden if activeViewMode === 'map') */}
      {(activeViewMode === 'all' || activeViewMode === 'timeline') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black text-slate-900">
                {selectedDay === 0 ? 'Lộ trình chi tiết toàn chuyến' : `Lộ trình Ngày ${selectedDay}`}
              </h3>
              <span className="text-xs font-bold text-amber-950 bg-amber-200/70 border border-amber-300 px-2.5 py-0.5 rounded-full">
                {selectedDay === 0
                  ? `${itinerary.days.reduce((acc, d) => acc + d.items.length, 0)} điểm dừng chân & ẩm thực`
                  : `${itinerary.days.find((d) => d.day_number === selectedDay)?.items.length || 0} điểm dừng chân & ẩm thực`}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">Dữ liệu GPS & Hình ảnh thực tế</span>
          </div>
          <ItineraryTimeline
            days={itinerary.days}
            selectedDayNumber={selectedDay}
            activeLocationId={activeLocationId}
            onSelectLocation={(locId) => setActiveLocationId(locId)}
            onRemoveItem={(dayNum, itemId) => {
              const updatedDays = itinerary.days.map((d) => {
                if (d.day_number === dayNum) {
                  return { ...d, items: d.items.filter((i) => i.id !== itemId) };
                }
                return d;
              });
              setItinerary({ ...itinerary, days: updatedDays });
              toast.success('Đã bỏ điểm dừng khỏi lịch trình');
            }}
          />
        </div>
      )}

      {/* Sổ Chi Tiêu Modal (Interactive Budget Book) */}
      {showCostModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col relative z-[10000]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">
                  💰
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Sổ Tay Chi Tiêu & Dự Toán</h3>
                  <p className="text-xs text-slate-400">Theo dõi, chỉnh sửa và nhập liệu các khoản chi thực tế</p>
                </div>
              </div>
              <button
                onClick={() => setShowCostModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Total Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dự toán dự kiến</span>
                <span className="text-sm sm:text-base font-black text-slate-800">
                  {totalPlanned.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block mb-1">Đã chi thực tế</span>
                <span className="text-sm sm:text-base font-black text-amber-900">
                  {totalActual.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className={`p-3 rounded-2xl text-center border ${costDiff >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                <span className={`text-[10px] uppercase font-bold block mb-1 ${costDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {costDiff >= 0 ? 'Còn dư' : 'Bội chi'}
                </span>
                <span className={`text-sm sm:text-base font-black ${costDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {Math.abs(costDiff).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Quick Add Expense Form */}
            <form onSubmit={handleAddExpense} className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FaPlus className="text-emerald-600 text-[10px]" /> Thêm khoản chi mới:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Tên khoản chi (ví dụ: Ăn trưa, Vé cổng, Mua quà...)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="sm:col-span-6 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="sm:col-span-3 px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                >
                  <option value="food">🍜 Ăn uống</option>
                  <option value="cafe">☕ Cà phê</option>
                  <option value="sightseeing">🎟️ Vé/Điểm</option>
                  <option value="transport">🛵 Đi lại</option>
                  <option value="hotel">🏨 Khách sạn</option>
                  <option value="shopping">🛍️ Mua sắm</option>
                  <option value="other">📦 Khác</option>
                </select>
                <input
                  type="number"
                  placeholder="Dự kiến (đ)"
                  value={newPlanned}
                  onChange={(e) => setNewPlanned(e.target.value)}
                  className="sm:col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="sm:col-span-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-1.5 rounded-xl transition cursor-pointer flex items-center justify-center shadow-sm"
                  title="Thêm khoản chi"
                >
                  <FaPlus />
                </button>
              </div>
            </form>

            {/* Expense Items List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">Chưa có khoản chi nào trong sổ. Hãy thêm mục mới bên trên!</div>
              ) : (
                expenses.map((item) => {
                  const itemId = item.id || item.tempId!;
                  const isEditing = editingActualId === itemId;

                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 transition-all text-xs gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {getCategoryBadge(item.category)}
                        <span className="font-bold text-slate-800 truncate">{item.title}</span>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Planned cost */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block leading-tight">Dự kiến</span>
                          <span className="font-semibold text-slate-600">
                            {item.planned_cost.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* Actual cost (editable inline) */}
                        <div className="text-right min-w-[95px]">
                          <span className="text-[10px] text-amber-700 block leading-tight font-bold">Thực chi</span>
                          {isEditing ? (
                            <div className="flex items-center gap-1 mt-0.5">
                              <input
                                type="number"
                                autoFocus
                                value={tempActualVal}
                                onChange={(e) => setTempActualVal(e.target.value)}
                                className="w-20 px-1.5 py-0.5 text-xs border border-amber-400 rounded-md bg-amber-50 focus:outline-none"
                              />
                              <button
                                onClick={() => handleSaveActual(item)}
                                className="text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
                                title="Lưu"
                              >
                                <FaCheck />
                              </button>
                            </div>
                          ) : (
                            <div
                              onClick={() => {
                                setEditingActualId(itemId);
                                setTempActualVal(item.actual_cost ? item.actual_cost.toString() : '');
                              }}
                              className="font-bold text-slate-900 flex items-center justify-end gap-1 cursor-pointer hover:text-amber-600 transition"
                              title="Nhấp để nhập số tiền thực chi"
                            >
                              <span>{item.actual_cost ? `${item.actual_cost.toLocaleString('vi-VN')} đ` : 'Chưa nhập'}</span>
                              <FaEdit className="text-[10px] text-slate-400" />
                            </div>
                          )}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDeleteExpense(item)}
                          className="text-slate-300 hover:text-rose-500 transition p-1 cursor-pointer"
                          title="Xoá khoản chi này"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-400 italic text-[11px]">
                * Nhấp vào cột "Thực chi" để nhập số tiền chi thực tế sau mỗi hoạt động.
              </span>
              <button
                onClick={() => setShowCostModal(false)}
                className="bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-xl transition cursor-pointer"
              >
                Xong & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
