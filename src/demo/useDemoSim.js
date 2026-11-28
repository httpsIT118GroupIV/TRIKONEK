import { useEffect, useReducer, useRef } from 'react';
import { distanceM, bearingDeg } from '../utils/geo';
import baseRoutes from '../simulation/routes.json';

// Kung wala ang demoData.json, hindi mabibigo ang build
const files = import.meta.glob('./demoData.json', { eager: true });
const loaded = files['./demoData.json']?.default ?? null;

const DEFAULT_SHEDS = [
  { id: 'd-buga', shed_name: 'Buga Terminal', latitude: 13.2962, longitude: 123.3595, route_zone: 'Lakeside' },
  { id: 'd-nogpo', shed_name: 'Nogpo Terminal', latitude: 13.2885, longitude: 123.3734, route_zone: 'Lakeside' },
  { id: 'd-bonbon', shed_name: 'Bonbon Terminal', latitude: 13.2788, longitude: 123.4042, route_zone: 'Lakeside' },
  { id: 'd-libon', shed_name: 'Libon Terminal', latitude: 13.2998, longitude: 123.4384, route_zone: 'Centrong Libon' },
  { id: 'd-bacolod', shed_name: 'Bacolod Terminal', latitude: 13.2706, longitude: 123.4431, route_zone: 'Libon–Bacolod' },
  { id: 'd-polangui', shed_name: 'Polangui Terminal', latitude: 13.2956, longitude: 123.4856, route_zone: 'Libon–Polangui' },
];

export const SHEDS = loaded?.sheds?.length ? loaded.sheds : DEFAULT_SHEDS;

export const DEMO_QR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">' +
      '<rect width="240" height="240" fill="#fff"/>' +
      '<g fill="none" stroke="#1F1F1F" stroke-width="12">' +
      '<rect x="14" y="14" width="64" height="64"/><rect x="162" y="14" width="64" height="64"/><rect x="14" y="162" width="64" height="64"/></g>' +
      '<g fill="#1F1F1F"><rect x="34" y="34" width="24" height="24"/><rect x="182" y="34" width="24" height="24"/><rect x="34" y="182" width="24" height="24"/>' +
      '<rect x="100" y="20" width="16" height="16"/><rect x="124" y="44" width="16" height="16"/><rect x="100" y="100" width="40" height="16"/>' +
      '<rect x="160" y="110" width="16" height="40"/><rect x="190" y="150" width="30" height="16"/><rect x="110" y="170" width="16" height="40"/>' +
      '<rect x="150" y="190" width="40" height="16"/></g>' +
      '<text x="120" y="140" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#E11D48">DEMO QR</text></svg>'
  );

// ---------- Geometry ----------
function prepare(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + distanceM(points[i - 1], points[i]));
  return { points, cum, total: cum[cum.length - 1] };
}
function pointAt(route, d) {
  const { points, cum, total } = route;
  if (d <= 0) return points[0];
  if (d >= total) return points[points.length - 1];
  let i = 1;
  while (cum[i] < d) i++;
  const t = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
  return [
    points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t,
    points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t,
  ];
}
function nearestCum(route, ll) {
  let best = 0;
  let bd = Infinity;
  route.points.forEach((p, i) => {
    const d = distanceM(p, ll);
    if (d < bd) { bd = d; best = route.cum[i]; }
  });
  return best;
}

const ROUTES = {};
for (const id of ['A', 'B', 'C']) {
  const p = loaded?.routes?.[id] ?? baseRoutes[id];
  if (p && p.length >= 2) ROUTES[id] = prepare(p);
}
// Buga/Nogpo/Bonbon -> Libon -> Polangui (direct)
if (ROUTES.A && ROUTES.C) ROUTES.AC = prepare([...ROUTES.A.points, ...ROUTES.C.points.slice(1)]);

const findShed = (prefix) =>
  SHEDS.find((s) => s.shed_name.toLowerCase().startsWith(prefix)) ?? SHEDS[0];

const BONBON = findShed('bonbon');
const BONBON_LL = [Number(BONBON.latitude), Number(BONBON.longitude)];
// Ang demo driver ay nakaparada sa kalsada malapit sa terminal ng Bonbon
const ROAD_S = ROUTES.AC ? nearestCum(ROUTES.AC, BONBON_LL) : 0;
const ROAD_PT = ROUTES.AC ? pointAt(ROUTES.AC, ROAD_S) : BONBON_LL;

