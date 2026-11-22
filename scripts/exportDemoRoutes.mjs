// Patakbuhin: npm run demo:data   (kailangan ng internet at ng SUPABASE_SERVICE_ROLE_KEY sa .env)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

try {
  const text = readFileSync('.env', 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* walang .env */ }

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Kulang ang VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY sa .env');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

// Dapat eksakto sa shed_name sa database
const ROUTES = {
  A: ['Buga Terminal', 'Nogpo Terminal', 'Bonbon Terminal', 'Libon Terminal'],
  B: ['Bacolod Terminal', 'Libon Terminal'],
  C: ['Libon Terminal', 'Polangui Terminal'],
};

const { data: sheds, error } = await sb
  .from('waiting_sheds')
  .select('id, shed_name, latitude, longitude, route_zone');
if (error) throw error;
const byName = Object.fromEntries(sheds.map((s) => [s.shed_name, s]));

const routes = {};
for (const [id, names] of Object.entries(ROUTES)) {
  const missing = names.filter((n) => !byName[n]);
  if (missing.length) {
    console.warn(`Ruta ${id}: walang terminal na ${missing.join(', ')}. Nilaktawan.`);
    continue;
  }
  const coords = names.map((n) => `${byName[n].longitude},${byName[n].latitude}`).join(';');
  const res = await fetch(
    `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  );
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error(`Ruta ${id}: ${data.code} ${data.message ?? ''}`);
  routes[id] = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  console.log(`Ruta ${id}: ${routes[id].length} puntos`);
}

mkdirSync('src/demo', { recursive: true });
writeFileSync(
  'src/demo/demoData.json',
  JSON.stringify({
    sheds: sheds.map((s) => ({ ...s, latitude: Number(s.latitude), longitude: Number(s.longitude) })),
    routes,
  })
);
console.log('Tapos: src/demo/demoData.json (i-commit ito; walang sikreto sa loob)');