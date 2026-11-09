// Patakbuhin: npm run simulate   (Ctrl+C para itigil)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// ---------- Mga setting ----------
const TICK_MS = 2000;   // gaano kadalas mag-update
const SPEED_MPS = 30;   // metro/segundo. Mas mabilis sa totoo (mga 8) para kita ang galaw sa demo
const PAUSE_TICKS = 5;  // titigil sa terminal: 5 x 2s = 10 segundo

// Pangalan ng terminal ayon sa daan. Dapat eksakto sa shed_name sa database.
const ROUTES = {
  A: ['Buga Terminal', 'Nogpo Terminal', 'Bonbon Terminal', 'Libon Terminal'],
  B: ['Bacolod Terminal', 'Libon Terminal'],
  C: ['Libon Terminal', 'Polangui Terminal'],
};

const FLEET = [
  { plate: 'DEMO-01', route: 'A' },
  { plate: 'DEMO-02', route: 'A' },
  { plate: 'DEMO-03', route: 'B' },
  { plate: 'DEMO-04', route: 'C' },
  { plate: 'DEMO-05', route: 'C' },
];

// ---------- .env ----------
function loadEnv() {
  try {
    const text = readFileSync('.env', 'utf8').replace(/^\uFEFF/, '');
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* walang .env */ }
}
loadEnv();

const SUPA_URL = process.env.VITE_SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPA_URL || !SUPA_KEY) {
  console.error('Kulang ang VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY sa .env');
  process.exit(1);
}
const sb = createClient(SUPA_URL, SUPA_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ---------- Geometry ----------
const R = 6371000;
const toRad = (d) => (d * Math.PI) / 180;
function haversine(a, b) {
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function prepare(points) {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + haversine(points[i - 1], points[i]));
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

// ---------- Mga ruta (OSRM, naka-cache para hindi na kailangan ng internet sa susunod) ----------
const CACHE = 'scripts/.route-cache.json';
const readCache = () => (existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {});

async function getRoute(id, names, byName) {
  const pts = names.map((n) => {
    const t = byName[n];
    if (!t) {
      throw new Error(
        `Walang terminal na "${n}" sa database.\nMga pangalan na meron: ${Object.keys(byName).join(', ')}`
      );
    }
    return [Number(t.latitude), Number(t.longitude)];
  });
  const key = JSON.stringify(pts);
  const cache = readCache();
  if (cache[id]?.key === key) return cache[id].points;

  const coords = pts.map(([lat, lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const data = await (await fetch(url)).json();
  if (data.code !== 'Ok') throw new Error(`Ruta ${id}: ${data.code} ${data.message ?? ''}`);
  const points = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  cache[id] = { key, points };
  writeFileSync(CACHE, JSON.stringify(cache));
  return points;
}

// ---------- Demo drivers ----------
async function ensureDriver(plate) {
  const { error } = await sb.auth.admin.createUser({
    email: `${plate.toLowerCase()}@example.com`,
    password: 'Demo12345!',
    email_confirm: true,
    user_metadata: { username: plate, role: 'driver', plate_number: plate },
  });
  if (error && !/already|registered|exists/i.test(error.message)) throw error;
  const { data, error: e2 } = await sb
    .from('drivers')
    .select('id')
    .eq('tricycle_plate_number', plate)
    .single();
  if (e2) throw e2;
  await sb.from('drivers').update({ verification_status: 'verified' }).eq('id', data.id);
  return data.id;
}

// ---------- Galaw ----------
function step(t) {
  if (t.pause > 0) {
    t.pause--;
    if (t.pause === 0) t.status = Math.random() < 0.4 ? 'full' : 'available';
    return;
  }
  t.dist += t.dir * SPEED_MPS * (TICK_MS / 1000);
  if (t.dist >= t.route.total) {
    t.dist = t.route.total; t.dir = -1; t.pause = PAUSE_TICKS; t.status = 'available';
  } else if (t.dist <= 0) {
    t.dist = 0; t.dir = 1; t.pause = PAUSE_TICKS; t.status = 'available';
  } else if (Math.random() < 0.03) {
    t.status = t.status === 'available' ? 'full' : 'available';
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const { data: sheds, error } = await sb
    .from('waiting_sheds')
    .select('shed_name, latitude, longitude');
  if (error) throw error;
  const byName = Object.fromEntries(sheds.map((s) => [s.shed_name, s]));

  const routes = {};
  for (const [id, names] of Object.entries(ROUTES)) {
    routes[id] = prepare(await getRoute(id, names, byName));
    console.log(`Ruta ${id}: ${(routes[id].total / 1000).toFixed(1)} km`);
  }

  const fleet = [];
  for (const [i, f] of FLEET.entries()) {
    const id = await ensureDriver(f.plate);
    const route = routes[f.route];
    fleet.push({
      id, plate: f.plate, route,
      dist: Math.random() * route.total,
      dir: i % 2 === 0 ? 1 : -1,
      pause: 0,
      status: 'available',
    });
  }
  console.log(`${fleet.length} demo tricycle ang tumatakbo. Ctrl+C para itigil.`);

  let running = true;
  let inFlight = Promise.resolve();

  const stop = async () => {
    if (!running) return;
    running = false;
    console.log('\nPinapatay ang mga demo tricycle...');
    await inFlight;
    await sb.from('drivers').update({ is_online: false }).in('id', fleet.map((t) => t.id));
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);

  async function tick() {
    fleet.forEach(step);
    const results = await Promise.all(
      fleet.map((t) => {
        const [lat, lng] = pointAt(t.route, t.dist);
        return sb.from('drivers').update({
          is_online: true,
          status: t.status,
          current_latitude: lat,
          current_longitude: lng,
          updated_at: new Date().toISOString(),
        }).eq('id', t.id);
      })
    );
    results.forEach((r) => r.error && console.error('Update error:', r.error.message));
  }

  while (running) {
    inFlight = tick();
    await inFlight;
    await sleep(TICK_MS);
  }
}

main().catch((e) => {
  console.error(e.message ?? e);
  process.exit(1);
});