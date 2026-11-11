import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

function useNow() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function mmss(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function DriverRequests({
  active, requests, isOnline, isFull, moving, busy, onAccept, onRelease, onComplete,
}) {
  const { t } = useLang();
  const now = useNow();

  if (active) {
    return (
      <section className="card space-y-3 border-2 border-amber-400">
        <p className="text-xs font-bold uppercase tracking-wide text-accent">{t('drv.activeTitle')}</p>
        <h3 className="text-xl font-extrabold leading-tight">
          🧍 {t('drv.pickingUp').replace('{name}', active.commuter_first_name || '')}
        </h3>
        <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-sm">
          <p>📍 {t('drv.areaNote').replace('{name}', active.origin_name)}</p>
          <p>➡️ {t('drv.toDest').replace('{name}', active.dest_name)}</p>
          <p>
            👥 {t('req.pax').replace('{n}', active.passengers)}
            {active.discounted > 0 && ` · ${t('req.discountedCount').replace('{n}', active.discounted)}`}
          </p>
          <p className="font-bold">💰 {t('drv.fare')}: {peso(active.total_fare)}</p>
        </div>
        <a
          className="btn-dark flex items-center justify-center"
          target="_blank"
          rel="noreferrer"
          href={`https://www.google.com/maps/dir/?api=1&destination=${active.pickup_lat},${active.pickup_lng}&travelmode=driving`}
        >
          🗺️ {t('drv.navigate')}
        </a>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" disabled={busy}
            onClick={() => window.confirm(t('drv.confirmRelease')) && onRelease(active.id)}>
            {t('drv.release')}
          </button>
          <button className="btn-primary" disabled={busy} onClick={() => onComplete(active.id)}>
            {t('drv.done')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="card space-y-3">
      <h3 className="text-base font-extrabold">{t('drv.reqTitle')}</h3>

      {!isOnline ? (
        <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('drv.goOnlineMap')}</p>
      ) : isFull ? (
        <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-accent">{t('drv.fullNoRequests')}</p>
      ) : requests.length === 0 ? (
        <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('drv.reqNone')}</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id} className="space-y-2 rounded-2xl border border-black/5 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">📍 {formatDistance(r.distance_m)} · {t('drv.areaNote').replace('{name}', r.origin_name)}</p>
                  <p className="text-sm text-gray-600">➡️ {t('drv.toDest').replace('{name}', r.dest_name)}</p>
                  <p className="text-sm text-gray-600">
                    👥 {t('req.pax').replace('{n}', r.passengers)} · <span className="font-bold text-ink">{peso(r.total_fare)}</span>
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-accent">
                  {mmss(new Date(r.expires_at).getTime() - now)}
                </span>
              </div>
              <button className="btn-primary" disabled={busy || moving} onClick={() => onAccept(r.id)}>
                {t('drv.accept')}
              </button>
              {moving && <p className="text-xs font-semibold text-accent">{t('drv.stopToAccept')}</p>}
            </li>
          ))}
        </ul>
      )}

      {isOnline && !isFull && (
        <p className="text-xs text-gray-500">
          {t('drv.fuzzyNote')}
          {requests[0]?.night && ` ${t('drv.nightNote')}`}
        </p>
      )}
    </section>
  );
}