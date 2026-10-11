import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { itineraryAPI } from '../services/api';
import { FaTrash, FaSuitcase, FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

export const MyTrips: React.FC = () => {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTrips = () => {
    setLoading(true);
    itineraryAPI
      .getMyTrips()
      .then(setTrips)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: number) => {
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
        <h1 className="text-3xl font-black text-slate-900">Chuyến đi của tôi</h1>
        <p className="text-sm text-slate-500 mt-1">Quản lý và xem lại các lịch trình bạn đã lên kế hoạch</p>
      </div>

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
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {trip.num_days}N{trip.num_nights}Đ
                  </span>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="text-slate-400 hover:text-red-500 p-1.5 transition-colors"
                    title="Xóa chuyến đi"
                  >
                    <FaTrash />
                  </button>
                </div>
                <h3 className="font-extrabold text-slate-900 text-base line-clamp-1">{trip.title}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <FaMapMarkerAlt className="text-slate-400" />
                  {trip.province_name}
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                </span>
                <span className="font-bold text-emerald-600">
                  Đã lên lịch
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
