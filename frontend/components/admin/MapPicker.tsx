'use client';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect } from 'react';
import L from 'leaflet';

// Fix Leaflet Icon
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function LocationHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onSelect(e.latlng.lat, e.latlng.lng);
      map.flyTo(e.latlng, map.getZoom());
    },
    locationfound(e) {
      const latlng = { lat: e.latlng.lat, lng: e.latlng.lng };
      setPosition([latlng.lat, latlng.lng]);
      onSelect(latlng.lat, latlng.lng);
      map.flyTo(latlng, 16);
    },
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  return position === null ? null : (
    <>
      <Marker position={position} icon={icon}></Marker>
      <Circle center={position} radius={100} pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }} />
    </>
  );
}

export default function MapPicker({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  // Fix: Force re-render on mount to avoid Leaflet node issues in Strict Mode
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, []);

  return (
    <MapContainer key={key} center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap'
      />
      <LocationHandler onSelect={onSelect} />
    </MapContainer>
  );
}
