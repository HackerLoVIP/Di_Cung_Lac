import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { provinceAPI } from '../services/api';
import { Location, Province } from '../types';
import { LocationCard } from '../components/LocationCard';
import { FaSpinner, FaSearch, FaMapMarkerAlt, FaUtensils, FaCoffee, FaHotel } from 'react-icons/fa';

export const Explore: React.FC = () => {
  const { provinceId } = useParams();
  const navigate = useNavigate();
  const currentId = Number(provinceId) || 1;

  const [province, setProvince] = useState<Province | null>(null);
  const [allProvinces, setAllProvinces] = useState<Province[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const categories = [
    { key: 'all', label: 'Tất cả', icon: '🌟' },
    { key: 'tourist_spot', label: 'Tham quan', icon: '🏛️' },
    { key: 'beach', label: 'Bãi biển', icon: '🏖️' },
    { key: 'restaurant', label: 'Quán ăn ngon', icon: '🍜' },
    { key: 'cafe', label: 'Cà phê view chill', icon: '☕' },
    { key: 'hotel', label: 'Khách sạn', icon: '🏨' },
    { key: 'shopping', label: 'Mua sắm & Chợ', icon: '🛍️' },
  ];

  useEffect(() => {
    provinceAPI.getAll().then(setAllProvinces).catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      provinceAPI.getById(currentId),
      provinceAPI.getLocations(currentId, activeCategory),
    ])
      .then(([provData, locData]) => {
        setProvince(provData);
        setLocations(locData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentId, activeCategory]);

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const q = searchQuery.toLowerCase().trim();
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.address?.toLowerCase().includes(q) ||
        loc.description?.toLowerCase().includes(q) ||
        loc.menu_items?.some((m) => m.name.toLowerCase().includes(q))
    );
  }, [locations, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Province Hero Banner */}
      {province && (
        <div className="relative h-72 sm:h-88 rounded-3xl overflow-hidden shadow-xl border border-slate-200 group">
          <img
            src={province.image_url || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800'}
            alt={province.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-between p-6 sm:p-8 text-white">
            {/* Top Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="pastel-yellow-badge text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                🌟 Điểm đến xác thực
              </span>
              
              {/* Province quick pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none bg-slate-900/60 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                {allProvinces.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/explore/${p.id}`)}
                    className={`text-xs px-3 py-1 rounded-xl font-bold transition cursor-pointer whitespace-nowrap ${
                      p.id === currentId
                        ? 'bg-amber-300 text-amber-950 font-black shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Hero Info */}
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight">{province.name}</h1>
              <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed">{province.description}</p>
              <div className="flex items-center gap-4 pt-1 text-xs text-amber-300 font-bold">
                <span>📍 {locations.length} Địa điểm trong cơ sở dữ liệu</span>
                <span>•</span>
                <span>⭐ 100% Xác thực GPS</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Category Filter Control Hub */}
      <div className="space-y-4">
        {/* Search Input Bar */}
        <div className="relative max-w-xl">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên địa điểm, món ăn đặc sản, tên đường..."
            className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-200/90 hover:border-amber-300 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-slate-900 font-semibold focus:outline-none shadow-xs transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Smart Category Filter Tabs */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-0.5">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setActiveCategory(c.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  activeCategory === c.key
                    ? 'pastel-yellow-badge border-amber-400 font-black shadow-xs scale-102 ring-2 ring-amber-300/40'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-500">
            Hiển thị <span className="font-black text-amber-900">{filteredLocations.length}</span> địa điểm
          </div>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center space-y-3">
          <FaSpinner className="text-3xl text-amber-500 animate-spin" />
          <p className="text-xs font-bold text-slate-400">Đang tải danh sách địa điểm...</p>
        </div>
      ) : filteredLocations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border-2 border-slate-200/80 shadow-sm space-y-3">
          <div className="text-4xl">🔍</div>
          <h3 className="font-black text-base text-slate-800">Không tìm thấy địa điểm phù hợp</h3>
          <p className="text-xs text-slate-400">Hãy thử tìm với từ khoá khác hoặc đổi danh mục khám phá bên trên.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
            className="pastel-yellow-btn px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Xem tất cả địa điểm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredLocations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
};
