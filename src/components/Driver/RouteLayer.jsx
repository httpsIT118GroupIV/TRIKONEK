import { useEffect, useState } from 'react';
import L from 'leaflet';
import { Marker, Polyline, useMap } from 'react-leaflet';

const pin = (emoji, bg) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:${bg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:18px">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });
const PICK = pin('📍', '#F59E0B');
const DEST = pin('🏁', '#7C3AED');

async function osrm(a, b) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const r = data.routes[0];
    return {
      line: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: r.distance,
      duration: r.duration,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const key = (p) => (p ? `${p[0].toFixed(3)},${p[1].toFixed(3)}` : '');
const straight = (a, b) => ({ line: [a, b], distance: null, duration: null, straight: true });

export default function RouteLayer({ me, pickup, dest, onInfo }) {
  const map = useMap();
  const [leg1, setLeg1] = useState(null);
  const [leg2, setLeg2] = useState(null);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let stop = false;
    setLeg1(null);
    if (me && pickup) osrm(me, pickup).then((r) => { if (!stop) setLeg1(r || straight(me, pickup)); });
    return () => { stop = true; };
  }, [key(me), key(pickup)]);

  useEffect(() => {
    let stop = false;
    setLeg2(null);
    if (pickup && dest) osrm(pickup, dest).then((r) => { if (!stop) setLeg2(r || straight(pickup, dest)); });
    return () => { stop = true; };
  }, [key(pickup), key(dest)]);

  useEffect(() => {
    const pts = [me, pickup, dest].filter(Boolean);
    if (pts.length < 2) return;
    map.fitBounds(L.latLngBounds(pts), {
      paddingTopLeft: [30, 100],
      paddingBottomRight: [30, 340],
      maxZoom: 16,
    });
  }, [key(pickup), key(dest)]);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    onInfo?.({ toPickup: leg1, trip: leg2 });
  }, [leg1, leg2, onInfo]);

  return (
    <>
      {leg1 && (
        <Polyline
          positions={leg1.line}
          pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.85, dashArray: leg1.straight ? '6 8' : undefined }}
        />
      )}
      {leg2 && (
        <Polyline
          positions={leg2.line}
          pathOptions={{ color: '#7C3AED', weight: 5, opacity: 0.85, dashArray: leg2.straight ? '6 8' : undefined }}
        />
      )}
      {pickup && <Marker position={pickup} icon={PICK} zIndexOffset={900} />}
      {dest && <Marker position={dest} icon={DEST} zIndexOffset={900} />}
    </>
  );
}