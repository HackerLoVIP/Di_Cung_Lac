import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { itineraryAPI, expenseAPI } from '../services/api';
import { Itinerary } from '../types';
import { ItineraryTimeline } from '../components/ItineraryTimeline';
import { RouteMap } from '../components/RouteMap';
import { useAuth } from '../contexts/AuthContext';
import {
  FaBookmark,
  FaShareAlt,
  FaMoneyBillWave,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSpinner,
  FaPlus,
  FaTrash,
  FaCheck,
  FaEdit,
  FaMotorcycle,
  FaCar,
  FaWalking,
  FaExchangeAlt,
  FaChevronLeft,
  FaChevronRight,
  FaGasPump,
  FaUtensils,
  FaCoffee,
  FaHotel,
  FaCamera,
  FaDirections,
  FaPrint,
  FaRoad,
  FaListUl,
  FaMapMarkedAlt
} from 'react-icons/fa';
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
  const startDateStr = searchParams.get('startDate') || '';
  const endDateStr = searchParams.get('endDate') || '';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [transitMode, setTransitMode] = useState<'motorcycle' | 'car' | 'walking'>('motorcycle');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'timeline' | 'budget'>('timeline');
  const [isSwappedOrigin, setIsSwappedOrigin] = useState<boolean>(false);

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
    <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row overflow-hidden relative bg-slate-100">
      {/* Google Maps Styled Left Panel (Navigation Search & Turn-by-Turn Timeline - Unified Single Scroll) */}
      <div
        className={`w-full lg:w-[390px] xl:w-[415px] 2xl:w-[435px] h-full overflow-y-auto bg-white border-r border-slate-200 shadow-xl z-20 transition-all duration-300 relative shrink-0 scrollbar-thin ${
          isSidebarCollapsed ? 'lg:-ml-[390px] xl:-ml-[415px] 2xl:-ml-[435px]' : ''
        } ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}
      >
        {/* Sidebar Toggle Chevron Pill for Desktop (Google Maps style) */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-16 -right-4 z-30 bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 shadow-md rounded-r-xl w-4 h-14 items-center justify-center cursor-pointer transition text-xs"
          title={isSidebarCollapsed ? 'Mở thanh lộ trình' : 'Thu gọn thanh lộ trình'}
        >
          {isSidebarCollapsed ? <FaChevronRight className="text-[10px]" /> : <FaChevronLeft className="text-[10px]" />}
        </button>

        {/* Unified Content Stream: Direction, Controls & Timeline */}
        <div className="p-3.5 sm:p-4 space-y-3">
          {/* Mode Selector (Xe máy / Ô tô / Đi bộ) */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setTransitMode('motorcycle')}
                className={`px-2.5 py-1 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                  transitMode === 'motorcycle'
                    ? 'bg-amber-300 text-amber-950 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Phượt bằng xe máy"
              >
                <FaMotorcycle /> <span>Xe máy</span>
              </button>
              <button
                type="button"
                onClick={() => setTransitMode('car')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  transitMode === 'car'
                    ? 'bg-amber-300 text-amber-950 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ô tô du lịch"
              >
                <FaCar /> <span>Ô tô</span>
              </button>
              <button
                type="button"
                onClick={() => setTransitMode('walking')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  transitMode === 'walking'
                    ? 'bg-amber-300 text-amber-950 shadow-xs font-black'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Đi bộ dạo phố"
              >
                <FaWalking /> <span>Đi bộ</span>
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
              <FaCalendarAlt className="text-amber-500 text-xs shrink-0" />
              <span>
                {startDateStr && endDateStr
                  ? `${new Date(startDateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - ${new Date(endDateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} • `
                  : ''}
                {itinerary.num_days}N{itinerary.num_nights}Đ
              </span>
            </div>
          </div>

          {/* Direction Inputs Card (Origin & Destination with connecting line) */}
          <div className="relative bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5">
            {/* Connecting Vertical Dotted Line */}
            <div className="absolute left-[21px] top-[22px] bottom-[22px] w-0.5 border-l-2 border-dashed border-slate-300 pointer-events-none" />

            {/* Origin Row */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-600 flex items-center justify-center shrink-0 z-10">
                <span className="w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              </div>
              <div className="flex-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 truncate shadow-2xs">
                <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Xuất phát</span>
                <span className="font-bold text-slate-900 truncate block">{isSwappedOrigin ? itinerary.province.name : (startLocation || 'TP. Hồ Chí Minh')}</span>
              </div>
            </div>

            {/* Destination Row */}
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center shrink-0 z-10">
                <FaMapMarkerAlt className="text-red-600 text-xs" />
              </div>
              <div className="flex-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 truncate shadow-2xs">
                <span className="text-[9px] text-slate-400 font-bold block uppercase leading-none mb-0.5">Điểm đến</span>
                <span className="font-bold text-slate-900 truncate block">{isSwappedOrigin ? (startLocation || 'TP. Hồ Chí Minh') : itinerary.province.name}</span>
              </div>
            </div>

            {/* Swap Button on the right */}
            <button
              type="button"
              onClick={() => setIsSwappedOrigin(!isSwappedOrigin)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white hover:bg-amber-50 text-slate-500 hover:text-amber-800 border border-slate-200 shadow-xs flex items-center justify-center cursor-pointer transition"
              title="Đổi chiều xuất phát và điểm đến"
            >
              <FaExchangeAlt className="rotate-90 text-[10px]" />
            </button>
          </div>

          {/* Google Maps Discovery Quick Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter(null)}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition ${
                selectedCategoryFilter === null
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'restaurant' ? null : 'restaurant')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition ${
                selectedCategoryFilter === 'restaurant'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/60'
              }`}
            >
              <FaUtensils className="text-amber-600 text-[10px]" /> Quán ăn
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'cafe' ? null : 'cafe')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition ${
                selectedCategoryFilter === 'cafe'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : 'bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-200/60'
              }`}
            >
              <FaCoffee className="text-orange-600 text-[10px]" /> Cà phê
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'tourist_spot' ? null : 'tourist_spot')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition ${
                selectedCategoryFilter === 'tourist_spot'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200/60'
              }`}
            >
              <FaCamera className="text-blue-600 text-[10px]" /> Check-in
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategoryFilter(selectedCategoryFilter === 'hotel' ? null : 'hotel')}
              className={`px-2 py-1 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition ${
                selectedCategoryFilter === 'hotel'
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200/60'
              }`}
            >
              <FaHotel className="text-purple-600 text-[10px]" /> Khách sạn
            </button>
          </div>

          {/* Days Switcher Tabs (Alternative Routes style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {itinerary.days.map((day) => {
              let dayDateLabel = '';
              if (startDateStr) {
                try {
                  const d = new Date(startDateStr);
                  d.setDate(d.getDate() + (day.day_number - 1));
                  dayDateLabel = `${d.getDate()}/${d.getMonth() + 1}`;
                } catch {
                  dayDateLabel = '';
                }
              }

              return (
                <button
                  key={day.day_number}
                  type="button"
                  onClick={() => {
                    setSelectedDay(day.day_number);
                    setActiveLocationId(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    selectedDay === day.day_number
                      ? 'bg-amber-400 text-amber-950 font-black shadow-xs scale-102 ring-2 ring-amber-300'
                      : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200/80'
                  }`}
                >
                  <span>Ngày {day.day_number}{dayDateLabel ? ` (${dayDateLabel})` : ''}</span>
                  <span className="text-[10px] opacity-75">({day.items.length})</span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setSelectedDay(0);
                setActiveLocationId(null);
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                selectedDay === 0
                  ? 'bg-amber-400 text-amber-950 font-black shadow-xs scale-102 ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-amber-50 text-slate-700 border border-slate-200/80'
              }`}
            >
              ✨ Toàn chuyến
            </button>
          </div>

          {/* Weather & Budget Quick Strip */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {weather ? (
              <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded-xl">
                <span className="text-sm">{weather.icon || '☀️'}</span>
                <div>
                  <span className="font-black text-slate-800 text-xs mr-1">{weather.temp}</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded uppercase">Live</span>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">☀️ Đang tải thời tiết...</span>
            )}

            {/* Budget & Sổ chi tiêu button */}
            <button
              type="button"
              onClick={() => setShowCostModal(true)}
              className="pastel-yellow-badge hover:bg-amber-300 text-amber-950 font-black px-2.5 py-1 rounded-xl text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
              title="Mở Sổ Tay Chi Tiêu & Dự Toán"
            >
              <FaMoneyBillWave className="text-amber-700 text-xs" />
              <span>{itinerary.total_cost.toLocaleString('vi-VN')} đ</span>
            </button>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
              title="In hoặc xuất PDF"
            >
              <FaPrint className="text-[10px]" /> In / PDF
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[10px] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <FaShareAlt className="text-[10px]" /> Chia sẻ
            </button>
            <button
              type="button"
              onClick={handleSaveTrip}
              disabled={saving}
              className="flex-1 py-1 rounded-lg bg-slate-900 hover:bg-black text-white font-black text-[10px] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <FaBookmark className="text-amber-400 text-[10px]" /> {saving ? 'Đang lưu...' : 'Lưu lại'}
            </button>
          </div>

          {/* Turn-by-Turn Itinerary Timeline Header */}
          <div className="flex items-center justify-between pt-2 px-0.5 border-t border-slate-100">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              {selectedDay === 0 ? 'Toàn bộ lộ trình' : `Chi tiết Ngày ${selectedDay}`}
            </span>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              {selectedDay === 0
                ? `${itinerary.days.reduce((acc, d) => acc + d.items.length, 0)} điểm dừng`
                : `${itinerary.days.find((d) => d.day_number === selectedDay)?.items.length || 0} điểm dừng`}
            </span>
          </div>

          {/* Stops Timeline */}
          <ItineraryTimeline
            days={itinerary.days}
            selectedDayNumber={selectedDay}
            activeLocationId={activeLocationId}
            onSelectLocation={(locId) => setActiveLocationId(locId)}
            compact={true}
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
      </div>

      {/* Google Maps Styled Right Panel (Interactive Master Canvas Studio) */}
      <div
        className={`flex-1 h-full w-full relative z-10 bg-slate-200 overflow-hidden ${
          mobileTab === 'timeline' ? 'hidden lg:block' : 'block'
        }`}
      >
        <RouteMap
          items={
            selectedDay === 0
              ? itinerary.days.flatMap((d) => d.items)
              : itinerary.days.find((d) => d.day_number === selectedDay)?.items || itinerary.days[0]?.items || []
          }
          dayNumber={selectedDay || 1}
          activeLocationId={activeLocationId}
          onSelectLocation={(locId) => setActiveLocationId(locId)}
          className="w-full h-full rounded-none border-0 shadow-none"
        />

        {/* Floating Button to Reopen Sidebar if Collapsed */}
        {isSidebarCollapsed && (
          <button
            onClick={() => setIsSidebarCollapsed(false)}
            className="hidden lg:flex items-center gap-2 absolute top-4 left-4 z-[30] bg-white hover:bg-amber-50 text-slate-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-slate-200 transition cursor-pointer"
          >
            <FaListUl className="text-amber-500" />
            <span>Mở danh sách điểm dừng & Lộ trình</span>
          </button>
        )}
      </div>

      {/* Mobile Responsive Navigation Bar (Fixed at bottom on phones/tablets) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-2 flex items-center justify-around shadow-2xl">
        <button
          type="button"
          onClick={() => setMobileTab('timeline')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold transition ${
            mobileTab === 'timeline'
              ? 'text-amber-900 bg-amber-100 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FaListUl className="text-base" />
          <span>Lộ trình ({selectedDay === 0 ? itinerary.days.reduce((acc, d) => acc + d.items.length, 0) : itinerary.days.find((d) => d.day_number === selectedDay)?.items.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold transition ${
            mobileTab === 'map'
              ? 'text-amber-900 bg-amber-100 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FaMapMarkedAlt className="text-base" />
          <span>Bản đồ</span>
        </button>

        <button
          type="button"
          onClick={() => setShowCostModal(true)}
          className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
        >
          <FaMoneyBillWave className="text-base text-amber-600" />
          <span>Chi tiêu</span>
        </button>
      </div>

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
