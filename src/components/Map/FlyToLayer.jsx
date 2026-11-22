import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

export default function FlyToLayer({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (!focus?.pos || Number.isNaN(focus.pos[0]) || Number.isNaN(focus.pos[1])) return;
    map.flyTo(focus.pos, Math.max(map.getZoom(), 16), { duration: 0.8 });
  }, [focus, map]);
  return null;
}