import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import {
  FaMotorcycle,
  FaCrosshairs,
  FaExpand,
  FaCompress,
  FaSpinner,
  FaMapMarkedAlt,
  FaLayerGroup,
  FaExternalLinkAlt,
  FaDirections,
  FaSatellite
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface RouteMapProps {
  items: ItineraryItem[];
  dayNumber?: number;
  activeLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
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

type MapLayerType = 'google_streets' | 'google_satellite' | 'google_terrain' | 'osm';

export const RouteMap: React.FC<RouteMapProps> = ({
  items,
  dayNumber = 1,
  activeLocationId,
  onSelectLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const activeRouteLayerRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});

  const [mapLayer, setMapLayer] = useState<MapLayerType>('google_streets');
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingGPS, setGettingGPS] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Layer tiles options
  const tileConfigs: Record<MapLayerType, { url: string; maxZoom: number; attribution: string }> = {
    google_streets: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      maxZoom: 20,
      attribution: '&copy; Google Maps',
    },
    google_satellite: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      maxZoom: 20,
      attribution: '&copy; Google Maps Satellite',
    },
    google_terrain: {
      url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
      maxZoom: 20,
      attribution: '&copy; Google Maps Terrain',
    },
    osm: {
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    },
  };

  // Khoi tao va cap nhat ban do
  useEffect(() => {
    if (!mapContainerRef.current || items.length === 0) return;

    // Don dep map instance cu neu co de tranh loi leaflet id
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

    // Tao layer tile theo lua chon
    const config = tileConfigs[mapLayer];
    const tileLayer = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(map);
    activeTileLayerRef.current = tileLayer;

    // Resize invalidateSize
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 250);

    // Ve Markers va Route
    renderRoute(map, userLocation);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [items, mapLayer, userLocation, isFullscreen]);

  // Doi Tile Layer khi nguoi dung chon che do ban do
  const handleLayerChange = (layer: MapLayerType) => {
    setMapLayer(layer);
  };

  // Ve Marker va OSRM Route
  const renderRoute = async (map: L.Map, currentUserLoc: { lat: number; lng: number } | null) => {
    setLoadingRoute(true);
    markersRef.current = {};

    const points: Array<{
      id?: number;
      lat: number;
      lng: number;
      name: string;
      isUser?: boolean;
      time_slot?: string;
      address?: string;
      category?: string;
      cost?: number;
    }> = [];

    // Neu co GPS nguoi dung
    if (currentUserLoc && dayNumber === 1) {
      points.push({
        lat: currentUserLoc.lat,
        lng: currentUserLoc.lng,
        name: 'Vị trí của bạn (Điểm xuất phát)',
        isUser: true,
        address: 'Tọa độ GPS thiết bị thực tế',
      });
    }

    items.forEach((item) => {
      points.push({
        id: item.location.id,
        lat: item.location.latitude,
        lng: item.location.longitude,
        name: item.location.name,
        time_slot: item.time_slot,
        address: item.location.address,
        category: item.location.category,
        cost: item.location.avg_cost_vnd,
      });
    });

    // 1. Ve Google Maps Style Pin Markers
    points.forEach((p, idx) => {
      const isStart = p.isUser;
      const markerNumber = currentUserLoc && dayNumber === 1 ? idx : idx + 1;

      // Google Pin SVG custom HTML
      const markerHtml = isStart
        ? `
          <div class="relative flex items-center justify-center">
            <span class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-ping"></span>
            <div style="background: #1A73E8; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; color: white; font-size: 10px;">
            </div>
          </div>
        `
        : `
          <div style="position: relative; width: 34px; height: 42px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transition: transform 0.2s;" class="hover:scale-110">
            <svg viewBox="0 0 384 512" width="34" height="42" fill="#EA4335">
              <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
            </svg>
            <div style="position: absolute; top: 12px; left: 0; width: 34px; text-align: center; color: white; font-weight: 900; font-size: 13px; font-family: sans-serif;">
              ${markerNumber}
            </div>
          </div>
        `;

      const customIcon = L.divIcon({
        className: 'google-map-marker',
        html: markerHtml,
        iconSize: [34, 42],
        iconAnchor: isStart ? [11, 11] : [17, 42],
        popupAnchor: [0, -38],
      });

      const marker = L.marker([p.lat, p.lng], { icon: customIcon }).addTo(map);

      if (p.id) {
        markersRef.current[p.id] = marker;
      }

      marker.bindPopup(`
        <div style="font-family: inherit; width: 220px; padding: 2px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
            <span style="background: #EA4335; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">
              Điểm ${markerNumber}
            </span>
            ${p.time_slot ? `<span style="color: #1A73E8; font-weight: 700; font-size: 11px;">⏰ ${p.time_slot}</span>` : ''}
          </div>
          <div style="font-weight: 800; font-size: 13px; color: #1e293b; line-height: 1.3; margin-bottom: 4px;">
            ${p.name}
          </div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${p.address || ''}</div>
          ${p.cost ? `<div style="font-size: 11px; font-weight: 700; color: #059669;">Chi phí: ${p.cost.toLocaleString('vi-VN')}đ</div>` : ''}
          <div style="margin-top: 8px; pt: 4px; border-top: 1px solid #f1f5f9;">
            <a 
              href="https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}" 
              target="_blank" 
              rel="noreferrer"
              style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #1A73E8; font-weight: 700; text-decoration: none;"
            >
              Mở trên Google Maps ↗
            </a>
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (p.id && onSelectLocation) {
          onSelectLocation(p.id);
        }
      });
    });

    // 2. Ve tuyen duong OSRM (Google Blue navigation route)
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

    if (activeRouteLayerRef.current) {
      map.removeLayer(activeRouteLayerRef.current);
    }

    const allCoords = segList.flatMap((s) => s.coordinates);
    if (allCoords.length > 0) {
      // Duong Google Maps mau xanh duong dac trung (#4285F4)
      const fullPolyline = L.polyline(allCoords, {
        color: '#1A73E8',
        weight: 6,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      activeRouteLayerRef.current = fullPolyline;
      map.fitBounds(fullPolyline.getBounds(), { padding: [50, 50] });
    } else {
      const fallbackCoords: [number, number][] = points.map((p) => [p.lat, p.lng]);
      const fallbackLine = L.polyline(fallbackCoords, { color: '#1A73E8', weight: 4, dashArray: '6, 6' }).addTo(map);
      activeRouteLayerRef.current = fallbackLine;
      map.fitBounds(fallbackLine.getBounds(), { padding: [50, 50] });
    }
  };

  // FlyTo marker khi activeLocationId thay doi
  useEffect(() => {
    if (activeLocationId && markersRef.current[activeLocationId] && mapInstanceRef.current) {
      const marker = markersRef.current[activeLocationId];
      const latLng = marker.getLatLng();
      mapInstanceRef.current.flyTo(latLng, 16, { duration: 1.2 });
      marker.openPopup();
    }
  }, [activeLocationId]);

  // Lay toa do GPS thuc te
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ Geolocation GPS');
      return;
    }

    setGettingGPS(true);
    toast('Đang dò toạ độ GPS vị trí thực tế của bạn...', { icon: '🛰️' });

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setGettingGPS(false);
        toast.success(`Đã định vị vị trí của bạn (${latitude.toFixed(4)}, ${longitude.toFixed(4)})! Lộ trình đã được vẽ từ đây.`);
      },
      (err) => {
        setGettingGPS(false);
        console.error(err);
        toast.error('Không thể lấy vị trí. Hãy bật Cho phép vị trí trong trình duyệt.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Chon tung chang xem chi tiet
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
        const full = L.polyline(allCoords, { color: '#1A73E8', weight: 6, opacity: 0.9 }).addTo(map);
        activeRouteLayerRef.current = full;
        map.fitBounds(full.getBounds(), { padding: [50, 50] });
      }
    } else {
      const seg = segments[index];
      if (seg && seg.coordinates.length > 0) {
        const segLine = L.polyline(seg.coordinates, { color: '#EA4335', weight: 7, opacity: 1.0 }).addTo(map);
        activeRouteLayerRef.current = segLine;
        map.fitBounds(segLine.getBounds(), { padding: [60, 60] });
      }
    }
  };

  // Mo dan duong truc tiep tren Google Maps App / Web
  const handleOpenGoogleMapsNavigation = () => {
    if (items.length === 0) return;

    let origin = '';
    if (userLocation) {
      origin = `${userLocation.lat},${userLocation.lng}`;
    } else {
      origin = `${items[0].location.latitude},${items[0].location.longitude}`;
    }

    const destination = `${items[items.length - 1].location.latitude},${items[items.length - 1].location.longitude}`;
    
    // Cac waypoint trung gian
    const waypointsArr = items
      .slice(userLocation ? 0 : 1, items.length - 1)
      .map((it) => `${it.location.latitude},${it.location.longitude}`);
    
    const waypointsStr = waypointsArr.length > 0 ? `&waypoints=${waypointsArr.join('|')}` : '';

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsStr}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const totalDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalDuration = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div
      className={`relative bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-700/60 transition-all z-0 ${
        isFullscreen ? 'fixed inset-0 z-[80] rounded-none' : 'w-full h-[520px] sm:h-[580px]'
      }`}
    >
      {/* Ban do Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Thanh Control Google Maps & Tien ich phia tren */}
      <div className="absolute top-3 left-3 right-3 z-[20] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Switcher (Google Maps / Ve tinh / Dia hinh) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-200 flex items-center gap-1">
          <button
            onClick={() => handleLayerChange('google_streets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'google_streets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🗺️ Google Maps
          </button>
          <button
            onClick={() => handleLayerChange('google_satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'google_satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🛰️ Vệ tinh
          </button>
          <button
            onClick={() => handleLayerChange('google_terrain')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'google_terrain'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            ⛰️ Địa hình
          </button>
        </div>

        {/* Nút GPS, Mở Google Maps thật & Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Nút mở Google Maps Native App Navigation */}
          <button
            onClick={handleOpenGoogleMapsNavigation}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow-lg transition cursor-pointer"
            title="Mở toàn bộ lộ trình trên Google Maps để bật chế độ dẫn đường giọng nói"
          >
            <FaDirections className="text-sm" />
            <span className="hidden sm:inline">Dẫn đường</span> Google Maps
          </button>

          {/* Nút GPS */}
          <button
            onClick={handleGetCurrentLocation}
            disabled={gettingGPS}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-bold p-2.5 rounded-2xl shadow-lg border border-slate-200 transition cursor-pointer"
            title="Định vị GPS thực tế của bạn"
          >
            <FaCrosshairs className={`text-blue-600 ${gettingGPS ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Toàn màn hình */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-bold p-2.5 rounded-2xl shadow-lg border border-slate-200 transition cursor-pointer"
            title="Toàn màn hình"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Loading Bar khi dang tinh toan OSRM */}
      {loadingRoute && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[20] bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-sm border border-slate-700">
          <FaSpinner className="animate-spin text-blue-400" />
          <span>Google Route Engine đang vẽ đường cong thực tế...</span>
        </div>
      )}

      {/* Thanh Thống Kê Tổng Quãng Đường & Các Chặng Di Chuyển (Grab / Google Navigation Style) */}
      <div className="absolute bottom-3 left-3 right-3 z-[20] pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-200/90 space-y-2.5 max-w-4xl mx-auto">
          {/* Tổng quan cự ly */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">
                <FaMotorcycle />
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lộ trình Ngày {dayNumber}</p>
                <p className="text-sm sm:text-base font-black text-slate-900">
                  Tổng {Math.round(totalDistance * 10) / 10} km • ~{totalDuration} phút di chuyển
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSelectSegment(null)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedSegmentIndex === null
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Xem toàn lộ trình
            </button>
          </div>

          {/* Danh sách các chặng nhỏ (Segments) bấm vào để zoom */}
          {segments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {segments.map((seg, i) => (
                <button
                  key={i}
                  onClick={() => handleSelectSegment(i)}
                  className={`flex-shrink-0 text-left px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                    selectedSegmentIndex === i
                      ? 'bg-red-50 border-red-500 text-red-900 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span className="w-4 h-4 rounded-full bg-slate-300 text-[10px] text-slate-700 flex items-center justify-center font-black">
                      {i + 1}
                    </span>
                    <span className="truncate max-w-[130px]">{seg.toName}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {seg.distanceKm} km • ~{seg.durationMinutes} ph
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
