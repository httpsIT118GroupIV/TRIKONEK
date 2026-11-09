import L from 'leaflet';

const shadow = '0 2px 6px rgba(0,0,0,.35)';

export function tricycleIcon(available) {
  const color = available ? '#16A34A' : '#E11D48';
  return L.divIcon({
    className: 'trk-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -38],
    html: `
      <div style="position:relative;width:40px;height:40px">
        <div style="width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid #fff;box-shadow:${shadow}"></div>
        <span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px">🛺</span>
      </div>`,
  });
}

export function shedIcon(waiting) {
  const color = waiting ? '#F59E0B' : '#2563EB';
  return L.divIcon({
    className: 'trk-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
    html: `
      <div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:${shadow};display:flex;align-items:center;justify-content:center;font-size:15px">🚏</div>`,
  });
}
