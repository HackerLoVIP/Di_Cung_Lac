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
    { key: 'all', label: 'Tất cả' },
    { key: 'tourist_spot', label: 'Tham quan' },
    { key: 'beach', label: 'Bãi biển' },
    { key: 'restaurant', label: 'Quán ăn' },
    { key: 'cafe', label: 'Cà phê' },
    { key: 'hotel', label: 'Khách sạn' },
    { key: 'shopping', label: 'Mua sắm' },
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
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-6 sm:p-10">
            <div className="text-white space-y-2">
              <span className="text-xs bg-emerald-500 font-bold px-3 py-1 rounded-full uppercase">Điểm đến</span>
              <h1 className="text-3xl sm:text-4xl font-black">{province.name}</h1>
              <p className="text-slate-200 text-sm max-w-2xl">{province.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveCategory(c.key)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === c.key
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.label}
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
