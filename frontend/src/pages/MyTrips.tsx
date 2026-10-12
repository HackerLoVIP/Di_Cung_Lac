import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { itineraryAPI } from '../services/api';
import {
  FaTrash,
  FaSuitcase,
  FaMapMarkerAlt,
  FaSpinner,
  FaHeart,
  FaExternalLinkAlt,
  FaShareAlt,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaDirections
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const MyTrips: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trips' | 'wishlist'>('trips');
  const [trips, setTrips] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTrips = () => {
    setLoading(true);
    Promise.all([
      itineraryAPI.getMyTrips().catch(() => []),
      axios.get('/api/wishlist').then(r => r.data).catch(() => []),
    ])
      .then(([tripsData, wishData]) => {
        setTrips(tripsData);
        setWishlist(wishData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) {
      try {
        await itineraryAPI.delete(id);
        toast.success('Đã xóa chuyến đi thành công');
        fetchTrips();
      } catch {
        toast.error('Không thể xóa chuyến đi');
      }
    }
  };

  const handleShareTrip = (e: React.MouseEvent, tripId: number) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/plan?itineraryId=${tripId}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Đã sao chép liên kết chuyến đi để chia sẻ!');
  };

  const handleRemoveWishlist = async (e: React.MouseEvent, locationId: number) => {
    e.stopPropagation();
    try {
      await axios.post(`/api/wishlist/${locationId}`);
      toast.success('Đã bỏ khỏi danh sách yêu thích');
      setWishlist(prev => prev.filter(item => item.id !== locationId));
    } catch {
      toast.error('Có lỗi xảy ra');
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <FaSpinner className="text-3xl text-amber-500 animate-spin" />
        <p className="text-xs font-bold text-slate-400">Đang tải sổ tay du lịch của bạn...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-amber-700 bg-amber-100/80 px-3 py-1 rounded-full mb-1 inline-block">
            📒 Lưu trữ cá nhân
          </span>
          <h1 className="text-3xl font-black text-slate-900">Sổ Tay Du Lịch Của Tôi</h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý các chuyến đi đã lên lịch trình và các điểm đến yêu thích</p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="pastel-yellow-btn px-5 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-sm hover:scale-105 transition cursor-pointer self-start sm:self-auto"
        >
          ✨ Lên lịch trình mới
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 font-black text-xs sm:text-sm rounded-2xl transition cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-amber-300 text-amber-950 shadow-xs ring-2 ring-amber-300/60'
              : 'text-slate-600 hover:bg-amber-50 hover:text-slate-900 font-bold'
          }`}
        >
          <FaSuitcase /> Chuyến đi đã lưu ({trips.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2 font-black text-xs sm:text-sm rounded-2xl transition cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-300/60'
              : 'text-slate-600 hover:bg-rose-50 hover:text-slate-900 font-bold'
          }`}
        >
          <FaHeart /> Điểm yêu thích ({wishlist.length})
        </button>
      </div>

      {/* TAB TRIPS */}
      {activeTab === 'trips' && (
        <>
          {trips.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-amber-100 text-amber-800 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-xs">
                <FaSuitcase />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Bạn chưa có chuyến đi nào được lưu</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tạo một lịch trình du lịch thông minh bằng AI từ trang chủ và bấm "Lưu chuyến đi" để quản lý tại đây nhé!
              </p>
              <button
                onClick={() => navigate('/')}
                className="pastel-yellow-btn font-black text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105"
              >
                Khám phá & Lên lịch ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/plan?itineraryId=${trip.id}`)}
                  className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-amber-300 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer group hover:-translate-y-1"
                >
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 bg-amber-200/80 border border-amber-300/70 px-3 py-1 rounded-full shadow-2xs">
                        {trip.num_days}N{trip.num_nights}Đ
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleShareTrip(e, trip.id)}
                          className="text-slate-400 hover:text-amber-800 p-1.5 rounded-xl hover:bg-amber-100 transition cursor-pointer"
                          title="Sao chép link chia sẻ"
                        >
                          <FaShareAlt className="text-xs" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(e, trip.id)}
                          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa chuyến đi"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-slate-900 text-base line-clamp-1 group-hover:text-amber-900 transition-colors">
                      {trip.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <p className="text-slate-600 font-bold flex items-center gap-1.5 truncate">
                        <FaMapMarkerAlt className="text-red-500 shrink-0 text-xs" />
                        <span>{trip.province_name || 'Việt Nam'}</span>
                      </p>

                      {trip.total_cost > 0 && (
                        <p className="font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60 flex items-center gap-1">
                          <FaMoneyBillWave className="text-amber-600 text-[10px]" />
                          <span>{trip.total_cost.toLocaleString('vi-VN')} đ</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1 text-[11px] font-semibold">
                      <FaCalendarAlt className="text-slate-400 text-[10px]" />
                      {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="font-black text-amber-900 group-hover:underline flex items-center gap-1">
                      Mở lịch trình <FaExternalLinkAlt className="text-[10px]" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB WISHLIST */}
      {activeTab === 'wishlist' && (
        <>
          {wishlist.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto text-2xl shadow-xs">
                <FaHeart />
              </div>
              <h3 className="font-black text-slate-800 text-lg">Chưa có địa điểm yêu thích nào</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bấm vào biểu tượng trái tim ở trang Khám phá để lưu nhanh các quán ngon, điểm đẹp vào đây nhé!
              </p>
              <button
                onClick={() => navigate('/explore/1')}
                className="pastel-yellow-btn font-black text-xs px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105"
              >
                Khám phá địa điểm ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-white rounded-3xl border-2 border-slate-200/90 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  <div className="h-44 overflow-hidden relative">
                    <img
                      src={loc.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
                      alt={loc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                    
                    <button
                      onClick={(e) => handleRemoveWishlist(e, loc.id)}
                      className="absolute top-3 right-3 bg-white/95 text-rose-500 hover:text-rose-700 p-2 rounded-full shadow-md transition cursor-pointer hover:scale-110"
                      title="Bỏ yêu thích"
                    >
                      <FaHeart className="text-xs" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-2">
                    <h3 className="font-black text-slate-800 text-sm truncate">{loc.name}</h3>
                    <p className="text-xs text-slate-500 truncate flex items-center gap-1">
                      <FaMapMarkerAlt className="text-amber-500 shrink-0 text-xs" />
                      <span>{loc.address}</span>
                    </p>
                    
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                      <span className="text-amber-500 font-black">⭐ {loc.rating || 5.0}</span>
                      <span className="font-extrabold text-slate-800">
                        {loc.avg_cost_vnd ? `${loc.avg_cost_vnd.toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                      </span>
                    </div>

                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${loc.latitude},${loc.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full mt-2 py-2 rounded-xl bg-slate-50 hover:bg-amber-100 border border-slate-200 text-slate-700 hover:text-amber-950 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <FaDirections className="text-amber-600 text-xs" />
                      <span>Chỉ đường Google Maps</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
