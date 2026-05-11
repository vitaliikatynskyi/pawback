import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { Compass, Settings2, MapPin, Loader2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { listingsApi } from '../api/client';
import type { Listing } from '../types';

// Fix Leaflet default marker icons broken by Vite
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color: string) =>
  L.divIcon({
    className: '',
    html: `<div style="width:28px;height:36px;position:relative">
      <div style="width:28px;height:28px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>
    </div>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });

const lostIcon = makeIcon('#EF4444');
const foundIcon = makeIcon('#22C55E');
const meIcon = L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;background:#E8704A;border-radius:50%;border:3px solid white;box-shadow:0 0 0 4px rgba(232,112,74,0.25),0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

function RecenterButton({ position }: { position: [number, number] }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.flyTo(position, 13)}
      style={{ position: 'absolute', bottom: '80px', right: '12px', zIndex: 1000 }}
      className="p-3 bg-white rounded-2xl shadow-xl border border-gray-100 text-text-muted hover:text-primary transition-all"
      aria-label="Моє місцезнаходження"
    >
      <Compass className="w-5 h-5" />
    </button>
  );
}

export default function MapPage() {
  const [filter, setFilter] = useState<'all' | 'LOST' | 'FOUND'>('all');
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<[number, number]>([50.4501, 30.5234]);
  const [radius, setRadius] = useState(50); // wider default to show more
  const [showSettings, setShowSettings] = useState(false);
  const [mapHeight, setMapHeight] = useState(window.innerHeight - 64);

  // Fix map height on resize
  useEffect(() => {
    const onResize = () => setMapHeight(window.innerHeight - 64);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setUserPos([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);

  useEffect(() => {
    setLoading(true);
    listingsApi.getAll()
      .then(res => setListings(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const withCoords = listings.filter(l => l.latitude != null && l.longitude != null);
  const visible = withCoords.filter(l => {
    if (filter !== 'all' && l.type !== filter) return false;
    return true;
  });

  return (
    <div style={{ height: `${mapHeight}px`, position: 'relative', overflow: 'hidden' }}>

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 right-4 z-[1000] pointer-events-none flex flex-col md:flex-row items-start justify-between gap-3">
        {/* Left: title + filter */}
        <div className="pointer-events-auto space-y-2">
          <h1 className="text-3xl font-serif font-bold text-text-dark drop-shadow-sm">Карта</h1>
          <div className="flex gap-1.5 p-1.5 bg-white rounded-2xl shadow-lg border border-gray-100">
            {[
              { val: 'all', label: 'Усі' },
              { val: 'LOST', label: '🔴 Загублено' },
              { val: 'FOUND', label: '🟢 Знайдено' },
            ].map(tab => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setFilter(tab.val as typeof filter)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  filter === tab.val
                    ? 'bg-primary text-white shadow-md'
                    : 'text-text-muted hover:text-text-dark hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: counter + settings */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <div className="bg-white/95 backdrop-blur-md px-5 py-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-text-muted" />
            ) : (
              <MapPin className="w-4 h-4 text-primary" />
            )}
            <span className="text-sm font-bold text-text-dark">
              {loading ? 'Завантаження...' : `${visible.length} оголошень`}
            </span>
            <button
              type="button"
              onClick={() => setShowSettings(v => !v)}
              className="p-1.5 text-text-muted hover:text-primary transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
          </div>

          {showSettings && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-4 w-56 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Радіус відображення</div>
                  <div className="text-base font-bold text-text-dark">{radius} км</div>
                </div>
                <button
                  type="button"
                  onClick={() => setRadius(50)}
                  className="px-2 py-1 rounded-lg bg-bg-cream text-text-dark text-xs font-bold"
                >
                  Скинути
                </button>
              </div>
              <input
                type="range" min={1} max={200} value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-full accent-primary"
              />
              <p className="text-xs text-text-muted">
                {withCoords.length} оголошень з координатами з {listings.length} всього
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <MapContainer
        center={userPos}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User location */}
        <Marker position={userPos} icon={meIcon}>
          <Popup>
            <div className="font-bold text-sm">📍 Ваше місцезнаходження</div>
          </Popup>
        </Marker>

        {/* Radius circle */}
        <Circle
          center={userPos}
          radius={radius * 1000}
          pathOptions={{
            color: '#E8704A',
            fillColor: '#E8704A',
            fillOpacity: 0.04,
            dashArray: '6 6',
            weight: 1.5,
          }}
        />

        {/* Listing markers */}
        {visible.map(listing => (
          <Marker
            key={listing.id}
            position={[listing.latitude!, listing.longitude!]}
            icon={listing.type === 'LOST' ? lostIcon : foundIcon}
          >
            <Popup minWidth={220}>
              <div className="p-1 space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white ${listing.type === 'LOST' ? 'bg-red-500' : 'bg-green-500'}`}>
                    {listing.type === 'LOST' ? 'Загублено' : 'Знайдено'}
                  </span>
                  {listing.rewardAmount && (
                    <span className="text-[10px] font-bold text-orange-500">{listing.rewardAmount} ₴</span>
                  )}
                </div>
                <p className="font-bold text-sm text-gray-800">
                  {listing.petName || `${listing.petType === 'CAT' ? 'Кіт' : listing.petType === 'DOG' ? 'Пес' : 'Тварина'}`}
                </p>
                {listing.addressText && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {listing.addressText}
                  </p>
                )}
                {listing.city && !listing.addressText && (
                  <p className="text-xs text-gray-500">{listing.city}</p>
                )}
                <Link
                  to={`/listing/${listing.id}`}
                  className="block w-full text-center text-xs font-bold text-white bg-orange-500 hover:bg-orange-600 py-1.5 rounded-lg transition-colors mt-1"
                >
                  Переглянути →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}

        <RecenterButton position={userPos} />
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-8 left-4 z-[1000] p-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-gray-100 space-y-2">
        {[
          { color: '#EF4444', label: 'Загублено' },
          { color: '#22C55E', label: 'Знайдено' },
          { color: '#E8704A', label: 'Я тут' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shadow-sm" style={{ background: color }} />
            <span className="text-xs font-bold text-text-dark">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}




 
 
 
 
