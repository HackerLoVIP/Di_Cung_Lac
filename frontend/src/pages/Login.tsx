import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authAPI.login(email, password);
      await login(data.access_token);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('haidangdmc123@gmail.com');
  const [googleNameInput, setGoogleNameInput] = useState('Hải Đăng (Thdang53)');

  const handleGoogleLogin = async (email: string, name: string, avatar?: string) => {
    setGoogleLoading(true);
    try {
      const data = await authAPI.googleLogin({
        email,
        full_name: name,
        avatar_url: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0D8ABC&color=fff`,
      });
      await login(data.access_token);
      toast.success(`Đăng nhập Google thành công: ${email}!`);
      setShowGoogleModal(false);
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Không thể đăng nhập bằng Google lúc này');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Chào mừng trở lại</h2>
          <p className="text-xs text-slate-500">Đăng nhập để xem và quản lý các lịch trình du lịch của bạn</p>
        </div>

        {/* Nút Đăng nhập bằng Google */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-xl border border-slate-300 shadow-sm transition-all cursor-pointer text-sm"
        >
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
          </svg>
          <span>{googleLoading ? 'Đang kết nối Google...' : 'Đăng nhập bằng Google'}</span>
        </button>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 uppercase">Hoặc email</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-200 transition-all cursor-pointer disabled:opacity-50 text-sm"
          >
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-emerald-600 font-bold hover:underline">
            Đăng ký ngay
          </Link>
        </p>

        {/* Modal Chọn Tài Khoản Google */}
        {showGoogleModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <h3 className="text-base font-black text-slate-800">Đăng nhập bằng Google</h3>
                </div>
                <button
                  onClick={() => setShowGoogleModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500">
                Chọn tài khoản Google của bạn để liên kết và đăng nhập nhanh vào Đi Cùng Lạc:
              </p>

              {/* Danh sách tài khoản mẫu tiện lợi */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin('haidangdmc123@gmail.com', 'Hải Đăng (Thdang53)', 'https://avatars.githubusercontent.com/u/150000001?v=4')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    Đ
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Hải Đăng (Thdang53)</p>
                    <p className="text-[11px] text-slate-500 truncate">haidangdmc123@gmail.com</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleGoogleLogin('tronghieu3443@gmail.com', 'Trọng Hiếu (HackerLoVIP)', 'https://avatars.githubusercontent.com/u/150000002?v=4')}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    H
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">Trọng Hiếu (HackerLoVIP)</p>
                    <p className="text-[11px] text-slate-500 truncate">tronghieu3443@gmail.com</p>
                  </div>
                </button>
              </div>

              {/* Nhập email Google tuỳ ý */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hoặc nhập email Google khác:</p>
                <input
                  type="email"
                  value={googleEmailInput}
                  onChange={(e) => setGoogleEmailInput(e.target.value)}
                  placeholder="your-google-account@gmail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <input
                  type="text"
                  value={googleNameInput}
                  onChange={(e) => setGoogleNameInput(e.target.value)}
                  placeholder="Tên hiển thị của bạn"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleGoogleLogin(googleEmailInput, googleNameInput)}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  Đăng nhập với email này
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
