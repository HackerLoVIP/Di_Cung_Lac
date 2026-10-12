import React, { useState } from 'react';
import { ItineraryDay, ItineraryItem } from '../types';
import {
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaLightbulb,
  FaUtensils,
  FaParking,
  FaTrash,
  FaDirections,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

interface ItineraryTimelineProps {
  days: ItineraryDay[];
  selectedDayNumber: number;
  activeLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
  onRemoveItem?: (dayNumber: number, itemId: number) => void;
  compact?: boolean;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  days,
  selectedDayNumber,
  activeLocationId,
  onSelectLocation,
  onRemoveItem,
  compact = false,
}) => {
  // Trạng thái thu gọn/mở rộng từng điểm dừng
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedKeys((prev) => ({
      ...prev,
      [key]: prev[key] !== undefined ? !prev[key] : false
    }));
  };

  const handleToggleAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    displayDays.forEach((d) => {
      d.items.forEach((it, idx) => {
        updated[`${d.day_number}_${it.id || idx}`] = expand;
      });
    });
    setExpandedKeys(updated);
  };

  const getCategoryBadge = (cat?: string) => {
    switch (cat) {
      case 'restaurant':
        return <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">🍜 Ẩm thực</span>;
      case 'cafe':
        return <span className="bg-orange-100 text-orange-900 text-[10px] px-2 py-0.5 rounded-full font-bold">☕ Cà phê</span>;
      case 'beach':
        return <span className="bg-blue-100 text-blue-900 text-[10px] px-2 py-0.5 rounded-full font-bold">🏖️ Biển</span>;
      case 'hotel':
        return <span className="bg-purple-100 text-purple-900 text-[10px] px-2 py-0.5 rounded-full font-bold">🏨 Khách sạn</span>;
      case 'shopping':
        return <span className="bg-pink-100 text-pink-900 text-[10px] px-2 py-0.5 rounded-full font-bold">🛍️ Mua sắm</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-900 text-[10px] px-2 py-0.5 rounded-full font-bold">🏛️ Tham quan</span>;
    }
  };

  // Neu selectedDayNumber === 0, hien thi tat ca ngay, neu khong chi hien thi ngay duoc chon
  const displayDays =
    selectedDayNumber === 0
      ? days
      : days.filter((d) => d.day_number === selectedDayNumber);

  return (
    <div className={compact ? 'space-y-4' : 'space-y-10'}>
      {displayDays.map((day) => (
        <div
          key={day.day_number}
          className={
            compact
              ? 'bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3'
              : 'pastel-card rounded-3xl p-6 sm:p-8 border border-amber-200/60 shadow-xs space-y-6'
          }
        >
          {/* Header Ngay */}
          <div className="flex items-center justify-between pb-2.5 border-b border-amber-100 gap-2">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-amber-300 text-amber-950 font-black flex items-center justify-center text-sm shadow-2xs">
                {day.day_number}
              </span>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-800">{day.title}</h3>
                <p className="text-[10px] text-slate-400">
                  {day.items.length} điểm dừng chân • Lộ trình tối ưu
                </p>
              </div>
            </div>

            {/* Quick Toggle All Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleToggleAll(false)}
                className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Thu gọn thông tin tất cả các điểm dừng"
              >
                Thu gọn
              </button>
              <button
                type="button"
                onClick={() => handleToggleAll(true)}
                className="text-[10px] font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-md transition cursor-pointer"
                title="Mở rộng thông tin tất cả các điểm dừng"
              >
                Mở rộng
              </button>
            </div>
          </div>

          {/* Timeline cac diem den */}
          <div className={`relative ${compact ? 'pl-4 space-y-4 pt-1' : 'pl-6 sm:pl-8 space-y-8 pt-2'} border-l-2 border-amber-300`}>
            {day.items.map((item, idx) => {
              const isSelected = activeLocationId === item.location?.id;
              const itemKey = `${day.day_number}_${item.id || idx}`;
              const isExpanded =
                expandedKeys[itemKey] !== undefined
                  ? expandedKeys[itemKey]
                  : isSelected;

              return (
                <div
                  key={idx}
                  onClick={() => {
                    if (onSelectLocation && item.location) {
                      onSelectLocation(item.location.id);
                    }
                    toggleExpand(itemKey);
                  }}
                  className="relative group space-y-2 cursor-pointer"
                >
                  {/* Pin Dot Indicator */}
                  <div
                    className={`absolute ${
                      compact
                        ? '-left-[25px] top-1 w-6 h-6 text-[10px]'
                        : '-left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 text-xs'
                    } rounded-full font-black flex items-center justify-center border-2 border-white shadow-md transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-amber-950 scale-110 ring-2 ring-amber-300'
                        : 'bg-amber-300 text-amber-950 group-hover:bg-amber-400 group-hover:scale-105'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Đoạn hiển thị di chuyển từ điểm trước đó */}
                  {item.travel_distance_km !== undefined && item.travel_distance_km > 0 && (
                    <div className="inline-flex items-center gap-1.5 pastel-yellow-badge px-2.5 py-1 rounded-lg text-[11px] font-semibold shadow-2xs">
                      <FaMotorcycle className="text-amber-700 text-xs" />
                      <span>
                        Chặng: <b>{item.travel_distance_km} km</b> (~{item.travel_time_minutes}p)
                      </span>
                    </div>
                  )}

                  {/* Card thông tin chi tiết địa điểm */}
                  <div
                    className={`${
                      compact ? 'p-3 rounded-xl space-y-2' : 'p-5 sm:p-6 rounded-2xl space-y-4'
                    } border transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 border-amber-300 shadow-md ring-2 ring-amber-300 scale-[1.01]'
                        : 'bg-white hover:bg-amber-50/30 hover:border-amber-200/80 border-slate-200/80 shadow-2xs hover:shadow-xs'
                    }`}
                  >
                    {/* Header Card (Clickable to Toggle Details) */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold pastel-yellow-badge px-2 py-0.5 rounded-md shadow-2xs">
                            <FaClock className="text-amber-700 text-[10px]" />
                            {item.time_slot}
                          </span>
                          {getCategoryBadge(item.location?.category)}
                          <h4 className={`font-black text-slate-900 ${compact ? 'text-xs sm:text-sm' : 'text-lg sm:text-xl'} truncate`}>
                            {item.location?.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                          <FaMapMarkerAlt className="text-amber-500 shrink-0 text-[10px]" />
                          <span className="truncate">{item.location?.address}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`font-black text-amber-900 ${compact ? 'text-xs sm:text-sm' : 'text-base sm:text-lg'} block`}>
                          {item.location?.avg_cost_vnd === 0
                            ? 'Miễn phí'
                            : `${item.location?.avg_cost_vnd?.toLocaleString('vi-VN')} đ`}
                        </span>

                        {/* Quick action buttons & Accordion Toggle */}
                        <div className="flex items-center justify-end gap-1.5 pt-0.5">
                          {isExpanded && (
                            <>
                              <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${item.location?.latitude},${item.location?.longitude}&travelmode=driving`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 hover:text-amber-950 pastel-yellow-badge px-2 py-0.5 rounded-lg shadow-2xs hover:bg-amber-200 transition"
                                title="Chỉ đường trên Google Maps"
                              >
                                <FaDirections className="text-amber-700 text-[10px]" /> Dẫn đường
                              </a>

                              {onRemoveItem && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onRemoveItem(day.day_number, item.id);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 p-1 transition rounded hover:bg-rose-50 cursor-pointer"
                                  title="Bỏ điểm dừng này"
                                >
                                  <FaTrash className="text-[10px]" />
                                </button>
                              )}
                            </>
                          )}

                          {/* Nút Thu gọn / Mở rộng */}
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(itemKey, e)}
                            className="p-1 rounded-md text-slate-400 hover:text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-0.5 text-[10px] font-bold"
                            title={isExpanded ? 'Thu gọn chi tiết' : 'Mở rộng chi tiết'}
                          >
                            <span className="hidden sm:inline">{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                            <FaChevronDown
                              className={`text-[10px] transition-transform duration-300 ${
                                isExpanded ? 'rotate-180 text-amber-800' : ''
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Phần chi tiết (Chỉ hiển thị khi Mở rộng / isExpanded) */}
                    {isExpanded && (
                      <div className={compact ? 'space-y-2 pt-1 border-t border-slate-100 animate-fade-in' : 'grid grid-cols-1 md:grid-cols-3 gap-4 pt-1 animate-fade-in'}>
                        {item.location && (
                          <div className={compact ? 'w-full h-28 rounded-xl overflow-hidden border border-amber-200/60 relative shadow-2xs group/img' : 'md:col-span-1 h-40 rounded-2xl overflow-hidden border border-amber-200/60 relative shadow-2xs group/img'}>
                            <img
                              src={
                                item.location.image_url ||
                                (item.location.category === 'restaurant'
                                  ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800'
                                  : item.location.category === 'cafe'
                                  ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800'
                                  : 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800')
                              }
                              alt={item.location.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800';
                              }}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
                            <span className="absolute bottom-1.5 left-2 text-[9px] font-bold text-white bg-slate-900/70 backdrop-blur-xs px-1.5 py-0.5 rounded">
                              📷 Ảnh thực tế
                            </span>
                          </div>
                        )}

                      <div className={`space-y-3 ${item.location?.image_url ? 'md:col-span-2' : 'md:col-span-3'}`}>
                        {/* Trải nghiệm / Hoạt động tại điểm dừng */}
                        {item.note && (
                          <div className="bg-amber-50/70 border border-amber-200/70 p-2.5 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                            <span className="font-bold text-amber-800 flex-shrink-0">📝 Trải nghiệm:</span>
                            <span className="font-medium leading-relaxed text-slate-700">{item.note}</span>
                          </div>
                        )}

                        {/* Menu mon an thuc te */}
                        {item.location?.menu_items && item.location.menu_items.length > 0 && (() => {
                          const uniqueMenuItems = item.location.menu_items.filter(
                            (m, idx, arr) => arr.findIndex((x) => x.name?.trim().toLowerCase() === m.name?.trim().toLowerCase()) === idx
                          );
                          if (uniqueMenuItems.length === 0) return null;
                          return (
                            <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                <FaUtensils className="text-amber-500" /> Bảng giá & Món nổi bật:
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {uniqueMenuItems.map((m) => (
                                  <div
                                    key={m.id || m.name}
                                    className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-lg border border-slate-100"
                                  >
                                    <span className="font-medium text-slate-800 truncate pr-1">
                                      {m.is_signature && (
                                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded mr-1">
                                          Ngon
                                        </span>
                                      )}
                                      {m.name}
                                    </span>
                                    <span className="font-bold text-emerald-600 flex-shrink-0">
                                      {m.price_vnd.toLocaleString('vi-VN')}đ
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Mẹo du lịch thực tế */}
                        {item.location?.tips && (
                          <div className="bg-amber-50/80 border border-amber-200/80 p-2.5 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                            <FaLightbulb className="text-amber-500 text-sm flex-shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Mẹo thực tế:</span> {item.location.tips}
                            </div>
                          </div>
                        )}

                        {/* Bãi gửi xe & Đường đi */}
                        {item.location?.transport_info && (
                          <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                            <FaParking className="text-sky-600 flex-shrink-0" />
                            <div>
                              <span className="font-bold">Bãi đỗ xe:</span> {item.location.transport_info}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
