import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import { FaMotorcycle, FaRoute, FaDirections, FaEye } from 'react-icons/fa';

interface RouteMapProps {
  items: ItineraryItem[];
  dayNumber: number;
}

interface RouteSegment {
  fromIndex: number;
  toIndex: number;
  fromName: string;
  toName: string;
  distanceKm: number;
  durationMinutes: number;
  coordinates: [number, number][]; // [lat, lng]
}

export const RouteMap: React.FC<RouteMapProps> = ({ items, dayNumber }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeRouteLayerRef = useRef<L.Polyline | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);

  // 1. Khoi tao Ban do Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || items.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const firstLoc = items[0].location;
    const map = L.map(mapContainerRef.current).setView([firstLoc.latitude, firstLoc.longitude], 13);
    mapInstanceRef.current = map;

    // Lop ban do OpenStreetMap sang dep nhu Google Maps / Grab
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    // Ve cac Marker danh so (1), (2), (3)...
    items.forEach((item, index) => {
      const loc = item.location;
      const customIcon = L.divIcon({
        className: 'grab-map-marker',
        html: `
          <div style="
            background: #00B14F;
            color: white;
            font-weight: 800;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            font-size: 13px;
          ">
            ${index + 1}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([loc.latitude, loc.longitude], { icon: customIcon })
        .addTo(markersGroup)
        .bindPopup(`
          <div style="font-family: inherit; width: 200px;">
            <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 4px;">(${index + 1}) ${loc.name}</div>
            <div style="font-size: 11px; color: #00B14F; font-weight: 700; margin-bottom: 2px;">⏰ ${item.time_slot}</div>
            <div style="font-size: 11px; color: #64748b;">📍 ${loc.address}</div>
          </div>
        `);
    });

    // 2. Goi API OSRM Routing de lay duong di thuc te bam sat mat duong giao thong (Grab style)
    const fetchRealStreetRoutes = async () => {
      if (items.length < 2) return;
      setLoadingRoute(true);

      const segmentList: RouteSegment[] = [];

      for (let i = 0; i < items.length - 1; i++) {
        const from = items[i].location;
        const to = items[i + 1].location;

        try {
          // OSRM API: truyen lng,lat;lng,lat
          const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
          const res = await fetch(osrmUrl);
          const data = await res.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            // GeoJSON coordinates la [lng, lat], can chuyen thanh [lat, lng] cho Leaflet
            const coords: [number, number][] = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

            segmentList.push({
              fromIndex: i,
              toIndex: i + 1,
              fromName: from.name,
              toName: to.name,
              distanceKm: Math.round((route.distance / 1000) * 10) / 10,
              durationMinutes: Math.round(route.duration / 60),
              coordinates: coords,
            });
          }
        } catch (err) {
          console.error("Loi khi lay route OSRM:", err);
        }
      }

      setSegments(segmentList);
      setLoadingRoute(false);

      // Mac dinh ve toan bo cac chang duong bang net day Grab
      drawFullDayRoute(segmentList, map);
    };

    fetchRealStreetRoutes();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items]);

  // Ve toan bo tuyen duong trong ngay
  const drawFullDayRoute = (segList: RouteSegment[], map: L.Map) => {
    if (activeRouteLayerRef.current) {
      map.removeLayer(activeRouteLayerRef.current);
    }

    const allCoords = segList.flatMap((s) => s.coordinates);
    if (allCoords.length > 0) {
      const fullPolyline = L.polyline(allCoords, {
        color: '#00B14F', // Mau xanh Grab dac trung
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      activeRouteLayerRef.current = fullPolyline;
      map.fitBounds(fullPolyline.getBounds(), { padding: [40, 40] });
    }
  };

  // Focus vao 1 chang cu the (nhu khi bam vao cuoc xe Grab)
  const handleSelectSegment = (index: number | null) => {
    setSelectedSegmentIndex(index);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeRouteLayerRef.current) {
      map.removeLayer(activeRouteLayerRef.current);
      activeRouteLayerRef.current = null;
    }

    if (index === null) {
      // Xem toan bo
      drawFullDayRoute(segments, map);
    } else {
      // Focus dung chang duoc chon
      const seg = segments[index];
      if (seg && seg.coordinates.length > 0) {
        const segPolyline = L.polyline(seg.coordinates, {
          color: '#00B14F',
          weight: 8,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        activeRouteLayerRef.current = segPolyline;
        map.fitBounds(segPolyline.getBounds(), { padding: [60, 60] });
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Thanh chon chang di chuyen phong cach Grab */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#00B14F] flex items-center justify-center text-white text-sm">
              <FaMotorcycle />
            </div>
            <span className="font-extrabold text-sm tracking-wide text-emerald-400">
              ĐIỀU HƯỚNG BÁM SÁT MẶT ĐƯỜNG (GRAB / GOOGLE MAPS ROUTING)
            </span>
          </div>

          <button
            onClick={() => handleSelectSegment(null)}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedSegmentIndex === null
                ? 'bg-[#00B14F] text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FaEye className="inline mr-1" /> Xem toàn bộ ({segments.length} chặng)
          </button>
        </div>

        {loadingRoute ? (
          <div className="text-xs text-slate-400 py-2 flex items-center gap-2 animate-pulse">
            <span>Đang nạp dữ liệu định tuyến giao thông từ vệ tinh...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {segments.map((seg, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSegment(idx)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedSegmentIndex === idx
                    ? 'bg-[#00B14F] text-white border-[#00B14F] shadow-md shadow-[#00B14F]/30 scale-102'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700/80'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                  {idx + 1}
                </span>
                <span>({seg.fromIndex + 1}) ➔ ({seg.toIndex + 1})</span>
                <span className="opacity-80 text-[11px] font-normal">
                  ({seg.distanceKm} km • ~{seg.durationMinutes}p)
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedSegmentIndex !== null && segments[selectedSegmentIndex] && (
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-200">
            <div>
              <span className="text-[#00B14F] font-bold">Đang xem Chặng {selectedSegmentIndex + 1}: </span>
              <span className="font-semibold">{segments[selectedSegmentIndex].fromName}</span>
              <span className="text-slate-400 mx-1.5">➔</span>
              <span className="font-semibold">{segments[selectedSegmentIndex].toName}</span>
            </div>
            <div className="flex items-center gap-3 text-[#00B14F] font-bold">
              <span>🛵 {segments[selectedSegmentIndex].distanceKm} km</span>
              <span>⏱️ ~{segments[selectedSegmentIndex].durationMinutes} phút chạy xe</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Canvas */}
      <div
        ref={mapContainerRef}
        className="w-full h-80 sm:h-96 rounded-2xl overflow-hidden border border-slate-300 shadow-md z-10"
      />
    </div>
  );
};
