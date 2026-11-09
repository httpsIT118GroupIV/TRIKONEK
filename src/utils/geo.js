const R = 6371000;
const rad = (d) => (d * Math.PI) / 180;

// a at b ay [lat, lng]; ang sagot ay metro
export function distanceM(a, b) {
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function formatDistance(m) {
  return m < 1000 ? `${Math.max(10, Math.round(m / 10) * 10)} m` : `${(m / 1000).toFixed(1)} km`;
}