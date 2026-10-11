import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import { FaMotorcycle, FaCrosshairs, FaExpand, FaSpinner, FaMapMarkedAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';

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

  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingGPS, setGettingGPS] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (!mapContainerRef.current || items.length === 0) return;

    // Fix loi React StrictMode / Re-render: Don dep Leaflet instance cu
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const firstLoc = items[0].location;
    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([firstLoc.latitude, firstLoc.longitude], 13);
    mapInstanceRef.current = map;

    // Su dung OpenStreetMap tile chuan nhat, ho tro SSL, khong bi chan tile
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Goi invalidateSize de tranh loi ban do bi xam hoac khong full vien
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 300);

    // Ve Marker va Route
    renderRoute(map, userLocation);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items, userLocation, isFullscreen]);

  const renderRoute = async (map: L.Map, currentUserLoc: { lat: number; lng: number } | null) => {
    setLoadingRoute(true);

    const points: Array<{ lat: number; lng: number; name: string; isUser?: boolean; time_slot?: string; address?: string }> = [];

    // Neu da co GPS thuc te cua nguoi dung, dat lam diem xuat phat (Diem 0)
    if (currentUserLoc && dayNumber === 1) {
      points.push({
        lat: currentUserLoc.lat,
        lng: currentUserLoc.lng,
        name: 'Vị trí thực tế của bạn (Điểm xuất phát)',
        isUser: true,
        address: 'Tọa độ GPS thiết bị của bạn',
      });
    }

    items.forEach((item) => {
      points.push({
        lat: item.location.latitude,
        lng: item.location.longitude,
        name: item.location.name,
        time_slot: item.time_slot,
        address: item.location.address,
      });
    });

    // Dat Markers
    points.forEach((p, idx) => {
      const isStart = p.isUser;
      const markerText = isStart ? '📍' : `${currentUserLoc && dayNumber === 1 ? idx : idx + 1}`;
      const bgColor = isStart ? '#ef4444' : '#00B14F';

      const customIcon = L.divIcon({
        className: 'route-marker-icon',
        html: `
          <div style="
            background: ${bgColor};
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
            ${markerText}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      L.marker([p.lat, p.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; width: 200px;">
            <div style="font-weight: 800; font-size: 13px; color: #1e293b; margin-bottom: 2px;">
              ${isStart ? '📍 ' : `(${idx}) `}${p.name}
            </div>
            ${p.time_slot ? `<div style="font-size: 11px; color: #00B14F; font-weight: 700; margin-bottom: 2px;">⏰ ${p.time_slot}</div>` : ''}
            <div style="font-size: 11px; color: #64748b;">${p.address || ''}</div>
          </div>
        `);
    });

    // Lay Route tu OSRM
    const segList: RouteSegment[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.routes && data.routes.length > 0) {
          const r = data.routes[0];
          const coords: [number, number][] = r.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);

          segList.push({
            fromIndex: i,
            toIndex: i + 1,
            fromName: from.name,
            toName: to.name,
            distanceKm: Math.round((r.distance / 1000) * 10) / 10,
            durationMinutes: Math.round(r.duration / 60),
            coordinates: coords,
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    setSegments(segList);
    setLoadingRoute(false);

    // Ve toan bo tuyen duong
    if (activeRouteLayerRef.current) {
      map.removeLayer(activeRouteLayerRef.current);
    }

    const allCoords = segList.flatMap((s) => s.coordinates);
    if (allCoords.length > 0) {
      const fullPolyline = L.polyline(allCoords, {
        color: '#00B14F',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      activeRouteLayerRef.current = fullPolyline;
      map.fitBounds(fullPolyline.getBounds(), { padding: [50, 50] });
    } else {
      // Fallback neu OSRM timeout: noi thang cac toa do
      const fallbackCoords: [number, number][] = points.map((p) => [p.lat, p.lng]);
      const fallbackLine = L.polyline(fallbackCoords, { color: '#00B14F', weight: 4, dashArray: '6, 6' }).addTo(map);
      activeRouteLayerRef.current = fallbackLine;
      map.fitBounds(fallbackLine.getBounds(), { padding: [50, 50] });
    }
  };

  // Lay toa do GPS thuc te tu thiet bi
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ Geolocation GPS');
      return;
    }

    setGettingGPS(true);
    toast('Đang dò tìm tọa độ GPS thực tế của bạn...', { icon: '🛰️' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGettingGPS(false);
        toast.success(`Đã nhận diện vị trí thực tế của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)})! Tuyến đường sẽ tính từ đây.`);
      },
      (err) => {
        setGettingGPS(false);
        console.error(err);
        toast.error('Không thể lấy vị trí. Hãy bấm "Cho phép" khi trình duyệt hỏi quyền truy cập vị trí.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Chon chang zoom
  const handleSelectSegment = (index: number | null) => {
    setSelectedSegmentIndex(index);
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (activeRouteLayerRef.current) {
      map.removeLayer(activeRouteLayerRef.current);
      activeRouteLayerRef.current = null;
    }

    if (index === null) {
      const allCoords = segments.flatMap((s) => s.coordinates);
      if (allCoords.length > 0) {
        const full = L.polyline(allCoords, { color: '#00B14F', weight: 6, opacity: 0.9 }).addTo(map);
        activeRouteLayerRef.current = full;
        map.fitBounds(full.getBounds(), { padding: [50, 50] });
      }
    } else {
      const seg = segments[index];
      if (seg && seg.coordinates.length > 0) {
        const segLine = L.polyline(seg.coordinates, {
          color: '#00B14F',
          weight: 8,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);

        activeRouteLayerRef.current = segLine;
        map.fitBounds(segLine.getBounds(), { padding: [60, 60] });
      }
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6 flex flex-col' : ''}`}>
      {/* Control Panel kieu Grab */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00B14F] flex items-center justify-center text-white text-lg shadow-md shadow-[#00B14F]/40">
              <FaMotorcycle />
            </div>
            <div>
              <h4 className="font-black text-sm tracking-wide text-emerald-400">
                BẢN ĐỒ ĐIỀU HƯỚNG BÁM ĐƯỜNG (GRAB / GOOGLE MAPS ROUTING)
              </h4>
              <p className="text-[11px] text-slate-400">
                Hệ thống tự động vẽ đường uốn lượn theo từng góc phố và đo khoảng cách chuẩn xác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Nut bat GPS */}
            <button
              onClick={handleGetCurrentLocation}
              disabled={gettingGPS}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              {gettingGPS ? <FaSpinner className="animate-spin" /> : <FaCrosshairs />}
              {userLocation ? 'Đã bật GPS vị trí của bạn' : 'Lấy vị trí GPS của tôi'}
            </button>

            {/* Nut xem toan bo */}
            <button
              onClick={() => handleSelectSegment(null)}
              className={`text-xs px-3.5 py-2 rounded-xl font-bold transition-all cursor-pointer ${
                selectedSegmentIndex === null
                  ? 'bg-[#00B14F] text-white shadow-md shadow-[#00B14F]/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Xem toàn cảnh ({segments.length} chặng)
            </button>

            {/* Nut phong to */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              <FaExpand />
            </button>
          </div>
        </div>

        {/* Danh sach cac chang */}
        {loadingRoute ? (
          <div className="text-xs text-slate-400 py-2 flex items-center gap-2 animate-pulse">
            <FaSpinner className="animate-spin text-emerald-400" />
            <span>Đang vẽ tuyến đường di chuyển thực tế từ vệ tinh...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {segments.map((seg, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectSegment(idx)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedSegmentIndex === idx
                    ? 'bg-[#00B14F] text-white border-[#00B14F] shadow-lg shadow-[#00B14F]/40 scale-102'
                    : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                  {idx + 1}
                </span>
                <span className="max-w-[130px] truncate">{seg.fromName}</span>
                <span>➔</span>
                <span className="max-w-[130px] truncate">{seg.toName}</span>
                <span className="bg-black/25 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-300">
                  {seg.distanceKm} km • ~{seg.durationMinutes}p
                </span>
              </button>
            ))}
          </div>
        )}

        {selectedSegmentIndex !== null && segments[selectedSegmentIndex] && (
          <div className="bg-slate-800/95 border border-slate-700 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-200">
            <div>
              <span className="text-[#00B14F] font-bold">Chặng {selectedSegmentIndex + 1}: </span>
              <span className="font-extrabold text-white">{segments[selectedSegmentIndex].fromName}</span>
              <span className="text-slate-400 mx-1.5">➔</span>
              <span className="font-extrabold text-white">{segments[selectedSegmentIndex].toName}</span>
            </div>
            <div className="flex items-center gap-4 text-emerald-400 font-extrabold text-sm">
              <span>🛵 Quãng đường: {segments[selectedSegmentIndex].distanceKm} km</span>
              <span>⏱️ Thời gian: ~{segments[selectedSegmentIndex].durationMinutes} phút</span>
            </div>
          </div>
        )}
      </div>

      {/* Map Canvas: Cao 560px, rounded-3xl dep nhu ung dung hien dai */}
      <div
        ref={mapContainerRef}
        className={`w-full rounded-3xl overflow-hidden border border-slate-300 shadow-xl bg-slate-100 z-0 ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[520px] sm:h-[580px]'
        }`}
      />
    </div>
  );
};
