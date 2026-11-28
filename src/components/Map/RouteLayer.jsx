import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Marker, Polyline, useMap } from 'react-leaflet';
import { distanceM } from '../../utils/geo';

const pin = (emoji, bg) =>
  L.divIcon({
    className: '',
    html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:${bg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:18px">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
const PICK = pin('📍', '#2563EB');
const DEST = pin('🏁', '#7C3AED');

// Ruta sa kalsada (OSRM). Kapag hindi maabot, tuwid na linya ang gagamitin.
async function getRoute(a, b) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    const data = await res.json();
    if (data.code !== 'Ok') throw new Error('osrm');
    const r = data.routes[0];
    return {
      points: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      distance: r.distance,
      duration: r.duration,
    };
  } catch {
    const d = distanceM(a, b) * 1.3;
    return { points: [a, b], distance: d, duration: d / 6 };
  }
}

export default function RouteLayer({ me, pickup, dest, onInfo }) {
  const map = useMap();
  const [toPickup, setToPickup] = useState(null);
  const [trip, setTrip] = useState(null);
  const fitted = useRef('');

  const pickKey = pickup ? pickup.join(',') : '';
  const destKey = dest ? dest.join(',') : '';
  // Mag-uupdate lang ang ruta papunta sa sundo kapag lumipat ang driver ng mga 100 m
  const meKey = me ? `${me[0].toFixed(3)},${me[1].toFixed(3)}` : '';

  useEffect(() => {
    if (!pickup || !dest) { setTrip(null); return; }
    let off = false;
    getRoute(pickup, dest).then((r) => { if (!off) setTrip(r); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey, destKey]);

  useEffect(() => {
    if (!pickup || !me) { setToPickup(null); return; }
    let off = false;
    getRoute(me, pickup).then((r) => { if (!off) setToPickup(r); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meKey, pickKey]);

  useEffect(() => {
    onInfo?.({ toPickup, trip });
  }, [toPickup, trip, onInfo]);

  // Isang beses lang i-fit ang mapa para sa bawat rental
  useEffect(() => {
    const pts = [...(toPickup?.points ?? []), ...(trip?.points ?? [])];
    if (!pts.length) return;
    const key = `${pickKey}|${destKey}`;
    if (fitted.current === key) return;
    fitted.current = key;
    map.fitBounds(L.latLngBounds(pts), {
      paddingTopLeft: [40, 90],
      paddingBottomRight: [40, 240],
      maxZoom: 16,
    });
  }, [toPickup, trip, pickKey, destKey, map]);

  return (
    <>
      {toPickup && <Polyline positions={toPickup.points} pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.85 }} />}
      {trip && <Polyline positions={trip.points} pathOptions={{ color: '#7C3AED', weight: 5, opacity: 0.85, dashArray: '10 8' }} />}
      {pickup && <Marker position={pickup} icon={PICK} zIndexOffset={900} />}
      {dest && <Marker position={dest} icon={DEST} zIndexOffset={900} />}
    </>
  );
}