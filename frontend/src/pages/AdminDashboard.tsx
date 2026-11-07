import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import {
  FaChartBar,
  FaMapMarkerAlt,
  FaStar,
  FaUsers,
  FaSuitcase,
  FaTrash,
  FaPlus,
  FaShieldAlt,
  FaSpinner,
  FaCrown,
  FaSearch,
  FaUserPlus,
  FaUserShield,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'itineraries' | 'locations' | 'reviews'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [itinerariesList, setItinerariesList] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Bộ lọc tab Quản trị Người dùng
  const [userSearch, setUserSearch] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'all' | 'admin' | 'vip' | 'normal'>('all');

  // Bộ lọc tab Quản lý Địa điểm
  const [locSearch, setLocSearch] = useState<string>('');

  // Modal thêm người dùng mới
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newUserRole, setNewUserRole] = useState<'user' | 'admin'>('user');
  const [newUserVipDays, setNewUserVipDays] = useState<number>(0);

  // Modal thêm địa điểm mới
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newLocName, setNewLocName] = useState('');
  const [newLocCategory, setNewLocCategory] = useState('tourist_spot');
  const [newLocAddress, setNewLocAddress] = useState('');
  const [newLocLat, setNewLocLat] = useState('11.9404');
  const [newLocLng, setNewLocLng] = useState('108.4583');
  const [newLocCost, setNewLocCost] = useState('50000');
  const [newLocTips, setNewLocTips] = useState('');
  const [newLocProvinceId, setNewLocProvinceId] = useState(2);

  const isAdmin = Boolean(
    user &&
      (user.role === 'admin' ||
        user.email === 'haidangdmc123@gmail.com' ||
        user.email === 'tronghieu3443@gmail.com' ||
        user.email === 'admin@dicunglac.vn')
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, itinsRes, locsRes, revsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: null })),
        api.get('/admin/users').catch(() => ({ data: [] })),
        api.get('/admin/itineraries').catch(() => ({ data: [] })),
        api.get('/admin/locations').catch(() => ({ data: [] })),
        api.get('/admin/reviews').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data || []);
      setItinerariesList(itinsRes.data || []);
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
    if (authLoading) return;
    if (isAdmin) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user, authLoading, isAdmin]);

  // Thao tác Quản trị Người dùng
  const handleToggleRole = async (u: any) => {
    const nextRole = u.role === 'admin' ? 'user' : 'admin';
    try {
      const res = await api.put(`/admin/users/${u.id}/role`, { role: nextRole });
      toast.success(res.data.message || 'Đã cập nhật quyền người dùng');
      fetchData();
      if (user && u.id === user.id) refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể đổi vai trò người dùng');
    }
  };

  const handleSetVip = async (u: any, isVip: number, days: number = 365) => {
    try {
      const res = await api.put(`/admin/users/${u.id}/vip`, { is_vip: isVip, days });
      toast.success(res.data.message || 'Đã cập nhật trạng thái VIP');
      fetchData();
      if (user && u.id === user.id) refreshUser();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể cập nhật gói VIP');
    }
  };

  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.full_name}" (${u.email})?`)) return;
    try {
      const res = await api.delete(`/admin/users/${u.id}`);
      toast.success(res.data.message || 'Đã xóa người dùng');
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể xóa người dùng này');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/users', {
        email: newUserEmail,
        full_name: newUserName,
        password: newUserPassword,
        role: newUserRole,
        is_vip: newUserVipDays > 0 ? 1 : 0,
        vip_days: newUserVipDays > 0 ? newUserVipDays : 365,
      });
      toast.success('Đã tạo tài khoản người dùng mới thành công!');
      setShowAddUserModal(false);
      setNewUserEmail('');
      setNewUserName('');
      setNewUserPassword('123456');
      setNewUserRole('user');
      setNewUserVipDays(0);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Không thể tạo người dùng mới');
    }
  };

  // Thao tác Quản lý Lịch trình
  const handleDeleteItinerary = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch trình này khỏi hệ thống?')) return;
    try {
      await api.delete(`/admin/itineraries/${id}`);
      toast.success('Đã xóa lịch trình');
      fetchData();
    } catch {
      toast.error('Không thể xóa lịch trình');
    }
  };

  // Thao tác Quản lý Địa điểm & Đánh giá
  const handleDeleteLocation = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) {
      try {
        await api.delete(`/admin/locations/${id}`);
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
        await api.delete(`/admin/reviews/${id}`);
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
      await api.post('/admin/locations', {
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

  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      if (userFilter === 'admin' && u.role !== 'admin') return false;
      if (userFilter === 'vip' && !u.is_vip) return false;
      if (userFilter === 'normal' && (u.is_vip || u.role === 'admin')) return false;
      if (!userSearch.trim()) return true;
      const q = userSearch.toLowerCase().trim();
      return (
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [usersList, userFilter, userSearch]);

  const filteredLocations = useMemo(() => {
    if (!locSearch.trim()) return locations;
    const q = locSearch.toLowerCase().trim();
    return locations.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.province_name?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q)
    );
  }, [locations, locSearch]);

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-3">
        <FaSpinner className="text-4xl text-emerald-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Đang tải Trung tâm Quản trị Admin...</p>
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
          Trang này chỉ dành cho Quản trị viên (Admin) của Đi Cùng Lạc để quản trị người dùng, phân quyền VIP, quản lý địa điểm và kiểm duyệt hệ thống.
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            <FaShieldAlt /> Trung Tâm Quản Trị Hệ Thống (Admin Role)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Quản Trị Website Đi Cùng Lạc</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Quản lý tài khoản người dùng, cấp quyền VIP 1 Năm / 30 Ngày, quản lý lịch trình, kho địa điểm và đánh giá
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <FaUserPlus /> Thêm người dùng
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer"
          >
            <FaPlus /> Thêm địa điểm mới
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaChartBar /> Tổng quan số liệu
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaUsers /> Quản trị Người dùng ({usersList.length})
        </button>
        <button
          onClick={() => setActiveTab('itineraries')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'itineraries'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaSuitcase /> Quản lý Chuyến đi ({itinerariesList.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FaMapMarkerAlt /> Quản lý Địa điểm ({locations.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer ${
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
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div
              onClick={() => setActiveTab('users')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-emerald-400 transition"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Tổng người dùng</span>
                <FaUsers className="text-emerald-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.users || usersList.length}</p>
              <p className="text-[11px] text-emerald-600 font-semibold">Bấm để quản lý tài khoản ➔</p>
            </div>

            <div
              onClick={() => {
                setUserFilter('vip');
                setActiveTab('users');
              }}
              className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between text-amber-700">
                <span className="text-xs font-bold uppercase tracking-wider">Thành viên VIP</span>
                <FaCrown className="text-amber-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-amber-950">
                {stats?.stats?.vip_users ?? usersList.filter((u) => u.is_vip).length}
              </p>
              <p className="text-[11px] text-amber-800 font-semibold">Gói 7N / 1 Tháng / 1 Năm</p>
            </div>

            <div
              onClick={() => setActiveTab('itineraries')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-blue-400 transition"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Chuyến đi đã lưu</span>
                <FaSuitcase className="text-blue-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.itineraries || itinerariesList.length}</p>
              <p className="text-[11px] text-blue-600 font-semibold">Lịch trình người dùng</p>
            </div>

            <div
              onClick={() => setActiveTab('locations')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-amber-400 transition"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Kho Địa điểm</span>
                <FaMapMarkerAlt className="text-amber-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.locations || locations.length}</p>
              <p className="text-[11px] text-amber-600 font-semibold">Toạ độ GPS & Menu thật</p>
            </div>

            <div
              onClick={() => setActiveTab('reviews')}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 cursor-pointer hover:border-purple-400 transition"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-xs font-bold uppercase tracking-wider">Đánh giá</span>
                <FaStar className="text-purple-500 text-lg" />
              </div>
              <p className="text-3xl font-black text-slate-900">{stats?.stats?.reviews || reviews.length}</p>
              <p className="text-[11px] text-purple-600 font-semibold">Review từ cộng đồng</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-base">Người dùng mới nhất</h3>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Xem tất cả ({usersList.length})
                </button>
              </div>
              <div className="space-y-2.5">
                {usersList.slice(0, 5).map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        {u.full_name ? u.full_name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {u.role === 'admin' && (
                            <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.2 rounded font-black">
                              ADMIN
                            </span>
                          )}
                          {u.is_vip ? (
                            <span className="bg-amber-200 text-amber-950 text-[10px] px-1.5 py-0.2 rounded font-black">
                              👑 VIP
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500">{u.trips_count || 0} chuyến đi</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-base">Chuyến đi mới tạo gần đây</h3>
                <button
                  onClick={() => setActiveTab('itineraries')}
                  className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Xem tất cả ({itinerariesList.length})
                </button>
              </div>
              <div className="space-y-2.5">
                {itinerariesList.slice(0, 5).map((trip: any) => (
                  <div
                    key={trip.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{trip.title}</p>
                      <p className="text-[11px] text-slate-400">
                        Bởi: {trip.user_name} ({trip.user_email})
                      </p>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {trip.created_at ? new Date(trip.created_at).toLocaleDateString('vi-VN') : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUẢN TRỊ NGƯỜI DÙNG (USER MANAGEMENT) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-slate-900 text-lg">Quản Trị Người Dùng & Phân Quyền VIP</h3>
              <p className="text-xs text-slate-500">
                Nâng cấp/thu hồi gói VIP (7 Ngày, 1 Tháng, 1 Năm - 365 Ngày), phân quyền Admin hoặc xóa tài khoản vi phạm
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Tìm tên hoặc email..."
                  className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'admin', label: 'Admin' },
                  { key: 'vip', label: '👑 VIP' },
                  { key: 'normal', label: 'Thường' },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setUserFilter(f.key as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition ${
                      userFilter === f.key ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <th className="p-4">ID</th>
                  <th className="p-4">Họ tên & Email</th>
                  <th className="p-4">Vai trò (Role)</th>
                  <th className="p-4">Gói tài khoản & Hạn VIP</th>
                  <th className="p-4">Chuyến đi</th>
                  <th className="p-4">Cấp / Gia hạn VIP nhanh</th>
                  <th className="p-4 text-right">Thao tác quản trị</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-slate-500">#{u.id}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4">
                      {u.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-black text-[11px]">
                          <FaUserShield /> Quản trị viên (Admin)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-semibold text-[11px]">
                          Thành viên (User)
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {u.is_vip ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full font-black text-[11px]">
                            <FaCrown className="text-amber-700" /> VIP Travel Pro
                          </span>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Hạn:{' '}
                            {u.vip_expiry
                              ? new Date(u.vip_expiry).toLocaleDateString('vi-VN')
                              : '1 Năm (365 ngày)'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-medium">Tài khoản Thường (Giới hạn 2N1Đ)</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-slate-700">{u.trips_count || 0} chuyến</td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSetVip(u, 1, 7)}
                          className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-200 text-amber-900 border border-amber-200 font-bold text-[10px] cursor-pointer transition"
                          title="Cấp VIP 7 Ngày"
                        >
                          +VIP 7 Ngày
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetVip(u, 1, 30)}
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-300 text-amber-950 border border-amber-300 font-bold text-[10px] cursor-pointer transition"
                          title="Cấp VIP 1 Tháng (30 Ngày)"
                        >
                          +VIP 1 Tháng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetVip(u, 1, 365)}
                          className="px-2 py-1 rounded-lg bg-amber-300 hover:bg-amber-400 text-amber-950 font-black text-[10px] cursor-pointer transition shadow-2xs"
                          title="Cấp VIP 1 Năm (365 Ngày)"
                        >
                          👑 +VIP 1 Năm
                        </button>
                        {u.is_vip ? (
                          <button
                            type="button"
                            onClick={() => handleSetVip(u, 0, 0)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-700 font-bold text-[10px] cursor-pointer transition"
                            title="Hủy gói VIP về tài khoản thường"
                          >
                            Hủy VIP
                          </button>
                        ) : null}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(u)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px] cursor-pointer transition"
                          title="Đổi vai trò User / Admin"
                        >
                          {u.role === 'admin' ? 'Hạ về User' : 'Cấp Admin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.email === 'admin@dicunglac.vn' || Boolean(user && u.id === user.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 transition cursor-pointer disabled:opacity-30"
                          title="Xóa người dùng"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: QUẢN LÝ CHUYẾN ĐI (ITINERARIES) */}
      {activeTab === 'itineraries' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-black text-slate-800 text-base">Danh Sách Lịch Trình Đã Tạo Trên Hệ Thống</h3>
              <p className="text-xs text-slate-400">Xem chi tiết hoặc xóa các chuyến đi đã lưu của thành viên</p>
            </div>
            <span className="text-xs font-bold text-slate-500">Tổng: {itinerariesList.length} chuyến đi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                  <th className="p-4">ID</th>
                  <th className="p-4">Tên lịch trình</th>
                  <th className="p-4">Điểm đến</th>
                  <th className="p-4">Thời lượng</th>
                  <th className="p-4">Người tạo</th>
                  <th className="p-4">Ngày tạo</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {itinerariesList.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono text-slate-500">#{t.id}</td>
                    <td className="p-4 font-bold text-slate-900">{t.title}</td>
                    <td className="p-4 text-emerald-700 font-semibold">{t.province_name}</td>
                    <td className="p-4">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                        {t.num_days}N{t.num_nights}Đ ({t.stops_count} điểm)
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{t.user_name}</div>
                      <div className="text-[10px] text-slate-400">{t.user_email}</div>
                    </td>
                    <td className="p-4 text-slate-500">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString('vi-VN') : ''}
                    </td>
                    <td className="p-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/plan?itineraryId=${t.id}`)}
                          className="text-blue-600 hover:text-blue-800 p-1.5 transition cursor-pointer"
                          title="Mở xem lịch trình"
                        >
                          <FaExternalLinkAlt />
                        </button>
                        <button
                          onClick={() => handleDeleteItinerary(t.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 transition cursor-pointer"
                          title="Xóa lịch trình"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LOCATIONS */}
      {activeTab === 'locations' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-black text-slate-800 text-base">Danh Sách Địa Điểm Thực Tế ({filteredLocations.length})</h3>
              <p className="text-xs text-slate-400">Toàn bộ tọa độ GPS, giá tham khảo và mẹo du lịch xác thực</p>
            </div>
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={locSearch}
                onChange={(e) => setLocSearch(e.target.value)}
                placeholder="Tìm địa điểm, tỉnh thành..."
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
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
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-slate-800">{loc.name}</td>
                    <td className="p-4 text-slate-600">{loc.province_name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
                        {loc.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
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
                        className="text-red-500 hover:text-red-700 p-1.5 transition cursor-pointer"
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

      {/* TAB 5: REVIEWS */}
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
                    className="text-red-500 hover:text-red-700 text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FaTrash /> Xóa review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL THÊM NGƯỜI DÙNG MỚI */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Tạo Tài Khoản Người Dùng Mới</h3>
              <button onClick={() => setShowAddUserModal(false)} className="text-slate-400 text-lg cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email đăng nhập</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mật khẩu khởi tạo</label>
                <input
                  type="text"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vai trò (Role)</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'user' | 'admin')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="user">Thành viên (User)</option>
                    <option value="admin">Quản trị viên (Admin)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gói VIP ban đầu</label>
                  <select
                    value={newUserVipDays}
                    onChange={(e) => setNewUserVipDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value={0}>Tài khoản Thường</option>
                    <option value={7}>VIP 7 Ngày</option>
                    <option value={30}>VIP 1 Tháng (30 Ngày)</option>
                    <option value={365}>VIP 1 Năm (365 Ngày)</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM ĐỊA ĐIỂM MỚI */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-800">Thêm Địa Điểm Thực Tế Mới</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-lg cursor-pointer">
                ✕
              </button>
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
                  <label className="block font-bold text-slate-700 mb-1">Tỉnh/Thành</label>
                  <select
                    value={newLocProvinceId}
                    onChange={(e) => setNewLocProvinceId(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value={1}>Vũng Tàu</option>
                    <option value={2}>Đà Lạt</option>
                    <option value={3}>Tây Ninh</option>
                    <option value={4}>TP. Hồ Chí Minh</option>
                    <option value={5}>Pleiku</option>
                    <option value={6}>Phú Quốc</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh mục</label>
                  <select
                    value={newLocCategory}
                    onChange={(e) => setNewLocCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    <option value="tourist_spot">Điểm tham quan</option>
                    <option value="restaurant">Nhà hàng / Quán ăn</option>
                    <option value="cafe">Quán Cà phê</option>
                    <option value="beach">Bãi biển</option>
                    <option value="hotel">Khách sạn</option>
                    <option value="shopping">Mua sắm / Chợ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  required
                  value={newLocAddress}
                  onChange={(e) => setNewLocAddress(e.target.value)}
                  placeholder="Số nhà, tên đường, phường/xã, tỉnh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vĩ độ (Lat)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLocLat}
                    onChange={(e) => setNewLocLat(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kinh độ (Lng)</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newLocLng}
                    onChange={(e) => setNewLocLng(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chi phí TB (VNĐ)</label>
                  <input
                    type="number"
                    value={newLocCost}
                    onChange={(e) => setNewLocCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mẹo du lịch thực tế (Tips)</label>
                <textarea
                  rows={2}
                  value={newLocTips}
                  onChange={(e) => setNewLocTips(e.target.value)}
                  placeholder="Kinh nghiệm đi giờ nào đẹp, gửi xe ở đâu..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
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