// ---------- Mga setting ----------
const TICK_MS = 1000;
const NPC_SPEED = 16; // m/s (mas mabilis sa totoo para kita ang galaw)
const PAUSE = 4;
const FLAT_FARE = 300;
const DAY = 24 * 3600 * 1000;

const NPCS = [
  { id: 'n1', plate: 'DEMO-11', route: 'A', dir: 1, line: 'libon_local', frac: 0.2 },
  { id: 'n2', plate: 'DEMO-12', route: 'A', dir: -1, line: 'libon_local', frac: 0.7 },
  { id: 'n3', plate: 'DEMO-13', route: 'B', dir: 1, line: 'libon_local', frac: 0.5 },
  { id: 'n4', plate: 'DEMO-14', route: 'C', dir: 1, line: 'libon_polangui', frac: 0.4 },
  { id: 'n5', plate: 'DEMO-15', route: 'C', dir: -1, line: 'libon_polangui', frac: 0.7 },
  // Direct sa Polangui: isang paparating sa Bonbon, isang nakalampas na, isang papalayo
  { id: 'n6', plate: 'DEMO-16', route: 'AC', dir: 1, line: 'direct_polangui', abs: ROAD_S - 1800, loop: true },
  { id: 'n7', plate: 'DEMO-17', route: 'AC', dir: -1, line: 'direct_polangui', abs: ROAD_S + 3000 },
  { id: 'n8', plate: 'DEMO-18', route: 'AC', dir: 1, line: 'direct_polangui', abs: ROAD_S + 1200 },
].filter((n) => ROUTES[n.route]);

function initState() {
  return {
    npcs: NPCS.map((n, i) => {
      const total = ROUTES[n.route].total;
      const d = n.abs != null ? Math.min(total, Math.max(0, n.abs)) : total * n.frac;
      return { ...n, dist: d, pause: 0, status: i % 3 === 2 ? 'full' : 'available' };
    }),
    me: { online: true, status: 'available', pos: ROAD_PT },
    rental: null,
    signals: {},
  };
}

function stepSim(s) {
  const dt = TICK_MS / 1000;
  for (const n of s.npcs) {
    const r = ROUTES[n.route];
    if (n.pause > 0) {
      n.pause -= 1;
      if (n.pause === 0) n.status = Math.random() < 0.4 ? 'full' : 'available';
      continue;
    }
    n.dist += n.dir * NPC_SPEED * dt;
    if (n.loop && n.dist > ROAD_S + 2500) { n.dist = Math.max(0, ROAD_S - 2500); n.dir = 1; }
    if (n.dist >= r.total) { n.dist = r.total; n.dir = -1; n.pause = PAUSE; n.status = 'available'; }
    else if (n.dist <= 0) { n.dist = 0; n.dir = 1; n.pause = PAUSE; n.status = 'available'; }
    else if (Math.random() < 0.03) n.status = n.status === 'available' ? 'full' : 'available';
  }
}

