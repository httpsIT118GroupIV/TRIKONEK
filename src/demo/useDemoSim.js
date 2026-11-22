import { useEffect, useReducer, useRef } from 'react';
import { distanceM } from '../utils/geo';

// Kung wala pa ang demoData.json, hindi mabibigo ang build
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

const ROUTE_NAMES = {
  A: ['Buga Terminal', 'Nogpo Terminal', 'Bonbon Terminal', 'Libon Terminal'],
  B: ['Bacolod Terminal', 'Libon Terminal'],
  C: ['Libon Terminal', 'Polangui Terminal'],
};

export const SHEDS = loaded?.sheds?.length ? loaded.sheds : DEFAULT_SHEDS;
const byName = Object.fromEntries(SHEDS.map((s) => [s.shed_name, s]));

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

const ROUTES = {};
for (const [id, names] of Object.entries(ROUTE_NAMES)) {
  let pts = loaded?.routes?.[id];
  if ((!pts || pts.length < 2) && names.every((n) => byName[n])) {
    pts = names.map((n) => [Number(byName[n].latitude), Number(byName[n].longitude)]);
  }
  if (pts && pts.length >= 2) ROUTES[id] = prepare(pts);
}

// ---------- Mga setting ng demo ----------
const TICK_MS = 1000;
const NPC_SPEED = 28; // m/s (mas mabilis sa totoo para kita ang galaw)
const ME_SPEED = 30;
const PAUSE = 4;
const BLUR_STEP = 0.003;
const BLUR_M = 250;
const TTL_MS = 10 * 60 * 1000;
const MIN_FARE = 20;
const RATE = 0.2;

const NPCS = [
  { id: 'n1', plate: 'DEMO-11', route: 'A', dir: 1 },
  { id: 'n2', plate: 'DEMO-12', route: 'A', dir: -1 },
  { id: 'n3', plate: 'DEMO-13', route: 'B', dir: 1 },
  { id: 'n4', plate: 'DEMO-14', route: 'C', dir: 1 },
  { id: 'n5', plate: 'DEMO-15', route: 'C', dir: -1 },
].filter((n) => ROUTES[n.route]);

const findShed = (prefix) =>
  SHEDS.find((s) => s.shed_name.toLowerCase().startsWith(prefix)) ?? SHEDS[0];

function initState() {
  const bonbon = findShed('bonbon');
  return {
    npcs: NPCS.map((n, i) => ({
      ...n,
      dist: ROUTES[n.route].total * ((i + 1) / (NPCS.length + 1)),
      pause: 0,
      status: i % 3 === 2 ? 'full' : 'available',
    })),
    me: { online: true, status: 'available', pos: [Number(bonbon.latitude), Number(bonbon.longitude)] },
    request: null,
    signals: {},
    trips: 0,
  };
}

