import React from 'react';
import { ItineraryDay } from '../types';
import { RouteMap } from './RouteMap';
import { FaClock, FaMapMarkerAlt, FaMotorcycle, FaLightbulb, FaUtensils, FaParking } from 'react-icons/fa';

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ days }) => {
  return (
    <div className="space-y-12">
      {days.map((day) => (
        <div key={day.day_number} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          {/* Header Ngay */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center text-base shadow-md shadow-emerald-200">
                {day.day_number}
              </span>
              <div>
                <h3 className="font-extrabold text-xl text-slate-800">{day.title}</h3>
                <p className="text-xs text-slate-400">Gồm {day.items.length} điểm đến được tối ưu theo cung đường ngắn nhất</p>
              </div>
            </div>
          </div>

          {/* Ban do ban lo trinh GPS (Google Maps style) */}
          <RouteMap items={day.items} dayNumber={day.day_number} />

          {/* Timeline cac diem den */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-emerald-300 space-y-8 pt-4">
            {day.items.map((item, idx) => (
              <div key={idx} className="relative group space-y-3">
                {/* Number Badge Dot */}
                <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center border-4 border-white shadow-md">
                  {idx + 1}
                </div>

                {/* Đoạn hiển thị di chuyển từ điểm trước đó */}
                {item.travel_distance_km !== undefined && item.travel_distance_km > 0 && (
                  <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xs">
                    <FaMotorcycle className="text-emerald-600 text-sm" />
                    <span>Di chuyển từ điểm trước: <b>{item.travel_distance_km} km</b> (~{item.travel_time_minutes} phút xe máy)</span>
                  </div>
                )}

                {/* Card thông tin chi tiết địa điểm */}
                <div className="bg-slate-50 hover:bg-slate-100/80 p-5 sm:p-6 rounded-2xl border border-slate-200/80 transition-all space-y-4">
                  {/* Tên & Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-emerald-600 px-2.5 py-0.5 rounded-md">
                          <FaClock className="text-xs" />
                          {item.time_slot}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-lg sm:text-xl">{item.location?.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <FaMapMarkerAlt className="text-slate-400 flex-shrink-0" />
                        {item.location?.address}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Chi phí ước tính</span>
                      <span className="font-black text-emerald-600 text-lg sm:text-xl">
                        {item.location?.avg_cost_vnd === 0 ? 'Miễn phí' : `${item.location?.avg_cost_vnd.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>

                  {/* Ảnh và Menu chi tiết */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                      {/* Menu món ăn hoặc bảng giá vé */}
                      {item.location?.menu_items && item.location.menu_items.length > 0 && (
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                          <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            <FaUtensils className="text-amber-500" /> Bảng giá & Món đặc sản nên gọi:
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            {item.location.menu_items.map((m) => (
                              <div key={m.id} className="flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                                <span className="font-medium text-slate-800 flex items-center gap-1">
                                  {m.is_signature && <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Ngon</span>}
                                  {m.name}
                                </span>
                                <span className="font-bold text-emerald-600">{m.price_vnd.toLocaleString('vi-VN')}đ</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips và Lời khuyên thực tế */}
                      {item.location?.tips && (
                        <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                          <FaLightbulb className="text-amber-500 text-sm flex-shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Mẹo thực tế:</span> {item.location.tips}
                          </div>
                        </div>
                      )}

                      {/* Gửi xe & Di chuyển */}
                      {item.location?.transport_info && (
                        <div className="bg-sky-50 border border-sky-200 p-2.5 rounded-xl text-xs text-sky-900 flex items-center gap-2">
                          <FaParking className="text-sky-600 flex-shrink-0" />
                          <div>
                            <span className="font-bold">Bãi đỗ & Đường đi:</span> {item.location.transport_info}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
