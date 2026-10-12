import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCompass, FaMapMarkedAlt, FaSuitcase, FaUser, FaSignOutAlt, FaBars, FaTimes, FaCrown } from 'react-icons/fa';
import { PaymentModal } from './PaymentModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };


  return (
    <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center font-bold text-xl shadow-xs group-hover:scale-105 transition-transform">
              <FaCompass className="text-lg" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-800 tracking-tight">Đi Cùng Lạc</span>
              <span className="hidden sm:inline-block ml-2 text-xs pastel-yellow-badge font-bold px-2 py-0.5 rounded-full">AI Travel</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">
              Trang chủ
            </Link>
            <Link to="/explore/1" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors flex items-center gap-1.5">
              <FaMapMarkedAlt className="text-emerald-500" />
              Khám phá địa điểm
            </Link>
            <Link to="/plan" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors flex items-center gap-1.5">
              <FaSuitcase className="text-emerald-500" />
              Lập lịch trình
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {/* VIP Upgrade Button */}
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl pastel-yellow-badge font-black text-xs shadow-2xs hover:scale-105 transition-all cursor-pointer"
            >
              <FaCrown className="text-amber-600" />
              <span>{user?.is_vip ? 'VIP Pro 👑' : 'Nâng cấp VIP'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2.5">
                {(user.role === 'admin' || user.email === 'haidangdmc123@gmail.com' || user.email === 'tronghieu3443@gmail.com') && (
                  <Link to="/admin" className="text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                    ⚙️ Quản trị Admin
                  </Link>
                )}
                <Link to="/my-trips" className="text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                  Chuyến đi của tôi
                </Link>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm relative">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    {user.is_vip ? (
                      <span className="absolute -top-1 -right-1 text-[10px]" title="Thành viên VIP">👑</span>
                    ) : null}
                  </div>
                  <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">{user.full_name}</span>
                  <button onClick={handleLogout} title="Đăng xuất" className="text-slate-400 hover:text-red-500 p-1.5 rounded-md transition-colors">
                    <FaSignOutAlt />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-slate-700 hover:text-emerald-600 font-semibold text-sm px-3 py-2 rounded-lg transition-colors">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2 rounded-lg shadow-sm shadow-emerald-200 transition-all">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 p-2 focus:outline-none">
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Trang chủ</Link>
          <Link to="/explore/1" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Khám phá địa điểm</Link>
          <Link to="/plan" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">Lập lịch trình</Link>
          {user ? (
            <>
              <Link to="/my-trips" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-emerald-700 font-medium">Chuyến đi của tôi</Link>
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 text-red-600 font-medium">Đăng xuất ({user.full_name})</button>
            </>
          ) : (
            <div className="pt-2 flex gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 border border-slate-200 rounded-lg font-semibold text-sm">Đăng nhập</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex-1 text-center py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm">Đăng ký</Link>
            </div>
          )}
        </div>
      )}

      {/* SePay VietQR Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          setShowPaymentModal(false);
          window.location.reload();
        }}
      />
    </nav>
  );
};

