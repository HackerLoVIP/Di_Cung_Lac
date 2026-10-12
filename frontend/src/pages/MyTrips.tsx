import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { itineraryAPI } from '../services/api';
import { FaTrash, FaSuitcase, FaMapMarkerAlt, FaSpinner, FaHeart, FaExternalLinkAlt } from 'react-icons/fa';
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
        toast.success('Đã xóa chuyến đi');
        fetchTrips();
      } catch {
        toast.error('Không thể xóa chuyến đi');
      }
    }
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
      <div className="py-20 flex justify-center">
        <FaSpinner className="text-3xl text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900">Sổ Tay Du Lịch Cá Nhân</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý các chuyến đi đã lên kế hoạch và địa điểm yêu thích của bạn</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'trips'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaSuitcase /> Chuyến đi của tôi ({trips.length})
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'wishlist'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaHeart /> Địa điểm yêu thích ({wishlist.length})
        </button>
      </div>

      {/* TAB TRIPS */}
      {activeTab === 'trips' && (
        <>
          {trips.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                <FaSuitcase />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Bạn chưa có chuyến đi nào được lưu</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Hãy bắt đầu trải nghiệm bằng cách tạo một lịch trình tự động ngay hôm nay!
              </p>
              <button
                onClick={() => navigate('/')}
                className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                Tạo chuyến đi đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  onClick={() => navigate(`/plan?itineraryId=${trip.id}`)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-emerald-500 transition-all flex flex-col justify-between cursor-pointer group"
                >
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {trip.num_days}N{trip.num_nights}Đ
                      </span>
                      <button
                        onClick={(e) => handleDelete(e, trip.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 transition-colors cursor-pointer"
                        title="Xóa chuyến đi"
                      >
                        <FaTrash />
                      </button>
                    </div>
                    <h3 className="font-extrabold text-slate-900 text-base line-clamp-1 group-hover:text-emerald-600 transition-colors">
                      {trip.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <FaMapMarkerAlt className="text-slate-400" />
                      {trip.province_name}
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                    </span>
                    <span className="font-bold text-emerald-600 flex items-center gap-1">
                      Xem lộ trình & bản đồ <FaExternalLinkAlt className="text-[10px]" />
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
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto text-2xl">
                <FaHeart />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">Chưa có địa điểm yêu thích nào</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Bấm vào biểu tượng trái tim ở trang Khám phá để lưu nhanh các quán ngon, điểm đẹp vào đây nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlist.map((loc) => (
                <div
                  key={loc.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={loc.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'}
                      alt={loc.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={(e) => handleRemoveWishlist(e, loc.id)}
                      className="absolute top-3 right-3 bg-white/90 text-rose-500 hover:text-rose-700 p-2 rounded-full shadow-md transition cursor-pointer"
                      title="Bỏ yêu thích"
                    >
                      <FaHeart />
                    </button>
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="font-bold text-slate-800 text-sm">{loc.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-1">{loc.address}</p>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-amber-500 font-bold">⭐ {loc.rating}</span>
                      <span className="font-semibold text-emerald-600">{loc.avg_cost_vnd?.toLocaleString('vi-VN')}đ</span>
                    </div>
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
