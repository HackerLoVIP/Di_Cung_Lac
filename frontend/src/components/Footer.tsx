import React from 'react';
import { FaCompass, FaHeart } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
              <FaCompass />
            </div>
            <span className="font-bold text-lg text-white">Đi Cùng Lạc</span>
          </div>
          <p className="text-sm text-center md:text-left">
            Kim chỉ nam: <span className="text-emerald-400 font-medium">Lịch trình thật – Trải nghiệm thật – Đáng tiền thật</span>
          </p>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            Đồ án môn Công nghệ phần mềm 2026. Made with <FaHeart className="text-red-500 text-xs" />
          </div>
        </div>
      </div>
    </footer>
  );
};
