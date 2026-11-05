// Patakbuhin: node scripts/buildRoutes.mjs   (Node 18 pataas)
import { writeFileSync, mkdirSync } from 'node:fs';

// APPROXIMATE ito (sentro ng barangay). Itama sa Step 3.
const TERMINALS = [
  { name: 'Buga Terminal',        zone: 'Lakeside',       lat: 13.2962, lng: 123.3595 },
  { name: 'Nogpo Terminal',       zone: 'Lakeside',       lat: 13.2885, lng: 123.3734 },
  { name: 'Bonbon Terminal',      zone: 'Lakeside',       lat: 13.2788, lng: 123.4042 },
  { name: 'Libon Terminal',       zone: 'Centrong Libon', lat: 13.2998, lng: 123.4384 },
  // Idagdag dito ang pangalawang Libon terminal kapag alam mo na ang lugar niya
  { name: 'Bacolod Terminal',     zone: 'Libon–Bacolod',  lat: 13.2706, lng: 123.4431 },
  { name: 'Polangui Terminal',    zone: 'Libon–Polangui', lat: 13.2956, lng: 123.4856 },
];

// Mga ruta: pangalan ng terminal ayon sa daan (gagawin ang dalawang direksyon sa simulator)
const ROUTES = {
  A: ['Buga Terminal', 'Nogpo Terminal', 'Bonbon Terminal', 'Libon Terminal'],
  B: ['Bacolod Terminal', 'Libon Terminal'],
  C: ['Libon Terminal', 'Polangui Terminal'],
};

// ---- Huwag nang galawin ang nasa ibaba ----
const byName = Object.fromEntries(TERMINALS.map((t) => [t.name, t]));

if (TERMINALS.some((t) => !t.lat || !t.lng)) {
  console.error('May terminal na walang coordinates.');
  process.exit(1);
}

const esc = (s) => s.replace(/'/g, "''");
const rows = TERMINALS.map(
  (t) => `  ('${esc(t.name)}', ${t.lat}, ${t.lng}, '${esc(t.zone)}')`
).join(',\n');
mkdirSync('database', { recursive: true });
writeFileSync(
  'database/seed_terminals.sql',
  `delete from public.commuter_signals;\ndelete from public.waiting_sheds;\n\n` +
    `insert into public.waiting_sheds (shed_name, latitude, longitude, route_zone) values\n${rows};\n`
);

mkdirSync('src/simulation', { recursive: true });
const out = {};
for (const [id, names] of Object.entries(ROUTES)) {
  const coords = names
    .map((n) => {
      if (!byName[n]) throw new Error(`Walang terminal na "${n}"`);
      return `${byName[n].lng},${byName[n].lat}`;
    })
    .join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error(`Ruta ${id}: ${data.code} ${data.message ?? ''}`);
  out[id] = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);
  console.log(`Ruta ${id}: ${out[id].length} puntos`);
}
writeFileSync('src/simulation/routes.json', JSON.stringify(out));
console.log('Tapos: database/seed_terminals.sql at src/simulation/routes.json');