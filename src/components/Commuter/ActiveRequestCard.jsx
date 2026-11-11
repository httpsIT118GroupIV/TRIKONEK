import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { distanceM, formatDistance } from '../../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

export default function ActiveRequestCard({ req, busy, onCancel, onPay }) {
  const { t } = useLang();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, new Date(req.expires_at).getTime() - now);
  const mm = String(Math.floor(left / 60000)).padStart(2, '0');
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
  const expired = req.status === 'open' && (req.expired || left === 0);

  const trip = (
    <p className="text-sm text-gray-600">
      {t('req.heading').replace('{name}', req.dest_name)} · {t('req.pax').replace('{n}', req.passengers)} ·{' '}
      <span className="font-bold text-ink">{peso(req.total_fare)}</span>
    </p>
  );

  if (req.status === 'accepted' && req.driver) {
    const drv = req.driver;
    const dist =
      drv.lat != null && drv.lng != null
        ? distanceM([Number(drv.lat), Number(drv.lng)], [req.pickup_lat, req.pickup_lng])
        : null;
    const mins = dist != null ? Math.max(1, Math.ceil(dist / 330)) : null;

    return (
      <div className="card space-y-3 shadow-lg">
        <p className="font-extrabold text-available">✅ {t('req.accepted')}</p>
        <div className="rounded-2xl bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500">{t('req.plate')}</p>
          <p className="text-3xl font-extrabold tracking-wide">{drv.plate}</p>
          <p className="text-sm text-gray-600">
            {drv.first_name}{drv.toda ? ` · ${drv.toda}` : ''}
          </p>
          {dist != null && (
            <p className="mt-1 text-sm font-semibold">
              {t('req.away').replace('{d}', formatDistance(dist)).replace('{m}', mins)}
            </p>
          )}
        </div>
        {trip}
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs text-accent">{t('req.checkSticker')}</p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" disabled={busy} onClick={onCancel}>{t('req.cancel')}</button>
          <button className="btn-primary" onClick={() => onPay(req.driver_id)}>{t('req.pay')}</button>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="card space-y-3 shadow-lg">
        <p className="font-bold">{t('req.noTaker')}</p>
        <button className="btn-primary" disabled={busy} onClick={onCancel}>{t('req.close')}</button>
      </div>
    );
  }

  return (
    <div className="card space-y-3 shadow-lg">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
        <div>
          <p className="font-bold">{t('req.finding')}</p>
          <p className="text-xs text-gray-500">{t('req.leftTime').replace('{t}', `${mm}:${ss}`)}</p>
        </div>
      </div>
      {trip}
      <button className="btn-ghost" disabled={busy} onClick={onCancel}>{t('req.cancel')}</button>
    </div>
  );
}