import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCompass, FaMapMarkedAlt, FaSuitcase, FaSignOutAlt, FaBars, FaTimes, FaCrown } from 'react-icons/fa';
import { PaymentModal } from './PaymentModal';
import { PeanutRider } from './PeanutRider';

export const Navbar: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isAdmin = Boolean(
    user &&
      (user.role === 'admin' ||
        user.email === 'haidangdmc123@gmail.com' ||
        user.email === 'tronghieu3443@gmail.com' ||
        user.email === 'admin@dicunglac.vn')
  );

  return (
    <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-amber-200/60 shadow-2xs relative">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0 whitespace-nowrap">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-300 text-amber-950 flex items-center justify-center font-bold text-lg sm:text-xl shadow-xs group-hover:scale-105 transition-transform relative shrink-0">
              <FaCompass className="text-base sm:text-lg" />
              <span className="absolute -bottom-1 -right-1 text-xs" title="Bé Lạc">🥜</span>
            </div>
            <div className="flex items-center">
              <span className="font-extrabold text-lg sm:text-xl text-slate-800 tracking-tight whitespace-nowrap">
                Đi Cùng Lạc
              </span>
              <span className="hidden xl:inline-block ml-2 text-[11px] pastel-yellow-badge font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                AI Travel
              </span>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 shrink-0">
            <Link
              to="/"
              className="text-slate-600 hover:text-emerald-600 font-semibold text-xs lg:text-sm transition-colors whitespace-nowrap"
            >
              Trang chủ
            </Link>
            <Link
              to="/explore/1"
              className="text-slate-600 hover:text-emerald-600 font-semibold text-xs lg:text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FaMapMarkedAlt className="text-emerald-500 shrink-0" />
              <span>Khám phá địa điểm</span>
            </Link>
            <Link
              to="/plan"
              className="text-slate-600 hover:text-emerald-600 font-semibold text-xs lg:text-sm transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <FaSuitcase className="text-emerald-500 shrink-0" />
              <span>Lập lịch trình</span>
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl vip-shimmer-btn font-black text-xs shadow-sm cursor-pointer whitespace-nowrap shrink-0"
            >
              <FaCrown className="text-amber-700 text-xs animate-bounce shrink-0" />
              <span>{user?.is_vip ? 'VIP Pro 👑' : 'Nâng cấp VIP'}</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 shrink-0">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2.5 py-1.5 rounded-xl transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap shrink-0"
                  >
                    <span>⚙️ Quản trị</span>
                  </Link>
                )}
                <Link
                  to="/my-trips"
                  className="text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Chuyến đi của tôi
                </Link>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2 shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs relative shrink-0">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    {user.is_vip ? (
                      <span className="absolute -top-1 -right-1 text-[10px]" title="Thành viên VIP">
                        👑
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs lg:text-sm font-semibold text-slate-700 max-w-[90px] lg:max-w-[115px] truncate whitespace-nowrap">
                    {user.full_name}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="text-slate-400 hover:text-red-500 p-1.5 rounded-md transition-colors cursor-pointer shrink-0"
                  >
                    <FaSignOutAlt />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/login"
                  className="text-slate-700 hover:text-emerald-600 font-semibold text-xs lg:text-sm px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs lg:text-sm px-3.5 py-1.5 rounded-xl shadow-sm shadow-emerald-200 transition-all whitespace-nowrap"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-600 p-2 focus:outline-none"
            >
              {mobileMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-2">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">
            Trang chủ
          </Link>
          <Link
            to="/explore/1"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-slate-700 font-medium"
          >
            Khám phá địa điểm
          </Link>
          <Link to="/plan" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-700 font-medium">
            Lập lịch trình
          </Link>
          {user ? (
            <>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 text-amber-700 font-bold"
                >
                  ⚙️ Quản trị hệ thống
                </Link>
              )}
              <Link
                to="/my-trips"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-emerald-700 font-medium"
              >
                Chuyến đi của tôi
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left py-2 text-red-600 font-medium"
              >
                Đăng xuất ({user.full_name})
              </button>
            </>
          ) : (
            <div className="pt-2 flex gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 border border-slate-200 rounded-lg font-semibold text-sm"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 text-center py-2 bg-emerald-600 text-white rounded-lg font-semibold text-sm"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      )}

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => {
          refreshUser();
          setShowPaymentModal(false);
        }}
      />

      <PeanutRider />
    </nav>
  );
};
