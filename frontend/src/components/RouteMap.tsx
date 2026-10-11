import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';

interface RouteMapProps {
  items: ItineraryItem[];
  dayNumber: number;
}

export const RouteMap: React.FC<RouteMapProps> = ({ items, dayNumber }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || items.length === 0) return;

    // Khoi tao hoac xoa map cu neu da co
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const firstLoc = items[0].location;
    const map = L.map(mapContainerRef.current).setView([firstLoc.latitude, firstLoc.longitude], 13);
    mapInstanceRef.current = map;

    // Su dung lop ban do OpenStreetMap chuan, load cuc nhanh va hoan toan mien phi
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const latlngs: L.LatLngExpression[] = [];

    // Tao cac Marker danh so (1), (2), (3)... giong Google Maps
    items.forEach((item, index) => {
      const loc = item.location;
      latlngs.push([loc.latitude, loc.longitude]);

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            background: #059669;
            color: white;
            font-weight: 800;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            font-size: 13px;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const popupContent = `
        <div style="font-family: inherit; width: 220px;">
          <img src="${loc.image_url || ''}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />
          <div style="font-weight: 800; font-size: 14px; color: #1e293b; margin-bottom: 4px;">${index + 1}. ${loc.name}</div>
          <div style="font-size: 11px; color: #059669; font-weight: 700; margin-bottom: 4px;">⏰ ${item.time_slot} - Dự kiến ${loc.avg_duration_minutes} phút</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${loc.address}</div>
          ${item.travel_distance_km && item.travel_distance_km > 0 ? `<div style="font-size: 11px; background: #ecfdf5; color: #047857; padding: 4px 6px; border-radius: 4px;">🛵 Cách điểm trước: <b>${item.travel_distance_km} km</b> (~${item.travel_time_minutes} phút)</div>` : ''}
        </div>
      `;

      L.marker([loc.latitude, loc.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    // Ve duong noi lo trinh di chuyen (Polyline) giong tuyen duong Google Maps
    if (latlngs.length > 1) {
      const polyline = L.polyline(latlngs, {
        color: '#059669',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      // Tu dong zoom vua van toan bo lo trinh
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="font-semibold text-slate-700">🗺️ Lộ trình di chuyển Ngày {dayNumber} (Tự động định vị GPS):</span>
        <span>Ấn vào mốc số (1, 2, 3...) để xem chi tiết</span>
      </div>
      <div
        ref={mapContainerRef}
        className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-300 shadow-inner z-10"
      />
    </div>
  );
};
