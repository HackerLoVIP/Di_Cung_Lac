import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FaCompass, FaMapMarkedAlt, FaSuitcase, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
              <FaCompass className="text-xl" />
            </div>
            <div>
              <span className="font-extrabold text-xl text-slate-800 tracking-tight">Đi Cùng Lạc</span>
              <span className="hidden sm:inline-block ml-2 text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">AI Travel</span>
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
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/my-trips" className="text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-lg transition-colors">
                  Chuyến đi của tôi
                </Link>
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
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
    </nav>
  );
};
