import React from 'react';
import { ItineraryDay, ItineraryItem } from '../types';
import {
  FaClock,
  FaMapMarkerAlt,
  FaMotorcycle,
  FaLightbulb,
  FaUtensils,
  FaParking,
  FaTrash,
  FaDirections
} from 'react-icons/fa';

interface ItineraryTimelineProps {
  days: ItineraryDay[];
  selectedDayNumber: number;
  activeLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
  onRemoveItem?: (dayNumber: number, itemId: number) => void;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  days,
  selectedDayNumber,
  activeLocationId,
  onSelectLocation,
  onRemoveItem,
}) => {
  // Neu selectedDayNumber === 0, hien thi tat ca ngay, neu khong chi hien thi ngay duoc chon
  const displayDays =
    selectedDayNumber === 0
      ? days
      : days.filter((d) => d.day_number === selectedDayNumber);

  return (
    <div className="space-y-10">
      {displayDays.map((day) => (
        <div key={day.day_number} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          {/* Header Ngay */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-base shadow-md shadow-blue-200">
                {day.day_number}
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-slate-800">{day.title}</h3>
                <p className="text-xs text-slate-400">
                  {day.items.length} điểm dừng chân theo lộ trình Google Maps tối ưu
                </p>
              </div>
            </div>
          </div>

          {/* Timeline cac diem den */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-400 space-y-8 pt-2">
            {day.items.map((item, idx) => {
              const isSelected = activeLocationId === item.location?.id;

              return (
                <div
                  key={idx}
                  onClick={() => onSelectLocation && item.location && onSelectLocation(item.location.id)}
                  className="relative group space-y-3 cursor-pointer"
                >
                  {/* Google Pin Dot Indicator */}
                  <div
                    className={`absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full font-black text-xs flex items-center justify-center border-4 border-white shadow-md transition-all ${
                      isSelected
                        ? 'bg-red-600 text-white scale-125 ring-4 ring-red-200'
                        : 'bg-blue-600 text-white group-hover:bg-red-500'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Đoạn hiển thị di chuyển từ điểm trước đó */}
                  {item.travel_distance_km !== undefined && item.travel_distance_km > 0 && (
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs">
                      <FaMotorcycle className="text-blue-600 text-sm" />
                      <span>
                        Chặng di chuyển: <b>{item.travel_distance_km} km</b> (~{item.travel_time_minutes} phút lái xe)
                      </span>
                    </div>
                  )}

                  {/* Card thông tin chi tiết địa điểm */}
                  <div
                    className={`p-5 sm:p-6 rounded-2xl border transition-all space-y-4 ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-400 shadow-md ring-2 ring-blue-300'
                        : 'bg-slate-50 hover:bg-slate-100/90 border-slate-200/80 shadow-xs'
                    }`}
                  >
                    {/* Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-blue-600 px-2.5 py-0.5 rounded-md">
                            <FaClock className="text-xs" />
                            {item.time_slot}
                          </span>
                          <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold uppercase">
                            {item.location?.category}
                          </span>
                          <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl truncate">
                            {item.location?.name}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <FaMapMarkerAlt className="text-red-500 flex-shrink-0" />
                          {item.location?.address}
                        </p>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2">
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Dự trù chi phí</span>
                          <span className="font-black text-emerald-600 text-base sm:text-lg">
                            {item.location?.avg_cost_vnd === 0
                              ? 'Miễn phí'
                              : `${item.location?.avg_cost_vnd?.toLocaleString('vi-VN')} đ`}
                          </span>
                        </div>

                        {/* Quick action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${item.location?.latitude},${item.location?.longitude}&travelmode=driving`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white border border-blue-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-blue-50 transition"
                            title="Chỉ đường trên Google Maps"
                          >
                            <FaDirections /> Google Maps
                          </a>

                          {onRemoveItem && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveItem(day.day_number, item.id);
                              }}
                              className="text-slate-400 hover:text-red-500 p-1.5 transition"
                              title="Bỏ điểm dừng này"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Anh, Menu va Tips */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {item.location?.image_url && (
                        <div className="md:col-span-1 h-36 rounded-xl overflow-hidden border border-slate-200">
                          <img
                            src={item.location.image_url}
                            alt={item.location.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      <div className={`space-y-3 ${item.location?.image_url ? 'md:col-span-2' : 'md:col-span-3'}`}>
                        {/* Menu mon an thuc te */}
                        {item.location?.menu_items && item.location.menu_items.length > 0 && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                            <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                              <FaUtensils className="text-amber-500" /> Bảng giá & Món nổi bật:
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              {item.location.menu_items.map((m) => (
                                <div
                                  key={m.id}
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
                        )}

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
