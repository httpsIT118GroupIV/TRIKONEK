import { useEffect } from 'react';
import L from 'leaflet';
import { Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';

const pin = (emoji, bg) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:${bg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:18px">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

const WAITING = pin('🧍', '#F59E0B');
const PICKED = pin('📍', '#E11D48');

function ClickPicker({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

export default function RoadsideLayer({ signals = [], picked, picking, onPick, label }) {
  const map = useMap();

  useEffect(() => {
    const el = map.getContainer();
    el.style.cursor = picking ? 'crosshair' : '';
    return () => { el.style.cursor = ''; };
  }, [picking, map]);

  return (
    <>
      {picking && <ClickPicker onPick={onPick} />}
      {signals.map((s) => (
        <Marker key={s.id} position={[Number(s.latitude), Number(s.longitude)]} icon={WAITING}>
          {label && <Tooltip direction="top" offset={[0, -18]}>{label}</Tooltip>}
        </Marker>
      ))}
      {picking && picked && <Marker position={picked} icon={PICKED} />}
    </>
  );
}