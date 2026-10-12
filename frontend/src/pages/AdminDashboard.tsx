import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChartBar,
  FaMapMarkerAlt,
  FaStar,
  FaUsers,
  FaSuitcase,
  FaTrash,
  FaPlus,
  FaCheckCircle,
  FaShieldAlt,
  FaSpinner,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'locations' | 'reviews'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Form tao dia diem moi
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('tourist_spot');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLat, setNewLocLat] = useState('11.312');
  const [newLocLng, setNewLocLng] = useState('106.102');
  const [newLocCost, setNewLocCost] = useState('50000');
  const [newLocTips, setNewLocTips] = useState('');
  const [newLocProvinceId, setNewLocProvinceId] = useState(1);

  const isAdmin = user && (user.role === 'admin' || user.email === 'haidangdmc123@gmail.com' || user.email === 'tronghieu3443@gmail.com');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, locsRes, revsRes] = await Promise.all([
        axios.get('/api/admin/stats').catch(() => ({ data: null })),
        axios.get('/api/admin/locations').catch(() => ({ data: [] })),
        axios.get('/api/admin/reviews').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setLocations(locsRes.data || []);
      setReviews(revsRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Không thể tải dữ liệu quản trị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) {
      try {
        await axios.delete(`/api/admin/locations/${id}`);
        toast.success('Đã xóa địa điểm thành công');
        fetchData();
      } catch {
        toast.error('Không thể xóa địa điểm này');
      }
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      try {
        await axios.delete(`/api/admin/reviews/${id}`);
        toast.success('Đã xóa đánh giá');
        fetchData();
      } catch {
        toast.error('Không thể xóa đánh giá này');
      }
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/locations', {
        province_id: Number(newLocProvinceId),
        name: newLocName,
        category: newLocCategory,
        address: newLocAddress,
        latitude: parseFloat(newLocLat),
        longitude: parseFloat(newLocLng),
        avg_cost_vnd: parseInt(newLocCost) || 0,
        tips: newLocTips,
      });
      toast.success('Đã thêm địa điểm mới vào CSDL');
      setShowAddModal(false);
      setNewLocName('');
      setNewLocAddress('');
      setNewLocTips('');
      fetchData();
    } catch {
      toast.error('Không thể thêm địa điểm lúc này');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <FaSpinner className="text-4xl text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Đang tải trung tâm Quản trị Admin...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl">
          <FaShieldAlt />
        </div>
        <h2 className="text-2xl font-black text-slate-800">Quyền Quản Trị Viên</h2>
        <p className="text-sm text-slate-500">
          Trang này chỉ dành cho Quản trị viên (Admin) của Đi Cùng Lạc để quản lý dữ liệu địa điểm, kiểm duyệt đánh giá và xem số liệu hệ thống.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="bg-emerald-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition cursor-pointer"
        >
          Đăng nhập tài khoản Admin
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            <FaShieldAlt /> Quyền Quản trị viên cao cấp
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Bảng Quản Trị Đi Cùng Lạc</h1>
          <p className="text-xs sm:text-sm text-slate-500">Quản lý kho địa điểm thực tế, duyệt nội dung và theo dõi số liệu</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <FaPlus /> Thêm địa điểm mới
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaChartBar /> Tổng quan số liệu
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaMapMarkerAlt /> Quản lý Địa điểm ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'reviews'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaStar /> Kiểm duyệt Đánh giá ({reviews.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Người dùng</span>
                <FaUsers className="text-emerald-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.users || 0}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Tài khoản thành viên</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Chuyến đi đã tạo</span>
                <FaSuitcase className="text-blue-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.itineraries || 0}</p>
              <p className="text-[11px] text-blue-600 font-semibold">Lịch trình tự động</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Kho Địa điểm</span>
                <FaMapMarkerAlt className="text-amber-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.locations || 0}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Toạ độ GPS & Menu thật</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Đánh giá</span>
                <FaStar className="text-purple-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.reviews || 0}</p>
              <p className="text-[11px] text-purple-600 font-semibold">Review từ cộng đồng</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">Chuyến đi mới tạo gần đây</h3>
              <div className="space-y-3">
                {stats?.recent_trips?.map((trip: any) => (
                  <div key={trip.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{trip.title}</p>
                      <p className="text-[11px] text-slate-400">User ID: #{trip.user_id}</p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-800 text-base">Đánh giá mới nhất</h3>
              <div className="space-y-3">
                {stats?.recent_reviews?.map((rev: any) => (
                  <div key={rev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>{rev.location_name}</span>
                      <span className="text-amber-500 flex items-center gap-1">⭐ {rev.rating}</span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                    <p className="text-[10px] text-slate-400">Bởi {rev.user_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-base">Danh Sách Địa Điểm Thực Tế</h3>
            <span className="text-xs text-slate-400">Tổng cộng: {locations.length} địa điểm</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <th className="p-4">Tên địa điểm</th>
                  <th className="p-4">Tỉnh/Thành</th>
                  <th className="p-4">Thể loại</th>
                  <th className="p-4">Toạ độ GPS</th>
                  <th className="p-4">Giá TB</th>
                  <th className="p-4">Mẹo du lịch</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">{loc.name}</td>
                    <td className="p-4 text-slate-600">{loc.province_name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                        {loc.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
                    </td>
                    <td className="p-4 font-semibold text-emerald-600">
                      {loc.avg_cost_vnd?.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-4 text-slate-500 max-w-xs truncate" title={loc.tips}>
                      {loc.tips || 'Chưa có'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteLocation(loc.id)}
                        className="text-red-500 hover:text-red-700 p-1.5 transition"
                        title="Xóa địa điểm"
                      >
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-slate-800 text-base">Kiểm Duyệt Đánh Giá Cộng Đồng</h3>
            <span className="text-xs text-slate-400">Tổng cộng: {reviews.length} đánh giá</span>
          </div>

          <div className="divide-y divide-slate-100">
            {reviews.length === 0 ? (
              <p className="p-8 text-center text-xs text-slate-400">Chưa có đánh giá nào</p>
            ) : (
              reviews.map((rev) => (
                <div key={rev.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{rev.location_name}</span>
                      <span className="text-amber-500 font-bold text-xs flex items-center gap-0.5">
                        ⭐ {rev.rating}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{rev.comment}</p>
                    <p className="text-[11px] text-slate-400">
                      Người gửi: <span className="font-medium text-slate-700">{rev.user_name}</span> •{' '}
                      {new Date(rev.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteReview(rev.id)}
                    className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition flex items-center gap-1"
                  >
                    <FaTrash /> Xóa review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL THEM DIA DIEM MOI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Thêm Địa Điểm Thực Tế Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateLocation} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên địa điểm</label>
                <input
                  type="text"
                  required
                  value={newLocName}
                  onChange={(e) => setNewLocName(e.target.value)}
                  placeholder="Vd: Chùa Gò Kén Tây Ninh, Bò Tơ Năm Sánh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thể loại</label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="tourist_spot">Điểm tham quan</option>
                    <option value="restaurant">Quán ăn / Đặc sản</option>
                    <option value="cafe">Quán cà phê</option>
                    <option value="beach">Bãi biển</option>
                    <option value="shopping">Chợ / Mua sắm</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tỉnh / Thành ID</label>
                  <input
                    type="number"
                    value={newLocProvinceId}
                    onChange={(e) => setNewLocProvinceId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ cụ thể</label>
                <input
                  type="text"
                  required
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="Đường, phường, quận/huyện..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vĩ độ (Latitude)</label>
                  <input
                    type="text"
                    required
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kinh độ (Longitude)</label>
                  <input
                    type="text"
                    required
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Giá trung bình (VND)</label>
                <input
                  type="number"
                  value={newLocCost}
                  onChange={(e) => setNewLocCost(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mẹo du lịch thực tế (Tips)</label>
                <textarea
                  rows={2}
                  value={newLocTips}
                  onChange={(e) => setNewLocTips(e.target.value)}
                  placeholder="Mẹo tránh chặt chém, quy định trang phục, bãi đỗ xe..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  Lưu địa điểm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
