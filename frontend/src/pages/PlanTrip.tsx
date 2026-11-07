import React, { useState, useEffect, useMemo } from 'react';
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
  FaChevronLeft,
  FaChevronRight,
  FaUtensils,
  FaCoffee,
  FaHotel,
  FaCamera,
  FaPrint,
  FaListUl,
  FaMapMarkedAlt,
  FaMagic,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const PlanTrip: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const savedTripId = searchParams.get('itineraryId');
  const destination = searchParams.get('destination') || '';
  const provinceId = searchParams.get('provinceId') ? Number(searchParams.get('provinceId')) : undefined;
  const numDays = Number(searchParams.get('days')) || 2;
  const numNights = searchParams.get('nights') !== null ? Number(searchParams.get('nights')) : Math.max(0, numDays - 1);
  const prompt = searchParams.get('prompt') || '';
  const startDateStr = searchParams.get('startDate') || '';
  const endDateStr = searchParams.get('endDate') || '';

  const hasTripTarget = Boolean(savedTripId || destination.trim() || provinceId);

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
  const [loading, setLoading] = useState<boolean>(hasTripTarget);
  const [saving, setSaving] = useState<boolean>(false);
  const [showCostModal, setShowCostModal] = useState<boolean>(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeLocationId, setActiveLocationId] = useState<number | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [transitMode, setTransitMode] = useState<'motorcycle' | 'car' | 'walking'>('motorcycle');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'map' | 'timeline' | 'budget'>('timeline');

  const [editDest, setEditDest] = useState<string>(destination || 'Đà Lạt');
  const [editDays, setEditDays] = useState<number>(numDays || 2);
  const [editPrompt, setEditPrompt] = useState<string>(prompt || '');

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
              actual_cost: 0,
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
      actual_cost: 0,
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
      } catch {
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
    if (!hasTripTarget) {
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setActiveLocationId(null);

    if (savedTripId) {
      itineraryAPI
        .getById(Number(savedTripId))
        .then((itinData) => {
          if (isCancelled) return;
          setItinerary(itinData);
          setEditDest(itinData.province?.name || '');
          setEditDays(itinData.num_days || 2);
          const pId = itinData.province?.id || 1;
          return axios
            .get(`/api/ai/weather?province_id=${pId}`)
            .then((r) => !isCancelled && setWeather(r.data))
            .catch(() => null);
        })
        .catch((err) => {
          console.error(err);
          if (!isCancelled) toast.error('Không thể tải lịch trình đã lưu');
        })
        .finally(() => {
          if (!isCancelled) setLoading(false);
        });
    } else {
      itineraryAPI
        .generate({
          destination: destination || undefined,
          province_id: provinceId,
          num_days: numDays,
          num_nights: numNights,
          prompt: prompt,
        })
        .then((itinData) => {
          if (isCancelled) return;
          setItinerary(itinData);
          setEditDest(itinData.province?.name || destination || '');
          setEditDays(itinData.num_days || numDays);
          const pId = itinData.province?.id || 1;
          return axios
            .get(`/api/ai/weather?province_id=${pId}`)
            .then((r) => !isCancelled && setWeather(r.data))
            .catch(() => null);
        })
        .catch((err) => {
          console.error(err);
          if (!isCancelled) toast.error('Có lỗi xảy ra khi tạo lịch trình AI');
        })
        .finally(() => {
          if (!isCancelled) setLoading(false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [hasTripTarget, savedTripId, destination, provinceId, numDays, numNights, prompt]);

  useEffect(() => {
    if (!itinerary) return;
    if (itinerary.id) {
      expenseAPI
        .getByItineraryId(itinerary.id)
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

  // Dùng useMemo cho danh sách items truyền vào RouteMap để KHÔNG tạo mảng mới khi click chọn vị trí
  const filteredMapItems = useMemo(() => {
    if (!itinerary) return [];
    const rawItems =
      selectedDay === 0
        ? itinerary.days.flatMap((d) => d.items)
        : itinerary.days.find((d) => d.day_number === selectedDay)?.items || itinerary.days[0]?.items || [];

    return rawItems.filter((it) => {
      if (!selectedCategoryFilter) return true;
      const cat = it.location?.category || 'tourist_spot';
      if (selectedCategoryFilter === 'tourist_spot') {
        return cat === 'tourist_spot' || cat === 'beach' || cat === 'shopping';
      }
      return cat === selectedCategoryFilter;
    });
  }, [itinerary, selectedDay, selectedCategoryFilter]);

  // Lưu lịch trình vào mục "Chuyến đi của tôi" khi đã đăng nhập
  const handleSaveTrip = async () => {
    if (!user) {
      toast('Vui lòng đăng nhập để lưu lịch trình vào Chuyến đi của tôi', { icon: '🔒' });
      navigate('/login');
      return;
    }
    if (!itinerary) return;

    setSaving(true);
    try {
      const savedItin = await itineraryAPI.save(itinerary);
      if (savedItin?.id && expenses.length > 0) {
        const unsavedExpenses = expenses.filter((e) => !e.id);
        await Promise.all(
          unsavedExpenses.map((e) =>
            expenseAPI
              .create({
                itinerary_id: savedItin.id!,
                title: e.title,
                category: e.category,
                planned_cost: e.planned_cost || 0,
                actual_cost: e.actual_cost || 0,
              })
              .catch(() => null)
          )
        );
      }
      toast.success('Đã lưu lịch trình vào Chuyến đi của tôi!');
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
    toast.success('Đã sao chép liên kết chia sẻ lịch trình!');
  };

  // Màn hình chọn Điểm đến khi người dùng bấm trực tiếp vào menu "Lập lịch trình" (/plan)
  if (!hasTripTarget && !loading) {
    const popularDestinations = [
      { name: 'Đà Lạt', desc: 'Săn mây, thông reo & cà phê đồi', icon: '🌲' },
      { name: 'Vũng Tàu', desc: 'Biển xanh, hải sản & đường ven biển', icon: '🏖️' },
      { name: 'Tây Ninh', desc: 'Núi Bà Đen, Tòa Thánh & bò tơ', icon: '⛰️' },
      { name: 'Phú Quốc', desc: 'Đảo Ngọc, lặn ngắm san hô & hoàng hôn', icon: '🏝️' },
      { name: 'Pleiku', desc: 'Biển Hồ Tơ Nưng, hàng thông trăm tuổi', icon: '☕' },
      { name: 'Nha Trang', desc: 'Vịnh biển đẹp, đảo Hòn Mun & hải sản', icon: '🐬' },
      { name: 'Cần Thơ', desc: 'Chợ nổi Cái Răng, bến Ninh Kiều', icon: '⛵' },
      { name: 'Hà Giang', desc: 'Đèo Mã Pí Lèng, sông Nho Quế', icon: '🏍️' },
    ];

    return (
      <div className="h-[calc(100vh-64px)] overflow-y-auto bg-gradient-to-b from-amber-50/60 via-[#faf9f5] to-white py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border-2 border-amber-200/90 shadow-xl p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 pastel-yellow-badge px-3.5 py-1 rounded-full text-xs font-black">
              ✨ Thiết kế lộ trình du lịch AI
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Bạn muốn lên lịch trình khám phá tỉnh thành nào?
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              AI sẽ thiết kế lộ trình chi tiết từ Khách sạn lưu trú trung tâm (Vị trí số 1) tới các danh thắng, quán ăn đặc sản và cà phê đẹp chuẩn tọa độ Google Maps.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editDest.trim()) {
                toast.error('Vui lòng chọn hoặc nhập điểm đến!');
                return;
              }
              const params = new URLSearchParams();
              params.set('destination', editDest.trim());
              params.set('days', String(editDays));
              params.set('nights', String(Math.max(0, editDays - 1)));
              if (editPrompt.trim()) params.set('prompt', editPrompt.trim());
              navigate(`/plan?${params.toString()}`);
            }}
            className="space-y-5"
          >
            {/* Điểm đến */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 space-y-3">
              <label className="text-xs font-black text-amber-950 uppercase flex items-center gap-1.5">
                <FaMapMarkerAlt className="text-red-600 text-sm" />
                <span>Điểm đến du lịch (Tỉnh / Thành phố)</span>
              </label>

              <input
                type="text"
                required
                value={editDest}
                onChange={(e) => setEditDest(e.target.value)}
                placeholder="Nhập tên tỉnh/thành phố bạn muốn đến (Đà Lạt, Tây Ninh, Vũng Tàu, Phú Quốc...)"
                className="w-full bg-white border border-amber-300 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none shadow-2xs"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {popularDestinations.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => setEditDest(d.name)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      editDest.toLowerCase() === d.name.toLowerCase()
                        ? 'bg-amber-300 border-amber-500 text-amber-950 shadow-xs ring-2 ring-amber-300'
                        : 'bg-white hover:bg-amber-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="font-black text-xs flex items-center gap-1.5">
                      <span>{d.icon}</span>
                      <span>{d.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{d.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Thời lượng & Yêu cầu AI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">📅 Số ngày đi:</label>
                <select
                  value={editDays}
                  onChange={(e) => setEditDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value={1}>1 Ngày (Đi về trong ngày)</option>
                  <option value={2}>2 Ngày 1 Đêm (Cuối tuần)</option>
                  <option value={3}>3 Ngày 2 Đêm (Khám phá sâu)</option>
                  <option value={4}>4 Ngày 3 Đêm (Nghỉ dưỡng dài)</option>
                </select>
              </div>

              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-slate-700 block">💡 Sở thích & Yêu cầu cho Gemini AI:</label>
                <input
                  type="text"
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="VD: Thích ăn đặc sản địa phương, quán cà phê săn mây, nghỉ khách sạn trung tâm..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full pastel-yellow-btn py-3.5 rounded-2xl font-black text-sm sm:text-base shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.01] transition"
            >
              <FaMagic />
              <span>Tạo Lịch Trình AI & Mở Bản Đồ Lộ Trình</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <FaSpinner className="text-4xl text-emerald-500 animate-spin" />
        <h2 className="text-lg font-bold text-slate-700">
          Gemini AI đang phân tích và thiết kế lịch trình {destination ? `tại ${destination}` : ''}...
        </h2>
        <p className="text-sm text-slate-400">
          Đang xác thực tọa độ Google Maps thực tế cho khách sạn, điểm tham quan và ẩm thực đặc sản
        </p>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-700">Không tìm thấy dữ liệu lịch trình</h2>
        <button
          onClick={() => navigate('/plan')}
          className="pastel-yellow-btn px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer"
        >
          Thiết lập lại lịch trình
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col lg:flex-row overflow-hidden relative bg-slate-100">
      {/* Google Maps Styled Left Panel */}
      <div
        className={`w-full lg:w-[395px] xl:w-[420px] 2xl:w-[440px] h-full overflow-y-auto bg-white border-r border-slate-200 shadow-xl z-20 transition-all duration-300 relative shrink-0 scrollbar-thin ${
          isSidebarCollapsed ? 'lg:-ml-[395px] xl:-ml-[420px] 2xl:-ml-[440px]' : ''
        } ${mobileTab === 'map' ? 'hidden lg:block' : 'block'}`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="hidden lg:flex absolute top-16 -right-4 z-30 bg-white hover:bg-amber-100 text-slate-700 hover:text-amber-950 border border-slate-200 shadow-md rounded-r-xl w-4 h-14 items-center justify-center cursor-pointer transition text-xs"
          title={isSidebarCollapsed ? 'Mở thanh lộ trình' : 'Thu gọn thanh lộ trình'}
        >
          {isSidebarCollapsed ? <FaChevronRight className="text-[10px]" /> : <FaChevronLeft className="text-[10px]" />}
        </button>

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

          {/* Destination & Days Selector Card */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('itineraryId');
              nextParams.delete('provinceId');
              if (editDest.trim()) nextParams.set('destination', editDest.trim());
              nextParams.set('days', String(editDays));
              nextParams.set('nights', String(Math.max(0, editDays - 1)));
              navigate(`/plan?${nextParams.toString()}`);
            }}
            className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 space-y-2"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500/15 text-red-600 flex items-center justify-center shrink-0">
                <FaMapMarkerAlt className="text-red-600 text-xs" />
              </div>
              <div className="flex-1 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 shadow-2xs focus-within:border-red-500 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] text-red-600 font-bold block uppercase leading-none mb-0.5">
                    Điểm đến du lịch
                  </span>
                  <input
                    type="text"
                    value={editDest}
                    onChange={(e) => setEditDest(e.target.value)}
                    placeholder="Nhập tỉnh/thành phố đến..."
                    className="w-full font-bold text-slate-900 bg-transparent focus:outline-none text-xs"
                  />
                </div>
                <select
                  value={editDays}
                  onChange={(e) => setEditDays(Number(e.target.value))}
                  className="bg-amber-50 border border-amber-200 text-amber-950 font-black text-[10px] rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer shrink-0"
                  title="Số ngày"
                >
                  <option value={1}>1N</option>
                  <option value={2}>2N1Đ</option>
                  <option value={3}>3N2Đ</option>
                  <option value={4}>4N3Đ</option>
                </select>
              </div>
              <button
                type="submit"
                className="px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs cursor-pointer transition shrink-0"
              >
                Cập nhật
              </button>
            </div>
          </form>

          {/* Weather & Budget Quick Strip */}
          <div className="flex items-center justify-between gap-2 text-xs">
            {weather ? (
              <div className="flex items-center gap-1.5 bg-amber-50/90 border border-amber-200/80 px-2 py-1 rounded-xl">
                <span className="text-sm">{weather.icon || '☀️'}</span>
                <div>
                  <span className="font-black text-slate-800 text-xs mr-1">{weather.temp}</span>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded uppercase">
                    Live
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-[10px] text-slate-400">☀️ Đang tải thời tiết...</span>
            )}

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

          {/* Quick Action Toolbar (In / Chia sẻ / Lưu vào Chuyến đi của tôi) */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
              title="In hoặc xuất PDF"
            >
              <FaPrint className="text-[10px]" /> In / PDF
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-[11px] transition flex items-center justify-center gap-1 cursor-pointer"
            >
              <FaShareAlt className="text-[10px]" /> Chia sẻ
            </button>
            <button
              type="button"
              onClick={handleSaveTrip}
              disabled={saving}
              className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white font-black text-[11px] transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 shadow-xs"
              title="Lưu lịch trình này vào mục Chuyến đi của tôi"
            >
              <FaBookmark className="text-amber-400 text-[10px]" />{' '}
              {saving ? 'Đang lưu...' : 'Lưu lịch trình'}
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

          {/* Days Switcher Tabs */}
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
                  <span>
                    Ngày {day.day_number}
                    {dayDateLabel ? ` (${dayDateLabel})` : ''}
                  </span>
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

          {/* Turn-by-Turn Itinerary Timeline Header */}
          <div className="flex items-center justify-between pt-1 px-0.5 border-t border-slate-100">
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
            categoryFilter={selectedCategoryFilter}
            transitMode={transitMode}
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

      {/* Google Maps Styled Right Panel */}
      <div
        className={`flex-1 h-full w-full relative z-10 bg-slate-200 overflow-hidden ${
          mobileTab === 'timeline' ? 'hidden lg:block' : 'block'
        }`}
      >
        <RouteMap
          items={filteredMapItems}
          dayNumber={selectedDay || 1}
          activeLocationId={activeLocationId}
          onSelectLocation={(locId) => setActiveLocationId(locId)}
          className="w-full h-full rounded-none border-0 shadow-none"
        />

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

      {/* Mobile Responsive Navigation Bar */}
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
          <span>Lộ trình</span>
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

      {/* Sổ Chi Tiêu Modal */}
      {showCostModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] flex flex-col relative z-[10000]">
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

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 border border-slate-200/90 p-3.5 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Dự toán dự kiến</span>
                <span className="text-sm sm:text-base font-black text-slate-800">
                  {totalPlanned.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-center shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">Đã chi thực tế</span>
                <span className="text-sm sm:text-base font-black text-amber-950">
                  {totalActual.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div
                className={`p-3.5 rounded-2xl text-center border shadow-2xs ${
                  costDiff >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
                }`}
              >
                <span
                  className={`text-[10px] uppercase font-bold block mb-1 ${
                    costDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {costDiff >= 0 ? 'Còn dư ngân sách' : 'Bội chi cảnh báo'}
                </span>
                <span
                  className={`text-sm sm:text-base font-black ${
                    costDiff >= 0 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {Math.abs(costDiff).toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {totalPlanned > 0 && (
              <div className="bg-slate-50 border border-slate-200/80 p-3 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Tiến độ giải ngân kinh phí:</span>
                  <span className={totalActual > totalPlanned ? 'text-rose-600 font-black' : 'text-amber-800 font-black'}>
                    {Math.round((totalActual / totalPlanned) * 100)}% ({totalActual.toLocaleString('vi-VN')} /{' '}
                    {totalPlanned.toLocaleString('vi-VN')} đ)
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      totalActual > totalPlanned
                        ? 'bg-rose-500'
                        : totalActual / totalPlanned > 0.8
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.round((totalActual / totalPlanned) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            <form
              onSubmit={handleAddExpense}
              className="bg-amber-50/50 border border-amber-200/80 p-3.5 rounded-2xl space-y-2 shadow-2xs"
            >
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <FaPlus className="text-amber-700 text-xs" /> Thêm khoản chi mới vào sổ:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Tên khoản chi (ví dụ: Ăn trưa, Vé cổng, Mua quà...)"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="sm:col-span-6 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                />
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="sm:col-span-3 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
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
                  className="sm:col-span-2 px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="submit"
                  className="sm:col-span-1 pastel-yellow-btn font-black text-xs py-2 rounded-xl transition cursor-pointer flex items-center justify-center shadow-xs hover:scale-105"
                  title="Thêm khoản chi"
                >
                  <FaPlus />
                </button>
              </div>
            </form>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {expenses.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Chưa có khoản chi nào trong sổ. Hãy thêm mục mới bên trên!
                </div>
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
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block leading-tight">Dự kiến</span>
                          <span className="font-semibold text-slate-600">
                            {item.planned_cost.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

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
                              <span>
                                {item.actual_cost ? `${item.actual_cost.toLocaleString('vi-VN')} đ` : 'Chưa nhập'}
                              </span>
                              <FaEdit className="text-[10px] text-slate-400" />
                            </div>
                          )}
                        </div>

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