export default function useDemoSim(onEvent) {
  const ref = useRef(null);
  if (ref.current === null) ref.current = initState();
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const [, bump] = useReducer((x) => x + 1, 0);

  useEffect(() => {
    const id = setInterval(() => {
      stepSim(ref.current);
      bump();
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const emit = (e) => cb.current?.(e);

  // ---------- Mga aksyon ----------
  function signal(shedId) { ref.current.signals[shedId] = shedId; bump(); emit('signal'); }
  function unsignal(shedId) { delete ref.current.signals[shedId]; bump(); }
  function ensureSignal() { if (!Object.keys(ref.current.signals).length) signal(BONBON.id); }

  function createRental(destId, trucks = 2) {
    const s = ref.current;
    if (s.rental) return;
    const dst = SHEDS.find((x) => x.id === destId) ?? findShed('libon');
    s.rental = {
      id: 'demo-rental',
      event: Date.now() + 2 * DAY,
      pickup: [ROAD_PT[0] + 0.0006, ROAD_PT[1] + 0.0006],
      dest: [Number(dst.latitude), Number(dst.longitude)],
      destNote: dst.shed_name,
      trucks,
      meAccepted: false,
      showRoute: false,
    };
    bump();
    emit('rental');
  }
  function ensureRental() { if (!ref.current.rental) createRental(findShed('libon').id, 2); }
  function cancelRental() { ref.current.rental = null; bump(); }

  function accept() {
    const r = ref.current.rental;
    if (!r || r.meAccepted) return;
    r.meAccepted = true;
    bump();
    emit('accepted');
  }
  function ensureAccepted() { ensureRental(); accept(); }

  function withdraw() {
    const r = ref.current.rental;
    if (!r) return;
    r.meAccepted = false;
    r.showRoute = false;
    bump();
  }
  function showRoute(v) {
    const r = ref.current.rental;
    if (!r || !r.meAccepted) return;
    r.showRoute = v;
    bump();
    if (v) emit('route');
  }
  function ensureRoute() { ensureAccepted(); showRoute(true); }

  function setOnline(v) { ref.current.me.online = v; bump(); }
  function setStatus(v) { ref.current.me.status = v; bump(); }
  function reset() { ref.current = initState(); bump(); }

  // ---------- Mga view ----------
  const s = ref.current;
  const me = s.me;
  const rt = s.rental;
  const nowIso = new Date().toISOString();

  const vehicles = s.npcs.map((n) => {
    const r = ROUTES[n.route];
    const p = pointAt(r, n.dist);
    const ahead = pointAt(r, n.dist + n.dir * 40);
    return {
      id: n.id, tricycle_plate_number: n.plate, status: n.status, line: n.line,
      verification_status: 'verified',
      current_latitude: p[0], current_longitude: p[1], qr_code_url: null,
      heading_deg: Math.round(bearingDeg(p, ahead)), heading_at: nowIso,
    };
  });
  if (me.online) {
    vehicles.push({
      id: 'me', tricycle_plate_number: 'DEMO-DRV', status: me.status, line: 'direct_polangui',
      verification_status: 'verified',
      current_latitude: me.pos[0], current_longitude: me.pos[1], qr_code_url: DEMO_QR,
      heading_deg: null, heading_at: null,
    });
  }

  const myRentals = rt
    ? [{
        id: rt.id, event_at: new Date(rt.event).toISOString(), dest_note: rt.destNote,
        trucks: rt.trucks, total: FLAT_FARE * rt.trucks, accepted: rt.meAccepted ? 1 : 0,
        drivers: rt.meAccepted ? [{ plate: 'DEMO-DRV', first_name: 'Pedro', toda: 'Demo TODA' }] : [],
      }]
    : [];

  const driverOpenRentals =
    rt && !rt.meAccepted && me.online
      ? [{
          id: rt.id, event_at: new Date(rt.event).toISOString(), dest_note: rt.destNote,
          trucks: rt.trucks, flat_fare: FLAT_FARE, accepted: 0,
          origin_name: BONBON.shed_name, distance_m: 100,
        }]
      : [];

  const driverMine =
    rt && rt.meAccepted
      ? [{
          id: rt.id, event_at: new Date(rt.event).toISOString(),
          pickup_lat: rt.pickup[0], pickup_lng: rt.pickup[1],
          dest_lat: rt.dest[0], dest_lng: rt.dest[1],
          pickup_note: BONBON.shed_name, dest_note: rt.destNote, phone: '09123456789',
          flat_fare: FLAT_FARE, trucks: rt.trucks, accepted: 1, customer: 'Ana', can_withdraw: true,
        }]
      : [];

  return {
    sheds: SHEDS,
    vehicles, me, rental: rt, myRentals, driverOpenRentals, driverMine,
    waitingByShed: { ...s.signals },
    terminalWaiting: Object.keys(s.signals).map((id) => ({
      id, kind: 'terminal', shedId: id, name: SHEDS.find((x) => x.id === id)?.shed_name ?? '',
    })),
    flatFare: FLAT_FARE,
    signal, unsignal, ensureSignal,
    createRental, ensureRental, cancelRental,
    accept, ensureAccepted, withdraw, showRoute, ensureRoute,
    setOnline, setStatus, reset,
  };
}