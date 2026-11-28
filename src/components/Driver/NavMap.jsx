import { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useLang } from '../../context/LanguageContext';
import { distanceM, bearingDeg, formatDistance } from '../../utils/geo';
import { osrmRoute } from '../../utils/osrm';

const STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const lngLat = (p) => [p[1], p[0]];
const emptyLine = { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } };

function el(emoji, bg, size) {
  const d = document.createElement('div');
  d.style.cssText = `width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:${size / 2}px`;
  d.textContent = emoji;
  return d;
}

export default function NavMap({ me, pickup, dest, customer, onStop }) {
  const { t } = useLang();
  const box = useRef(null);
  const map = useRef(null);
  const ready = useRef(false);
  const meMarker = useRef(null);
  const prev = useRef(null);
  const bearing = useRef(0);
  const lastFetch = useRef(null);

  const [stage, setStage] = useState('pickup'); // pickup | dest
  const [toTarget, setToTarget] = useState(null);
  const [trip, setTrip] = useState(null);

  const target = stage === 'pickup' ? pickup : dest;

  // Gawin ang mapa
  useEffect(() => {
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE,
      center: me ? lngLat(me) : lngLat(pickup),
      zoom: 16.5,
      pitch: 60,
      maxPitch: 75,
      attributionControl: { compact: true },
    });
    map.current = m;

    m.on('load', () => {
      m.resize();
      m.addSource('leg1', { type: 'geojson', data: emptyLine });
      m.addSource('leg2', { type: 'geojson', data: emptyLine });
      for (const [id, color] of [['leg2', '#7C3AED'], ['leg1', '#2563EB']]) {
        m.addLayer({
          id: id + 'c',
          type: 'line',
          source: id,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#fff', 'line-width': 11 },
        });
        m.addLayer({
          id,
          type: 'line',
          source: id,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': color, 'line-width': 7 },
        });
      }
      ready.current = true;
      setStage((s) => s); // pasiglahin ang mga effect sa ibaba
    });

    new maplibregl.Marker({ element: el('📍', '#F59E0B', 38) }).setLngLat(lngLat(pickup)).addTo(m);
    if (dest) new maplibregl.Marker({ element: el('🏁', '#7C3AED', 38) }).setLngLat(lngLat(dest)).addTo(m);
    meMarker.current = new maplibregl.Marker({
      element: el('🛺', '#16A34A', 44),
      pitchAlignment: 'viewport',
      rotationAlignment: 'viewport',
    });
    if (me) meMarker.current.setLngLat(lngLat(me)).addTo(m);

    return () => {
      m.remove();
      map.current = null;
      ready.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sundan ang driver
  useEffect(() => {
    const m = map.current;
    if (!m || !me) return;
    meMarker.current.setLngLat(lngLat(me)).addTo(m);

    if (prev.current && distanceM(prev.current, me) >= 8) {
      const b = bearingDeg(prev.current, me);
      // Pinakinis na pag-ikot
      const diff = ((b - bearing.current + 540) % 360) - 180;
      bearing.current = (bearing.current + diff * 0.5 + 360) % 360;
      prev.current = me;
    } else if (!prev.current) {
      prev.current = me;
    }

    m.easeTo({
      center: lngLat(me),
      bearing: bearing.current,
      pitch: 60,
      zoom: 17,
      offset: [0, 140], // nasa ibabang bahagi ng screen ang driver
      duration: 900,
    });
  }, [me]);

  // Kunin ang ruta papunta sa target; ulitin kapag lumayo ng 150 m
  useEffect(() => {
    if (!me || !target) return;
    const key = stage;
    if (lastFetch.current && lastFetch.current.key === key && distanceM(lastFetch.current.at, me) < 150) return;
    lastFetch.current = { key, at: me };
    let stop = false;
    osrmRoute(me, target).then((r) => {
      if (stop) return;
      setToTarget(r);
      if (ready.current && map.current?.getSource('leg1')) {
        const coords = r ? r.coords : [lngLat(me), lngLat(target)];
        map.current.getSource('leg1').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords } });
      }
    });
    return () => { stop = true; };
  }, [me, target, stage]);

  // Ruta mula sundo papunta sa destinasyon (violet)
  useEffect(() => {
    if (!dest) return;
    let stop = false;
    osrmRoute(pickup, dest).then((r) => {
      if (stop) return;
      setTrip(r);
      const draw = () => map.current?.getSource('leg2')?.setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: r ? r.coords : [lngLat(pickup), lngLat(dest)] },
      });
      if (ready.current) draw(); else map.current?.once('load', draw);
    });
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sa yugtong papunta sa destinasyon, itago ang violet (nasa asul na ito)
  useEffect(() => {
    const m = map.current;
    if (!m || !ready.current) return;
    const v = stage === 'pickup' ? 'visible' : 'none';
    m.setLayoutProperty('leg2', 'visibility', v);
    m.setLayoutProperty('leg2c', 'visibility', v);
  }, [stage]);

  const dist = me && target ? distanceM(me, target) : null;
  const info = toTarget && toTarget.distance != null
    ? `${formatDistance(toTarget.distance)} · ${Math.max(1, Math.round(toTarget.duration / 60))} min`
    : dist != null ? formatDistance(dist) : '…';

return (
    <div className="absolute inset-0 h-full w-full isolate">
      <div ref={box} className="absolute inset-0 h-full w-full" style={{ width: '100%', height: '100%' }} />

      <div className="pointer-events-none absolute inset-x-0 top-3 z-10 mx-auto max-w-md px-3">
        <div className="pointer-events-auto rounded-2xl bg-violet-600 px-4 py-3 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-white/80">
            {stage === 'pickup' ? t('nav.toPickup') : t('nav.toDest')}
          </p>
          <p className="text-2xl font-extrabold leading-tight">{info}</p>
          <p className="truncate text-xs font-semibold text-white/90">👤 {customer}</p>
        </div>
        {!me && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-accent shadow">{t('nav.noGps')}</p>}
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-md space-y-2 px-3 pb-3">
        {stage === 'pickup' && dest && (
          <button className="btn-primary shadow-lg" onClick={() => { lastFetch.current = null; setStage('dest'); }}>
            ✅ {t('nav.pickedUp')}
          </button>
        )}
        <button className="btn-dark shadow-lg" onClick={onStop}>⏹ {t('nav.stop')}</button>
      </div>
    </div>
  );
}