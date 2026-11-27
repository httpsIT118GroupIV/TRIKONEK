import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap } from 'react-leaflet';
import RouteLayer from './RouteLayer';

const CENTER = [13.29, 123.42];
const FALLBACK = L.latLngBounds([13.26, 123.35], [13.31, 123.5]);

const circle = (emoji, bg, size, badge = 0) =>
  L.divIcon({
    className: '',
    html:
      `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${bg};border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.35);font-size:${Math.round(size / 2)}px">${emoji}` +
      (badge > 0
        ? `<span style="position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 4px;border-radius:9999px;background:#E11D48;color:#fff;font:700 12px/20px sans-serif;text-align:center;border:2px solid #fff">${badge}</span>`
        : '') +
      `</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const shedCache = {};
const shedIcon = (n) => {
  if (!shedCache[n]) shedCache[n] = circle('🚏', n > 0 ? '#F59E0B' : '#2563EB', 32, n);
  return shedCache[n];
};
const ROADSIDE = circle('🧍', '#F59E0B', 38);
const PICKUP = circle('📍', '#F59E0B', 38);
const ME = circle('🛺', '#16A34A', 42);

function BoundsLock({ sheds }) {
  const map = useMap();
  useEffect(() => {
    const pts = sheds.map((s) => [Number(s.latitude), Number(s.longitude)]);
    const base = pts.length ? L.latLngBounds(pts) : FALLBACK;
    const bounds = base.pad(0.25);
    map.setMinZoom(map.getBoundsZoom(bounds));
    map.setMaxBounds(bounds);
    map.fitBounds(bounds);
  }, [sheds, map]);
  return null;
}

function FollowMe({ me, enabled }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (enabled && me && !done.current) {
      done.current = true;
      map.setView(me, Math.max(map.getZoom(), 15));
    }
  }, [me, map, enabled]);
  return null;
}

function RecenterButton({ me, label, fill }) {
  const map = useMap();
  if (!me) return null;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => map.flyTo(me, Math.max(map.getZoom(), 16), { duration: 0.6 })}
      className={
        fill
          ? 'absolute right-[10px] top-[84px] z-[1000] flex h-[34px] w-[34px] items-center justify-center rounded-md border-2 border-black/20 bg-white text-lg active:scale-95'
          : 'absolute bottom-3 left-3 z-[1000] h-10 rounded-full bg-white px-4 text-sm font-bold shadow-lg transition active:scale-95'
      }
    >
      {fill ? '🎯' : `🎯 ${label}`}
    </button>
  );
}

export default function DriverMap({
  sheds, waiting, pickup, me, banner, recenterLabel, meLabel,
  fill = false, route = null, onRouteInfo,
}) {
  const countByShed = {};
  waiting
    .filter((w) => w.kind === 'terminal')
    .forEach((w) => { countByShed[w.shedId] = (countByShed[w.shedId] || 0) + 1; });

  return (
    <div
      className={
        fill
          ? 'absolute inset-0 isolate'
          : 'relative isolate h-[46vh] min-h-[280px] overflow-hidden rounded-2xl shadow-sm'
      }
    >
      <MapContainer
        center={CENTER}
        zoom={13}
        maxZoom={18}
        zoomControl={false}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position={fill ? 'topright' : 'bottomright'} />
        <BoundsLock sheds={sheds} />
        <FollowMe me={me} enabled={!route} />

        {sheds.map((s) => (
          <Marker
            key={s.id}
            position={[Number(s.latitude), Number(s.longitude)]}
            icon={shedIcon(countByShed[s.id] || 0)}
          >
            <Tooltip direction="top" offset={[0, -16]}>{s.shed_name}</Tooltip>
          </Marker>
        ))}

        {waiting
          .filter((w) => w.kind === 'roadside')
          .map((w) => (
            <Marker key={w.id} position={[w.lat, w.lng]} icon={ROADSIDE} />
          ))}

        {pickup && !route && <Marker position={pickup} icon={PICKUP} zIndexOffset={900} />}

        {me && (
          <Marker position={me} icon={ME} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -20]}>{meLabel}</Tooltip>
          </Marker>
        )}

        {route && <RouteLayer {...route} onInfo={onRouteInfo} />}

        <RecenterButton me={me} label={recenterLabel} fill={fill} />
      </MapContainer>

      <div
        className={
          fill
            ? 'pointer-events-none absolute left-3 right-14 top-3 z-[1000]'
            : 'pointer-events-none absolute inset-x-3 top-3 z-[1000]'
        }
      >
        {banner}
      </div>
    </div>
  );
}