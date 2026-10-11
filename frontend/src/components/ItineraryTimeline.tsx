import React from 'react';
import { ItineraryDay } from '../types';
import { FaClock, FaMapMarkerAlt, FaTag } from 'react-icons/fa';

interface ItineraryTimelineProps {
  days: ItineraryDay[];
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({ days }) => {
  return (
    <div className="space-y-8">
      {days.map((day) => (
        <div key={day.day_number} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <span className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-extrabold flex items-center justify-center text-sm shadow-md shadow-emerald-200">
              {day.day_number}
            </span>
            <h3 className="font-bold text-lg text-slate-800">{day.title}</h3>
          </div>

          <div className="relative pl-6 border-l-2 border-emerald-200 space-y-6">
            {day.items.map((item, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-emerald-500 shadow-sm" />

                <div className="bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-xl border border-slate-200/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        <FaClock className="text-xs" />
                        {item.time_slot}
                      </span>
                      <h4 className="font-bold text-slate-800 text-base">{item.location?.name}</h4>
                    </div>
                    {item.note && (
                      <p className="text-xs text-slate-500 italic pl-1">💡 {item.note}</p>
                    )}
                    {item.location?.address && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 pl-1">
                        <FaMapMarkerAlt className="text-slate-300" />
                        {item.location.address}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/40">
                    <span className="text-slate-500">{item.location?.avg_duration_minutes} phút</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {item.location?.avg_cost_vnd === 0 ? 'Miễn phí' : `${item.location?.avg_cost_vnd.toLocaleString('vi-VN')} đ`}
                    </span>
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
