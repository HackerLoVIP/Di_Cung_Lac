import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import { FaMotorcycle, FaRoute, FaCrosshairs, FaExpand, FaCompass, FaSpinner } from 'react-icons/fa';
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
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);
  const [gettingGPS, setGettingGPS] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // 1. Khoi tao Ban do Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || items.length === 0) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const firstLoc = items[0].location;
    // Khoi tao ban do
    const map = L.map(mapContainerRef.current).setView([firstLoc.latitude, firstLoc.longitude], 12);
    mapInstanceRef.current = map;

    // Lop ban do CartoDB Positron cuc ky sang sua, sac net, chuan giao dien cong nghe hien dai
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      maxZoom: 19,
    }).addTo(map);

    // 2. Ve cac Markers dia diem lich trinh
    renderMarkersAndRoutes(map, userLocation);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items, userLocation]);

  // Ham ve Marker va goi OSRM tim duong that bam sat mat duong
  const renderMarkersAndRoutes = async (map: L.Map, currentUserLoc: { lat: number; lng: number } | null) => {
    setLoadingRoute(true);

    // Danh sach cac moc toa do can ve
    const points: Array<{ lat: number; lng: number; name: string; isUser?: boolean; time_slot?: string; address?: string }> = [];

    // Neu da co GPS nguoi dung (vi du dang o TP.HCM), them vao lam Diem bat dau (Moc 0)
    if (currentUserLoc && dayNumber === 1) {
      points.push({
        lat: currentUserLoc.lat,
        lng: currentUserLoc.lng,
        name: 'Vị trí thực tế của bạn (Điểm xuất phát)',
        isUser: true,
        address: 'Định vị GPS thực tế từ thiết bị của bạn',
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

    // Dat cac Marker len ban do
    points.forEach((p, idx) => {
      let iconHtml = '';
      if (p.isUser) {
        iconHtml = `
          <div style="
            background: #ef4444;
            color: white;
            font-weight: 800;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 14px rgba(239,68,68,0.5);
            font-size: 14px;
            animation: pulse 1.5s infinite;
          ">
            📍
          </div>
        `;
      } else {
        const markerNum = currentUserLoc && dayNumber === 1 ? idx : idx + 1;
        iconHtml = `
          <div style="
            background: #00B14F;
            color: white;
            font-weight: 800;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.35);
            font-size: 13px;
          ">
            ${markerNum}
          </div>
        `;
      }

      const customIcon = L.divIcon({
        className: 'route-marker',
        html: iconHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      L.marker([p.lat, p.lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family: inherit; width: 220px; padding: 2px;">
            <div style="font-weight: 800; font-size: 14px; color: ${p.isUser ? '#ef4444' : '#1e293b'}; margin-bottom: 4px;">
              ${p.isUser ? '📍 ' : `(${idx}) `}${p.name}
            </div>
            ${p.time_slot ? `<div style="font-size: 11px; color: #00B14F; font-weight: 700; margin-bottom: 2px;">⏰ Giờ ghé: ${p.time_slot}</div>` : ''}
            <div style="font-size: 11px; color: #64748b;">📍 ${p.address || ''}</div>
          </div>
        `);
    });

    // Goi OSRM de lay tuyen duong di that bam sat mat duong
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
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      activeRouteLayerRef.current = fullPolyline;
      map.fitBounds(fullPolyline.getBounds(), { padding: [50, 50] });
    }
  };

  // Ham bat dinh vi GPS thuc te tu trinh duyet
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS');
      return;
    }

    setGettingGPS(true);
    toast('Đang định vị tọa độ thực tế của bạn...', { icon: '🛰️' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGettingGPS(false);
        toast.success(`Đã xác định vị trí thực tế của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)})! Đang vẽ tuyến đường từ đây đến điểm du lịch.`);
      },
      (err) => {
        setGettingGPS(false);
        console.error(err);
        toast.error('Không thể lấy vị trí. Vui lòng cho phép quyền truy cập vị trí trên trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Chon chang di chuyen de zoom vao
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
        const full = L.polyline(allCoords, { color: '#00B14F', weight: 6, opacity: 0.85 }).addTo(map);
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
      {/* Thanh dieu huong Navigation Panel kieu Grab */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00B14F] flex items-center justify-center text-white text-lg shadow-md shadow-[#00B14F]/40">
              <FaMotorcycle />
            </div>
            <div>
              <h4 className="font-black text-sm tracking-wide text-emerald-400">
                ĐIỀU HƯỚNG THEO MẶT ĐƯỜNG (GRAB / GOOGLE MAPS ROUTING)
              </h4>
              <p className="text-[11px] text-slate-400">
                Tuyến đường uốn lượn theo từng con phố thực tế, đo khoảng cách và thời gian chạy xe chuẩn xác
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Nut bat GPS thuc te */}
            <button
              onClick={handleGetCurrentLocation}
              disabled={gettingGPS}
              className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-600/30 cursor-pointer disabled:opacity-50"
            >
              {gettingGPS ? <FaSpinner className="animate-spin" /> : <FaCrosshairs />}
              {userLocation ? 'Đã bật GPS thực tế' : 'Lấy vị trí GPS của tôi'}
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

            {/* Nut phong to man hinh */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 p-2.5 rounded-xl transition-colors cursor-pointer"
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              <FaExpand />
            </button>
          </div>
        </div>

        {/* Danh sach cac chang di chuyen */}
        {loadingRoute ? (
          <div className="text-xs text-slate-400 py-2 flex items-center gap-2 animate-pulse">
            <FaSpinner className="animate-spin text-emerald-400" />
            <span>Đang nạp dữ liệu điều hướng giao thông thực tế...</span>
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
                <span className="max-w-[140px] truncate">{seg.fromName}</span>
                <span>➔</span>
                <span className="max-w-[140px] truncate">{seg.toName}</span>
                <span className="bg-black/20 px-2 py-0.5 rounded-md text-[11px] font-semibold text-emerald-300">
                  {seg.distanceKm} km • ~{seg.durationMinutes}p
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Thong tin chang dang chon */}
        {selectedSegmentIndex !== null && segments[selectedSegmentIndex] && (
          <div className="bg-slate-800/90 border border-slate-700 p-3.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-200">
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

      {/* Map Canvas: Chieu cao 560px to ro, hoanh trang */}
      <div
        ref={mapContainerRef}
        className={`w-full rounded-3xl overflow-hidden border-2 border-slate-200 shadow-xl z-10 ${
          isFullscreen ? 'flex-1 min-h-[500px]' : 'h-[500px] sm:h-[560px]'
        }`}
      />
    </div>
  );
};
