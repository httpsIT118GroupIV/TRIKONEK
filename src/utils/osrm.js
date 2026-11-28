const HOSTS = [
  'https://router.project-osrm.org',
  'https://routing.openstreetmap.de/routed-car',
];

async function one(host, a, b) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(
      `${host}/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`,
      { signal: ctrl.signal }
    );
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes?.length) return null;
    const r = data.routes[0];
    return { coords: r.geometry.coordinates, distance: r.distance, duration: r.duration }; // coords = [lng, lat]
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function osrmRoute(a, b) {
  for (const h of HOSTS) {
    const r = await one(h, a, b);
    if (r) return r;
  }
  return null;
}