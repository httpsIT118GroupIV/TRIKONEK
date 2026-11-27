import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

export default function DriverRentals({ open, mine, waiting, online, busy, onAccept, onWithdraw, onShowRoute }) {
  const { t, lang } = useLang();
  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  const byShed = {};
  (waiting || []).forEach((w) => {
    byShed[w.shedId] = byShed[w.shedId] || { name: w.name, n: 0 };
    byShed[w.shedId].n += 1;
  });
  const waitList = Object.values(byShed);

  return (
    <>
      <section className="card space-y-3">
        <h3 className="text-base font-extrabold">🎉 {t('drv.rentTitle')}</h3>
        {open.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('drv.rentNone')}</p>
        ) : (
          <ul className="space-y-3">
            {open.map((r) => (
              <li key={r.id} className="space-y-2 rounded-2xl border border-black/5 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">📅 {fmt(r.event_at)}</p>
                    <p className="text-sm text-gray-600">
                      📍 {t('drv.rentNear').replace('{d}', formatDistance(r.distance_m)).replace('{name}', r.origin_name || '')}
                    </p>
                    <p className="truncate text-sm text-gray-600">➡️ {r.dest_note}</p>
                    <p className="text-sm font-bold">{t('drv.rentFare').replace('{n}', Number(r.flat_fare).toLocaleString('en-PH'))}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-accent">
                    {t('drv.rentTaken').replace('{a}', r.accepted).replace('{n}', r.trucks)}
                  </span>
                </div>
                <button className="btn-primary" disabled={busy} onClick={() => onAccept(r.id)}>
                  {t('drv.rentAccept')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card space-y-3">
        <h3 className="text-base font-extrabold">✅ {t('drv.rentMine')}</h3>
        {mine.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('drv.rentMineNone')}</p>
        ) : (
          <ul className="space-y-3">
            {mine.map((r) => (
              <li key={r.id} className="space-y-2 rounded-2xl border-2 border-emerald-200 p-3">
                <p className="font-bold">📅 {fmt(r.event_at)}</p>
                <div className="space-y-1 rounded-xl bg-gray-50 p-3 text-sm">
                  <p>👤 {t('drv.rentCustomer')}: <b>{r.customer}</b></p>
                  {r.pickup_note && <p>📍 {r.pickup_note}</p>}
                  <p>➡️ {r.dest_note}</p>
                  <p>🛺 {t('drv.rentTaken').replace('{a}', r.accepted).replace('{n}', r.trucks)}</p>
                  <p className="font-bold">💰 {peso(r.flat_fare)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <a className="btn-dark flex items-center justify-center" href={`tel:${r.phone}`}>
                    📞 {t('drv.rentCall')}
                  </a>
                  <button className="btn-primary" onClick={() => onShowRoute(r.id)}>
                    🗺️ {t('drv.showRoute')}
                  </button>
                </div>
                {r.can_withdraw ? (
                  <button
                    className="w-full text-center text-sm font-bold text-full underline"
                    disabled={busy}
                    onClick={() => window.confirm(t('drv.confirmWithdraw')) && onWithdraw(r.id)}
                  >
                    {t('drv.rentWithdraw')}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-gray-500">{t('drv.rentWithdrawNote')}</p>
      </section>

      <section className="card space-y-2">
        <h3 className="text-base font-extrabold">🧍 {t('drv.rentWaitTitle')}</h3>
        {!online || waitList.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">
            {online ? t('drv.rentWaitNone') : t('drv.goOnlineMap')}
          </p>
        ) : (
          <ul className="space-y-1.5">
            {waitList.map((w) => (
              <li key={w.name} className="flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2 text-sm">
                <span className="font-semibold">🚏 {w.name}</span>
                <span className="font-bold text-accent">{t('drv.rentWaitAt').replace('{n}', w.n)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}