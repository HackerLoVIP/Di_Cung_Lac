import React from 'react';
import { Location } from '../types';
import { FaStar, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

interface LocationCardProps {
  location: Location;
}

export const LocationCard: React.FC<LocationCardProps> = ({ location }) => {
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'beach':
        return <span className="bg-sky-100 text-sky-700 text-xs font-semibold px-2.5 py-1 rounded-full">Bãi biển</span>;
      case 'restaurant':
        return <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Ẩm thực</span>;
      case 'cafe':
        return <span className="bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">Cà phê</span>;
      case 'hotel':
        return <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">Khách sạn</span>;
      case 'shopping':
        return <span className="bg-pink-100 text-pink-700 text-xs font-semibold px-2.5 py-1 rounded-full">Mua sắm</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Tham quan</span>;
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col group">
      <div className="relative h-48 w-full overflow-hidden bg-slate-100">
        <img
          src={location.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600'}
          alt={location.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 left-3">
          {getCategoryBadge(location.category)}
        </div>
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm text-xs font-bold text-amber-600">
          <FaStar className="text-amber-400" />
          {location.rating}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-600 transition-colors line-clamp-1">
            {location.name}
          </h3>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 line-clamp-1">
            <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
            {location.address}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1">
            <FaClock className="text-slate-400" />
            {location.avg_duration_minutes} phút
          </span>
          <span className="font-bold text-emerald-600 text-sm">
            {location.avg_cost_vnd === 0 ? 'Miễn phí' : `${location.avg_cost_vnd.toLocaleString('vi-VN')} đ`}
          </span>
        </div>
      </div>
    </div>
  );
};
