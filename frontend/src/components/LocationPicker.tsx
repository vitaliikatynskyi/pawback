import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';

// Fix Leaflet default marker icons broken by Vite
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
}

function MapEvents({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ latitude, longitude, onChange }: LocationPickerProps) {
  const [initialPos] = useState<[number, number]>(
    latitude && longitude ? [latitude, longitude] : [50.4501, 30.5234] // Kyiv default
  );

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-100 shadow-sm relative z-0">
      <MapContainer
        center={initialPos}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onChange={onChange} />
        {latitude && longitude && (
          <Marker position={[latitude, longitude]} />
        )}
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] font-bold text-text-dark border border-white/50 shadow-sm">
        Натисніть на карту, щоб вибрати місце
      </div>
    </div>
  );
}
