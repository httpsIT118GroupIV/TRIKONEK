import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import TricycleMarker from './TricycleMarker';
import ShedMarker from './ShedMarker';

const CENTER = [13.29, 123.42];
// Pansamantalang saklaw habang hindi pa nakukuha ang mga terminal
const FALLBACK = L.latLngBounds([13.26, 123.35], [13.31, 123.5]);

// Binabagay ang mapa sa saklaw ng mga terminal at nilalagyan ng "pader"
function BoundsLock({ sheds }) {
  const map = useMap();
  useEffect(() => {
    const pts = sheds.map((s) => [Number(s.latitude), Number(s.longitude)]);
    const base = pts.length ? L.latLngBounds(pts) : FALLBACK;
    const bounds = base.pad(0.25);
    map.setMinZoom(map.getBoundsZoom(bounds));
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
  }, [sheds, map]);
  return null;
}

export default function MapView({ sheds, drivers, waitingByShed, busy, onSignal, onCancel, onPay }) {
  return (
    <MapContainer
      center={CENTER}
      zoom={13}
      maxZoom={18}
      maxBoundsViscosity={1.0}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <BoundsLock sheds={sheds} />
      {sheds.map((s) => (
        <ShedMarker
          key={s.id}
          shed={s}
          waiting={!!waitingByShed[s.id]}
          busy={busy}
          onSignal={() => onSignal(s.id)}
          onCancel={() => onCancel(waitingByShed[s.id])}
        />
      ))}
      {drivers.map((d) => (
        <TricycleMarker key={d.id} driver={d} onPay={onPay} />
      ))}
    </MapContainer>
  );
}