// Kapareho ng pormula ng database (sample na presyo lang)
function computeTrip(lat, lng, destId, passengers, discounted) {
  if (passengers < 1 || passengers > 4) throw new Error('bad_passengers');
  if (discounted < 0 || discounted > passengers) throw new Error('bad_discounted');
  const dst = SHEDS.find((s) => s.id === destId);
  if (!dst) throw new Error('bad_destination');

  let origin = null;
  let od = Infinity;
  for (const s of SHEDS) {
    const d = distanceM([lat, lng], [Number(s.latitude), Number(s.longitude)]);
    if (d < od) { od = d; origin = s; }
  }
  if (od > 6000) throw new Error('outside_area');

  const between = distanceM(
    [Number(origin.latitude), Number(origin.longitude)],
    [Number(dst.latitude), Number(dst.longitude)]
  );
  const regular =
    origin.id === dst.id ? MIN_FARE : Math.ceil(MIN_FARE + 2 * Math.max(0, (between * 1.3) / 1000 - 2));
  const total = Math.round(regular * (passengers - discounted) + regular * (1 - RATE) * discounted);

  return {
    origin_id: origin.id, origin_name: origin.shed_name,
    dest_id: dst.id, dest_name: dst.shed_name,
    regular_fare: regular, total_fare: total, lines: [], is_sample: true,
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
    if (n.dist >= r.total) { n.dist = r.total; n.dir = -1; n.pause = PAUSE; n.status = 'available'; }
    else if (n.dist <= 0) { n.dist = 0; n.dir = 1; n.pause = PAUSE; n.status = 'available'; }
    else if (Math.random() < 0.03) n.status = n.status === 'available' ? 'full' : 'available';
  }

  // Papunta sa sundo kapag tinanggap na
  const rq = s.request;
  if (rq?.status === 'accepted' && !rq.arrived) {
    const d = distanceM(s.me.pos, rq.pickup);
    if (d <= 25) {
      rq.arrived = true;
      s.me.pos = [rq.pickup[0], rq.pickup[1]];
    } else {
      const k = Math.min(1, (ME_SPEED * dt) / d);
      s.me.pos = [
        s.me.pos[0] + (rq.pickup[0] - s.me.pos[0]) * k,
        s.me.pos[1] + (rq.pickup[1] - s.me.pos[1]) * k,
      ];
    }
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
  function createRequest(lat, lng, destId, passengers, discounted) {
    const s = ref.current;
    if (s.request) throw new Error('active_request_exists');
    const trip = computeTrip(lat, lng, destId, passengers, discounted);
    const pickup = [lat, lng];

    // Para laging may driver sa malapit, ililipat ang demo driver kung masyadong malayo
    const d = distanceM(s.me.pos, pickup);
    if (d > 1200) {
      const k = 500 / d;
      s.me.pos = [
        pickup[0] + (s.me.pos[0] - pickup[0]) * k,
        pickup[1] + (s.me.pos[1] - pickup[1]) * k,
      ];
    }

    s.request = {
      id: 'demo-request', status: 'open', pickup,
      origin_name: trip.origin_name, dest_name: trip.dest_name,
      passengers, discounted,
      regular_fare: trip.regular_fare, total_fare: trip.total_fare,
      created: Date.now(), expires: Date.now() + TTL_MS, arrived: false,
    };
    bump();
    emit('created');
  }

  function cancelRequest() {
    ref.current.request = null;
    bump();
  }

  function accept() {
    const rq = ref.current.request;
    if (!rq || rq.status !== 'open') return;
    rq.status = 'accepted';
    rq.arrived = false;
    bump();
    emit('accepted');
  }

  function release() {
    const rq = ref.current.request;
    if (!rq || rq.status !== 'accepted') return;
    rq.status = 'open';
    rq.arrived = false;
    rq.expires = Math.max(rq.expires, Date.now() + 3 * 60 * 1000);
    bump();
  }

  function complete() {
    const s = ref.current;
    if (!s.request || s.request.status !== 'accepted') return;
    s.trips += 1;
    s.request = null;
    bump();
    emit('completed');
  }

  function arrive() {
    const rq = ref.current.request;
    if (!rq || rq.status !== 'accepted') return;
    rq.arrived = true;
    ref.current.me.pos = [rq.pickup[0], rq.pickup[1]];
    bump();
  }

  function ensureRequest() {
    const s = ref.current;
    if (s.request) return;
    const bonbon = findShed('bonbon');
    const libon = findShed('libon');
    try {
      createRequest(Number(bonbon.latitude) + 0.0025, Number(bonbon.longitude) + 0.001, libon.id, 2, 1);
    } catch { /* ignore */ }
  }
  function ensureAccepted() {
    ensureRequest();
    if (ref.current.request?.status === 'open') accept();
  }
  function ensureCompleted() {
    ensureAccepted();
    complete();
  }

  function setOnline(v) { ref.current.me.online = v; bump(); }
  function setStatus(v) { ref.current.me.status = v; bump(); }
  function signal(shedId) { ref.current.signals[shedId] = shedId; bump(); }
  function unsignal(shedId) { delete ref.current.signals[shedId]; bump(); }
  function reset() { ref.current = initState(); bump(); }

  // ---------- Mga view ----------
  const s = ref.current;
  const now = Date.now();
  const rq = s.request;
  const me = s.me;

  const vehicles = s.npcs.map((n) => {
    const p = pointAt(ROUTES[n.route], n.dist);
    return {
      id: n.id, tricycle_plate_number: n.plate, status: n.status,
      verification_status: 'verified',
      current_latitude: p[0], current_longitude: p[1], qr_code_url: null,
    };
  });
  if (me.online) {
    vehicles.push({
      id: 'me', tricycle_plate_number: 'DEMO-DRV', status: me.status,
      verification_status: 'verified',
      current_latitude: me.pos[0], current_longitude: me.pos[1], qr_code_url: DEMO_QR,
    });
  }

  let passengerReq = null;
  if (rq) {
    const accepted = rq.status === 'accepted';
    passengerReq = {
      id: rq.id, status: rq.status, expired: rq.status === 'open' && now > rq.expires,
      pickup_lat: rq.pickup[0], pickup_lng: rq.pickup[1],
      origin_name: rq.origin_name, dest_name: rq.dest_name,
      passengers: rq.passengers, discounted: rq.discounted,
      regular_fare: rq.regular_fare, total_fare: rq.total_fare,
      created_at: new Date(rq.created).toISOString(), expires_at: new Date(rq.expires).toISOString(),
      driver_id: accepted ? 'me' : null,
      driver: accepted
        ? { plate: 'DEMO-DRV', first_name: 'Pedro', toda: 'Demo TODA', lat: me.pos[0], lng: me.pos[1] }
        : null,
    };
  }

  const driverRequests =
    rq && rq.status === 'open' && now <= rq.expires && me.online && me.status === 'available'
      ? [{
          id: rq.id, origin_name: rq.origin_name, dest_name: rq.dest_name,
          passengers: rq.passengers, discounted: rq.discounted, total_fare: rq.total_fare,
          approx_lat: Math.round(rq.pickup[0] / BLUR_STEP) * BLUR_STEP,
          approx_lng: Math.round(rq.pickup[1] / BLUR_STEP) * BLUR_STEP,
          blur_m: BLUR_M,
          distance_m: Math.round(distanceM(me.pos, rq.pickup) / 100) * 100,
          expires_at: new Date(rq.expires).toISOString(), night: false,
        }]
      : [];

  const driverActive =
    rq && rq.status === 'accepted'
      ? {
          id: rq.id, commuter_first_name: 'Ana',
          pickup_lat: rq.pickup[0], pickup_lng: rq.pickup[1],
          origin_name: rq.origin_name, dest_name: rq.dest_name,
          passengers: rq.passengers, discounted: rq.discounted, total_fare: rq.total_fare,
        }
      : null;

  return {
    sheds: SHEDS,
    vehicles, me, passengerReq, driverRequests, driverActive,
    waitingByShed: { ...s.signals },
    terminalWaiting: Object.keys(s.signals).map((id) => ({ id, kind: 'terminal', shedId: id })),
    trips: s.trips,
    api: {
      estimateTrip: async (lat, lng, dest, p, d) => computeTrip(lat, lng, dest, p, d),
      createRequest: async (lat, lng, dest, p, d) => createRequest(lat, lng, dest, p, d),
      snapToRoad: async () => null,
    },
    cancelRequest, accept, release, complete, arrive,
    ensureRequest, ensureAccepted, ensureCompleted,
    setOnline, setStatus, signal, unsignal, reset,
  };
}