import routes from '../simulation/routes.json';

const LAT0 = 13.29;
const K = Math.cos((LAT0 * Math.PI) / 180);
const xy = ([lat, lng]) => [lng * 111320 * K, lat * 110574];
const HEADING_FRESH_MS = 2 * 60 * 1000;

function prepare(points) {
  const pts = points.map(xy);
  const cum = [0];
  for (let i = 1; i < pts.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  return { pts, cum };
}

const join = (a, b) => [...a, ...b.slice(1)];
const PATHS = {
  A: prepare(routes.A),
  B: prepare(routes.B),
  C: prepare(routes.C),
  AC: prepare(join(routes.A, routes.C)),
  BC: prepare(join(routes.B, routes.C)),
};

// Pinakamalapit na punto sa ruta: { s: layo sa ruta (m), offset: layo mula sa ruta (m), bearing }
export function project(path, latlng) {
  const p = xy(latlng);
  let best = null;
  for (let i = 0; i < path.pts.length - 1; i++) {
    const a = path.pts[i], b = path.pts[i + 1];
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const len2 = vx * vx + vy * vy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / len2));
    const off = Math.hypot(p[0] - (a[0] + vx * t), p[1] - (a[1] + vy * t));
    if (!best || off < best.offset) {
      best = {
        s: path.cum[i] + t * Math.sqrt(len2),
        offset: off,
        bearing: ((Math.atan2(vx, vy) * 180) / Math.PI + 360) % 360,
      };
    }
  }
  return best;
}

// Hanapin ang rutang dinadaanan mula terminal A papuntang B, at ang direksyon (+1 o -1)
export function tripPath(originLL, destLL, tol = 600) {
  let best = null;
  for (const [key, path] of Object.entries(PATHS)) {
    const o = project(path, originLL);
    const d = project(path, destLL);
    if (o.offset > tol || d.offset > tol) continue;
    const score = o.offset + d.offset;
    if (!best || score < best.score - 50) best = { key, path, score, sO: o.s, sD: d.s };
  }
  if (!best || best.sO === best.sD) return null;
  return { key: best.key, path: best.path, dir: best.sD > best.sO ? 1 : -1 };
}

// state: 'coming' (paparating), 'away' / 'passed' (hindi ipapakita), 'idle' (walang direksyon, nakatigil)
export function approach(trip, refS, driver, pos) {
  const p = project(trip.path, pos);
  if (p.offset > 250) return { state: 'away' };

  const fresh =
    driver.heading_deg != null &&
    driver.heading_at &&
    Date.now() - new Date(driver.heading_at).getTime() < HEADING_FRESH_MS;
  if (!fresh) return { state: 'idle' };

  const diff = ((driver.heading_deg - p.bearing + 540) % 360) - 180;
  const ddir = Math.abs(diff) < 90 ? 1 : -1;
  if (ddir !== trip.dir) return { state: 'away' };

  const gap = (refS - p.s) * trip.dir;
  if (gap < -40) return { state: 'passed' };
  return { state: 'coming', gap: Math.max(0, gap) };
}