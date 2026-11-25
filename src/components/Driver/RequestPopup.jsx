import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;
const mmss = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export default function RequestPopup({ request: r, busy, moving, onAccept, onDecline }) {
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = new Date(r.expires_at).getTime() - now;
  const expired = left <= 0;

  useEffect(() => {
    if (expired) onDecline(r.id);
  }, [expired, r.id, onDecline]);

  if (expired) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50">
      <div className="w-full max-w-md rounded-t-[2rem] bg-white px-5 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">🧍 {t('drv.newRequest')}</h3>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-extrabold text-accent">{mmss(left)}</span>
        </div>

        <div className="mt-4 space-y-1.5 rounded-2xl bg-gray-50 p-4 text-sm">
          <p className="font-bold">📍 {formatDistance(r.distance_m)} · {t('drv.areaNote').replace('{name}', r.origin_name)}</p>
          <p>➡️ {t('drv.toDest').replace('{name}', r.dest_name)}</p>
          <p>
            👥 {t('req.pax').replace('{n}', r.passengers)}
            {r.discounted > 0 && ` · ${t('req.discountedCount').replace('{n}', r.discounted)}`}
          </p>
        </div>

        <p className="mt-4 text-center text-3xl font-extrabold">{peso(r.total_fare)}</p>
        <p className="mt-1 text-center text-xs text-gray-500">{t('drv.fuzzyNote')}</p>
        {moving && <p className="mt-2 text-center text-xs font-semibold text-accent">{t('drv.stopToAccept')}</p>}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button className="btn-ghost" disabled={busy} onClick={() => onDecline(r.id)}>{t('drv.decline')}</button>
          <button className="btn-primary" disabled={busy || moving} onClick={() => onAccept(r.id)}>{t('drv.accept')}</button>
        </div>
      </div>
    </div>
  );
}