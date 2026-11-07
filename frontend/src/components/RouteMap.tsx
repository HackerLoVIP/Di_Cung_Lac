import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { ItineraryItem } from '../types';
import {
  FaMotorcycle,
  FaCrosshairs,
  FaExpand,
  FaCompress,
  FaSpinner,
  FaDirections,
} from 'react-icons/fa';
import toast from 'react-hot-toast';

interface RouteMapProps {
  items: ItineraryItem[];
  dayNumber?: number;
  activeLocationId?: number | null;
  onSelectLocation?: (locationId: number) => void;
  onOriginChange?: (lat: number, lng: number, addressLabel: string) => void;
  className?: string;
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

const TILE_CONFIGS: Record<MapLayerType, { url: string; maxZoom: number; attribution: string }> = {
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

export const RouteMap: React.FC<RouteMapProps> = ({
  items,
  dayNumber = 1,
  activeLocationId,
  onSelectLocation,
  onOriginChange,
  className,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeTileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const highlightLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const renderIdRef = useRef<number>(0);

  const [mapLayer, setMapLayer] = useState<MapLayerType>('google_streets');
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingGPS, setGettingGPS] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Chữ ký ổn định của danh sách điểm dừng để tránh vẽ lại bản đồ khi chỉ click chọn vị trí
  const itemsSignature = useMemo(() => {
    const base = items
      .map(
        (it, idx) =>
          `${idx}_${it.id}_${it.location?.id}_${Number(it.location?.latitude || 0).toFixed(5)}_${Number(
            it.location?.longitude || 0
          ).toFixed(5)}_${it.location?.name || ''}`
      )
      .join('|');
    const gpsKey = userLocation ? `${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}` : 'no_gps';
    return `${dayNumber}::${base}::${gpsKey}`;
  }, [items, dayNumber, userLocation]);

  // Reverse geocode tọa độ sang địa chỉ tiếng Việt thực tế
  const reverseGeocodeLabel = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17&accept-language=vi`
      );
      if (res.ok) {
        const data = await res.json();
        const addr = data.address;
        const houseNumber = addr?.house_number || '';
        const road = addr?.road || '';
        const roadPart = [houseNumber, road].filter(Boolean).join(' ');
        const suburb = addr?.suburb || addr?.quarter || addr?.neighbourhood || addr?.village || '';
        const district = addr?.city_district || addr?.district || addr?.county || addr?.town || '';
        const city = addr?.city || addr?.state || addr?.province || '';
        const parts = [roadPart, suburb, district, city].filter(Boolean);
        if (parts.length > 0) return parts.join(', ');
      }
    } catch {
      // ignore network error
    }
    return `Tọa độ (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  // 1. Khởi tạo instance bản đồ Leaflet DUY NHẤT 1 LẦN khi mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if ((mapContainerRef.current as any)._leaflet_id) {
      (mapContainerRef.current as any)._leaflet_id = null;
    }

    const initLat = items[0]?.location?.latitude || 10.7769;
    const initLng = items[0]?.location?.longitude || 106.7009;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([initLat, initLng], 13);

    mapInstanceRef.current = map;

    const config = TILE_CONFIGS[mapLayer];
    activeTileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(map);

    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    highlightLayerGroupRef.current = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = L.layerGroup().addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      renderIdRef.current += 1;
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Đổi lớp nền bản đồ (Google Maps / Vệ tinh / Địa hình) mượt mà không hủy map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeTileLayerRef.current) {
      map.removeLayer(activeTileLayerRef.current);
    }
    const config = TILE_CONFIGS[mapLayer];
    activeTileLayerRef.current = L.tileLayer(config.url, {
      maxZoom: config.maxZoom,
      attribution: config.attribution,
    }).addTo(map);
  }, [mapLayer]);

  // 3. Cập nhật kích thước khung bản đồ khi bật/tắt Toàn màn hình
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // 4. Vẽ Markers và tuyến đường OSRM chỉ khi danh sách điểm dừng thực sự thay đổi
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    const routeGroup = routeLayerGroupRef.current;
    const highlightGroup = highlightLayerGroupRef.current;
    if (!map || !markersGroup || !routeGroup || !highlightGroup) return;

    renderIdRef.current += 1;
    const currentRenderId = renderIdRef.current;

    markersGroup.clearLayers();
    routeGroup.clearLayers();
    highlightGroup.clearLayers();
    markersRef.current = {};
    setSelectedSegmentIndex(null);

    if (items.length === 0) {
      setSegments([]);
      setLoadingRoute(false);
      return;
    }

    const drawRouteAndMarkers = async () => {
      setLoadingRoute(true);

      const points: Array<{
        id?: number;
        lat: number;
        lng: number;
        name: string;
        isOrigin?: boolean;
        time_slot?: string;
        address?: string;
        category?: string;
        cost?: number;
      }> = [];

      items.forEach((item, index) => {
        const isDepartureItem =
          index === 0 &&
          (item.location.name.toLowerCase().includes('điểm xuất phát') ||
            item.location.name.toLowerCase().includes('khởi hành'));
        const useLiveGPS = isDepartureItem && userLocation;
        points.push({
          id: item.location.id,
          lat: useLiveGPS ? userLocation.lat : item.location.latitude,
          lng: useLiveGPS ? userLocation.lng : item.location.longitude,
          name: item.location.name,
          isOrigin: isDepartureItem,
          time_slot: item.time_slot,
          address: useLiveGPS
            ? `Tọa độ GPS thiết bị thực tế (${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)})`
            : item.location.address,
          category: item.location.category,
          cost: item.location.avg_cost_vnd,
        });
      });

      // Vẽ các ghim đánh số 1, 2, 3...
      points.forEach((p, idx) => {
        const markerNumber = idx + 1;
        const pinColor = p.isOrigin ? '#1A73E8' : p.category === 'hotel' ? '#7C3AED' : '#EA4335';

        const markerHtml = `
          <div style="position: relative; width: 34px; height: 42px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); transition: transform 0.2s;" class="hover:scale-110">
            <svg viewBox="0 0 384 512" width="34" height="42" fill="${pinColor}">
              <path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/>
            </svg>
            <div style="position: absolute; top: 10px; left: 0; width: 34px; text-align: center; color: white; font-weight: 900; font-size: 13px; font-family: sans-serif;">
              ${markerNumber}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'google-map-marker',
          html: markerHtml,
          iconSize: [34, 42],
          iconAnchor: [17, 42],
          popupAnchor: [0, -38],
        });

        const marker = L.marker([p.lat, p.lng], {
          icon: customIcon,
          draggable: Boolean(p.isOrigin),
        }).addTo(markersGroup);

        if (p.isOrigin) {
          marker.on('dragend', async () => {
            const newPos = marker.getLatLng();
            setUserLocation({ lat: newPos.lat, lng: newPos.lng });
            const label = await reverseGeocodeLabel(newPos.lat, newPos.lng);
            if (onOriginChange) {
              onOriginChange(newPos.lat, newPos.lng, label);
            }
            toast.success(`Đã cập nhật Điểm số 1 tại: ${label}`);
          });
        }

        if (p.id !== undefined) {
          markersRef.current[p.id] = marker;
        }

        marker.bindPopup(`
          <div style="font-family: inherit; width: 230px; padding: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
              <span style="background: ${pinColor}; color: white; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 6px;">
                Vị trí số ${markerNumber}
              </span>
              ${p.time_slot ? `<span style="color: #1A73E8; font-weight: 700; font-size: 11px;">⏰ ${p.time_slot}</span>` : ''}
            </div>
            <div style="font-weight: 800; font-size: 13px; color: #1e293b; line-height: 1.3; margin-bottom: 4px;">
              ${p.name}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">📍 ${p.address || ''}</div>
            ${p.cost ? `<div style="font-size: 11px; font-weight: 700; color: #059669;">Chi phí: ${p.cost.toLocaleString('vi-VN')}đ</div>` : ''}
            <div style="margin-top: 8px; padding-top: 4px; border-top: 1px solid #f1f5f9;">
              <a 
                href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  p.isOrigin ? `${p.lat},${p.lng}` : `${p.name.split('(')[0].trim()}, ${p.address || ''}`
                )}" 
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
          if (p.id !== undefined && onSelectLocation) {
            onSelectLocation(p.id);
          }
        });
      });

      // Tính toán đường đi thực tế qua OSRM
      const segList: RouteSegment[] = [];

      for (let i = 0; i < points.length - 1; i++) {
        if (currentRenderId !== renderIdRef.current || !mapInstanceRef.current) return;
        const from = points[i];
        const to = points[i + 1];

        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (currentRenderId !== renderIdRef.current || !mapInstanceRef.current) return;
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
        } catch {
          // fallback直線 nếu OSRM nghẽn mạng
          segList.push({
            fromIndex: i,
            toIndex: i + 1,
            fromName: from.name,
            toName: to.name,
            distanceKm: 0,
            durationMinutes: 0,
            coordinates: [
              [from.lat, from.lng],
              [to.lat, to.lng],
            ],
          });
        }
      }

      // Kiểm tra lại một lần nữa sau khi tất cả lệnh await hoàn tất
      if (
        currentRenderId !== renderIdRef.current ||
        !mapInstanceRef.current ||
        !routeLayerGroupRef.current
      ) {
        return;
      }

      setSegments(segList);
      setLoadingRoute(false);
      routeLayerGroupRef.current.clearLayers();

      const allCoords = segList.flatMap((s) => s.coordinates);
      if (allCoords.length > 0) {
        const fullPolyline = L.polyline(allCoords, {
          color: '#1A73E8',
          weight: 6,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeLayerGroupRef.current);

        // Chỉ tự động fitBounds toàn lộ trình khi người dùng chưa bấm chọn ghim cụ thể
        if (!activeLocationId) {
          const bounds = fullPolyline.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } else if (points.length > 0) {
        const fallbackCoords: [number, number][] = points.map((p) => [p.lat, p.lng]);
        const fallbackLine = L.polyline(fallbackCoords, {
          color: '#1A73E8',
          weight: 4,
          dashArray: '6, 6',
        }).addTo(routeLayerGroupRef.current);

        if (!activeLocationId) {
          const bounds = fallbackLine.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      }
    };

    drawRouteAndMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSignature]);

  // 5. Khi người dùng bấm chọn Vị trí 1, 2, 3... (ở Timeline hoặc dưới đáy bản đồ) -> Bay mượt tới đúng vị trí đó và giữ nguyên camera
  useEffect(() => {
    if (
      activeLocationId !== null &&
      activeLocationId !== undefined &&
      markersRef.current[activeLocationId] &&
      mapInstanceRef.current
    ) {
      const marker = markersRef.current[activeLocationId];
      const latLng = marker.getLatLng();
      mapInstanceRef.current.flyTo(latLng, 16, { duration: 1.0 });
      marker.openPopup();
    }
  }, [activeLocationId]);

  // Định vị GPS thực tế của thiết bị cho Vị trí số 1
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt không hỗ trợ Geolocation GPS');
      return;
    }

    setGettingGPS(true);
    toast('Đang dò tọa độ GPS vị trí thực tế của bạn...', { icon: '🛰️' });

    const onSuccess = async (pos: GeolocationPosition) => {
      const { latitude, longitude } = pos.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      setGettingGPS(false);

      const label = await reverseGeocodeLabel(latitude, longitude);
      if (onOriginChange) {
        onOriginChange(latitude, longitude, label);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([latitude, longitude], 16, { duration: 1.0 });
      }
      toast.success(`Đã định vị Điểm số 1 tại: ${label}`);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      () => {
        // Fallback sang chế độ Wi-Fi / IP nếu thiết bị không có chip GPS phần cứng
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err) => {
            setGettingGPS(false);
            console.error(err);
            toast.error('Không thể lấy vị trí tự động. Bạn có thể gõ địa chỉ hoặc kéo thả Ghim số 1 trên bản đồ!');
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 30000 }
    );
  };

  // Tô nổi bật chặng đường hoặc xem toàn lộ trình
  const handleSelectSegment = (index: number | null, shouldFitBounds: boolean = true) => {
    setSelectedSegmentIndex(index);
    const map = mapInstanceRef.current;
    const highlightGroup = highlightLayerGroupRef.current;
    if (!map || !highlightGroup) return;

    highlightGroup.clearLayers();

    if (index === null) {
      if (shouldFitBounds) {
        const allCoords = segments.flatMap((s) => s.coordinates);
        if (allCoords.length > 0) {
          const tempPoly = L.polyline(allCoords);
          const bounds = tempPoly.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      }
    } else {
      const seg = segments[index];
      if (seg && seg.coordinates.length > 0) {
        const segLine = L.polyline(seg.coordinates, {
          color: '#EA4335',
          weight: 7,
          opacity: 1.0,
        }).addTo(highlightGroup);

        if (shouldFitBounds) {
          const bounds = segLine.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [60, 60] });
          }
        }
      }
    }
  };

  // Mở dẫn đường trực tiếp trên Google Maps App / Web
  const handleOpenGoogleMapsNavigation = () => {
    if (items.length === 0) return;

    const origin = userLocation
      ? `${userLocation.lat},${userLocation.lng}`
      : `${items[0].location.latitude},${items[0].location.longitude}`;

    const destination = `${items[items.length - 1].location.latitude},${items[items.length - 1].location.longitude}`;

    const waypointsArr = items
      .slice(1, items.length - 1)
      .map((it) => `${it.location.latitude},${it.location.longitude}`);

    const waypointsStr = waypointsArr.length > 0 ? `&waypoints=${waypointsArr.join('|')}` : '';

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsStr}&travelmode=driving`;
    window.open(googleMapsUrl, '_blank');
  };

  const totalDistance = segments.reduce((sum, s) => sum + s.distanceKm, 0);
  const totalDuration = segments.reduce((sum, s) => sum + s.durationMinutes, 0);

  return (
    <div
      className={`relative bg-slate-900 overflow-hidden transition-all z-0 ${
        isFullscreen
          ? 'fixed inset-0 z-[80] rounded-none'
          : className || 'w-full h-[520px] sm:h-[580px] rounded-3xl shadow-xl border border-slate-700/60'
      }`}
    >
      {/* Bản đồ Leaflet container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Thanh Control Google Maps & Tiện ích phía trên */}
      <div className="absolute top-3 left-3 right-3 z-[20] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Switcher (Google Maps / Vệ tinh / Địa hình) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md rounded-2xl p-1 shadow-lg border border-slate-200 flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMapLayer('google_streets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'google_streets'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🗺️ Google Maps
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('google_satellite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'google_satellite'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            🛰️ Vệ tinh
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('google_terrain')}
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
          <button
            type="button"
            onClick={handleOpenGoogleMapsNavigation}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs px-3.5 py-2 rounded-2xl shadow-lg transition cursor-pointer"
            title="Mở toàn bộ lộ trình trên Google Maps để bật chế độ dẫn đường giọng nói"
          >
            <FaDirections className="text-sm" />
            <span className="hidden sm:inline">Dẫn đường</span> Google Maps
          </button>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={gettingGPS}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-bold px-3 py-2 rounded-2xl shadow-lg border border-slate-200 transition cursor-pointer flex items-center gap-1.5 text-xs"
            title="Định vị GPS thực tế của bạn cho Điểm số 1"
          >
            <FaCrosshairs className={`text-blue-600 ${gettingGPS ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline text-blue-700 font-extrabold">Vị trí của tôi</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-white/95 backdrop-blur-md hover:bg-white text-slate-800 font-bold p-2.5 rounded-2xl shadow-lg border border-slate-200 transition cursor-pointer"
            title="Toàn màn hình"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
        </div>
      </div>

      {/* Loading Bar khi đang tính toán OSRM */}
      {loadingRoute && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[20] bg-slate-900/90 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-xl backdrop-blur-sm border border-slate-700">
          <FaSpinner className="animate-spin text-blue-400" />
          <span>Đang vẽ lộ trình đường đi thực tế...</span>
        </div>
      )}

      {/* Thanh Thống Kê Tổng Quãng Đường & Các Điểm Dừng 1, 2, 3... */}
      <div className="absolute bottom-3 left-3 right-3 z-[20] pointer-events-none">
        <div className="pointer-events-auto bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-200/90 space-y-2.5 max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-black">
                <FaMotorcycle />
              </span>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Lộ trình Ngày {dayNumber}
                </p>
                <p className="text-sm sm:text-base font-black text-slate-900">
                  Tổng {Math.round(totalDistance * 10) / 10} km • ~{totalDuration} phút di chuyển
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSelectSegment(null, true)}
              className={`text-xs px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                selectedSegmentIndex === null && !activeLocationId
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Xem toàn lộ trình
            </button>
          </div>

          {/* Danh sách các điểm dừng 1, 2, 3... bấm vào sẽ bay thẳng tới ghim đó mà không bị nhảy ngược lại */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
              {items.map((item, idx) => {
                const isSelected = activeLocationId === item.location.id;
                const seg = idx > 0 ? segments[idx - 1] : null;
                const distKm = seg ? seg.distanceKm : item.travel_distance_km || 0;
                const durMin = seg ? seg.durationMinutes : item.travel_time_minutes || 0;

                return (
                  <button
                    type="button"
                    key={`${item.location.id}_${idx}`}
                    onClick={() => {
                      if (onSelectLocation) {
                        onSelectLocation(item.location.id);
                      }
                      // Tô nổi bật chặng đường dẫn tới điểm này nhưng KHÔNG gọi fitBounds để giữ camera zoom tại điểm vừa chọn
                      if (idx > 0 && segments[idx - 1]) {
                        handleSelectSegment(idx - 1, false);
                      } else {
                        handleSelectSegment(null, false);
                      }
                      // Đảm bảo bay thẳng tới ghim ngay cả khi bấm lại vào cùng 1 vị trí đang chọn
                      const marker = markersRef.current[item.location.id];
                      if (marker && mapInstanceRef.current) {
                        mapInstanceRef.current.flyTo(marker.getLatLng(), 16, { duration: 1.0 });
                        marker.openPopup();
                      }
                    }}
                    className={`flex-shrink-0 text-left px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 text-amber-950 shadow-sm ring-2 ring-amber-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] text-white flex items-center justify-center font-black ${
                          idx === 0
                            ? 'bg-blue-600'
                            : item.location.category === 'hotel'
                            ? 'bg-purple-600'
                            : 'bg-red-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate max-w-[155px]">{item.location.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {idx === 0
                        ? `🚩 Khởi hành (${item.time_slot})`
                        : `${distKm} km • ~${durMin} ph (${item.time_slot})`}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
