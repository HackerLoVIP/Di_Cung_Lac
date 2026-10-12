import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { provinceAPI } from '../services/api';
import { Location, Province } from '../types';
import { LocationCard } from '../components/LocationCard';
import { FaSpinner } from 'react-icons/fa';

export const Explore: React.FC = () => {
  const { provinceId } = useParams();
  const currentId = Number(provinceId) || 1;

  const [province, setProvince] = useState<Province | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {province && (
        <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden shadow-lg border border-slate-200">
          <img
            src={province.image_url || 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800'}
            alt={province.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/35 to-transparent flex items-end p-6 sm:p-10">
            <div className="text-white space-y-2">
              <span className="text-xs pastel-yellow-badge text-amber-950 font-bold px-3 py-1 rounded-full uppercase tracking-wider">Điểm đến nổi bật</span>
              <h1 className="text-3xl sm:text-4xl font-black">{province.name}</h1>
              <p className="text-slate-200 text-sm max-w-2xl">{province.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Filter Tabs */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none pt-1">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 shadow-2xs ${
              activeCategory === c.key
                ? 'pastel-yellow-badge border-amber-400 font-black shadow-sm scale-105'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-amber-300 hover:bg-amber-50/40'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <FaSpinner className="text-3xl text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {locations.map((loc) => (
            <LocationCard key={loc.id} location={loc} />
          ))}
        </div>
      )}
    </div>
  );
};
