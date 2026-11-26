import { useMemo, useState } from 'react';
import { distanceM } from '../utils/geo';
import { tripPath, project, approach } from '../utils/routeGeo';

const NEAR_M = 3000;
const MAX_ROWS = 15;
const IDLE_AT_TERMINAL_M = 400;

const zoneGroup = (zone = '') => {
  const z = zone.toLowerCase();
  if (z.includes('polangui')) return 'P';
  if (z.includes('centro')) return 'L';
  return 'W'; // Buga, Nogpo, Bonbon, Bacolod
};

// full = hanggang destinasyon; partial = hanggang Libon lang (magta-transfer)
export function tripLines(a, b) {
  if (a === 'W' && b === 'P') return { full: ['direct_polangui'], partial: ['libon_local'] };
  if (a === 'P' && b === 'W') return { full: ['direct_polangui'], partial: ['libon_polangui'] };
  if (a === 'P' || b === 'P') return { full: ['libon_polangui', 'direct_polangui'], partial: [] };
  return { full: ['libon_local', 'direct_polangui'], partial: [] };
}

const ll = (s) => [Number(s.latitude), Number(s.longitude)];

export default function useTricycleFilter(drivers, sheds) {
  const [mode, setMode] = useState('route'); // 'route' | 'all'
  const [originId, setOriginId] = useState('');
  const [destId, setDestId] = useState('');
  const [here, setHere] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);

  const origin = sheds.find((s) => s.id === originId) ?? null;
  const dest = sheds.find((s) => s.id === destId) ?? null;
  const ref = here ?? (origin ? ll(origin) : null);
  const lines = origin && dest ? tripLines(zoneGroup(origin.route_zone), zoneGroup(dest.route_zone)) : null;
  const ready = mode === 'all' || !!lines;

  const { rows, hidden } = useMemo(() => {
    let list = drivers
      .filter((d) => d.current_latitude != null && d.current_longitude != null)
      .map((d) => {
        const pos = [Number(d.current_latitude), Number(d.current_longitude)];
        return { driver: d, pos, dist: ref ? distanceM(ref, pos) : null, tag: null, state: null };
      });

    if (mode === 'route' && lines) {
      list = list.filter((r) => {
        if (lines.full.includes(r.driver.line)) { r.tag = 'full'; return true; }
        if (lines.partial.includes(r.driver.line)) { r.tag = 'partial'; return true; }
        return false;
      });

      // Paparating lang: alisin ang nakalampas na at ang papalayo
      const trip = tripPath(ll(origin), ll(dest));
      if (trip) {
        const refS = project(trip.path, ref ?? ll(origin)).s;
        const originLL = ll(origin);
        list = list.filter((r) => {
          const a = approach(trip, refS, r.driver, r.pos);
          if (a.state === 'coming') { r.state = 'coming'; r.dist = a.gap; return true; }
          if (a.state === 'idle') {
            const d = distanceM(r.pos, originLL);
            if (d <= IDLE_AT_TERMINAL_M) { r.state = 'idle'; r.dist = d; return true; }
          }
          return false;
        });
      }
    }

    const rank = (r) => (r.state === 'idle' ? 1 : 0);
    if (ref) list.sort((a, b) => rank(a) - rank(b) || a.dist - b.dist);

    const total = list.length;
    if (!showAll) {
      if (ref) list = list.filter((r) => r.state === 'idle' || r.dist == null || r.dist <= NEAR_M);
      list = list.slice(0, MAX_ROWS);
    }
    return { rows: list, hidden: Math.max(0, total - list.length) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers, mode, originId, destId, here, showAll, sheds]);

  function changeOrigin(id) { setOriginId(id); setHere(null); }

  function locate() {
    if (!navigator.geolocation) return setLocError(true);
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = [pos.coords.latitude, pos.coords.longitude];
        let best = null;
        for (const s of sheds) {
          const d = distanceM(p, ll(s));
          if (!best || d < best.d) best = { id: s.id, d };
        }
        if (best) setOriginId(best.id);
        setHere(p);
        setLocating(false);
      },
      () => { setLocating(false); setLocError(true); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return {
    mode, setMode, originId, destId, changeOrigin, setDestId,
    showAll, setShowAll, locate, locating, locError,
    rows, hidden, ready, hasRef: !!ref,
  };
}