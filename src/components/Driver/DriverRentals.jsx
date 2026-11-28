import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

function Row({ label, children }) {
  return (
    <div className="ios-row">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold">{children}</span>
    </div>
  );
}

export default function DriverRentals({
  open, mine, waiting, online, busy, onAccept, onWithdraw, onShowRoute, onChat, unread,
}) {
  const { t, lang } = useLang();
  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  const byShed = {};
  (waiting || []).forEach((w) => {
    if (w.kind !== 'terminal') return;
    byShed[w.shedId] = byShed[w.shedId] || { name: w.name, n: 0 };
    byShed[w.shedId].n += 1;
  });
  const waitList = Object.values(byShed);

  return (
    <div className="pb-4">
      {/* Bukas na rental */}
      <p className="ios-head !pt-1">🎉 {t('drv.rentTitle')}</p>
      {open.length === 0 ? (
        <div className="ios-group"><div className="ios-row text-gray-500">{t('drv.rentNone')}</div></div>
      ) : (
        open.map((r) => (
          <div key={r.id} className="mb-3">
            <div className="ios-group">
              <div className="ios-row">
                <span className="font-extrabold">📅 {fmt(r.event_at)}</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-accent">
                  {t('drv.rentTaken').replace('{a}', r.accepted).replace('{n}', r.trucks)}
                </span>
              </div>
              <Row label="📍">
                {t('drv.rentNear').replace('{d}', formatDistance(r.distance_m)).replace('{name}', r.origin_name || '')}
              </Row>
              <Row label="🏁">{r.dest_note}</Row>
              <Row label="💰">{t('drv.rentFare').replace('{n}', Number(r.flat_fare).toLocaleString('en-PH'))}</Row>
            </div>
            <button className="btn-primary mt-2" disabled={busy} onClick={() => onAccept(r.id)}>
              {t('drv.rentAccept')}
            </button>
          </div>
        ))
      )}

      {/* Tinanggap */}
      <p className="ios-head">✅ {t('drv.rentMine')}</p>
      {mine.length === 0 ? (
        <div className="ios-group"><div className="ios-row text-gray-500">{t('drv.rentMineNone')}</div></div>
      ) : (
        mine.map((r) => (
          <div key={r.id} className="mb-3">
            <div className="ios-group">
              <div className="ios-row"><span className="font-extrabold">📅 {fmt(r.event_at)}</span></div>
              <Row label={`👤 ${t('drv.rentCustomer')}`}>{r.customer}</Row>
              {r.pickup_note && <Row label="📍">{r.pickup_note}</Row>}
              <Row label="🏁">{r.dest_note}</Row>
              <Row label="🛺">{t('drv.rentTaken').replace('{a}', r.accepted).replace('{n}', r.trucks)}</Row>
              <Row label="💰">{peso(r.flat_fare)}</Row>

              <button className="ios-row w-full font-semibold" onClick={() => onShowRoute(r.id)}>
                <span>🗺️ {t('drv.showRoute')}</span><span className="text-gray-400">›</span>
              </button>
              <button className="ios-row relative w-full font-semibold" onClick={() => onChat(r)}>
                <span>💬 {t('chat.open')}</span>
                <span className="flex items-center gap-2">
                  {unread?.has(r.id) && <span className="h-2.5 w-2.5 rounded-full bg-full" />}
                  <span className="text-gray-400">›</span>
                </span>
              </button>
              <a className="ios-row font-semibold" href={`tel:${r.phone}`}>
                <span>📞 {t('drv.rentCall')}</span><span className="text-gray-400">›</span>
              </a>
              {r.can_withdraw && (
                <button
                  className="ios-row w-full justify-center font-semibold text-full"
                  disabled={busy}
                  onClick={() => window.confirm(t('drv.confirmWithdraw')) && onWithdraw(r.id)}
                >
                  {t('drv.rentWithdraw')}
                </button>
              )}
            </div>
          </div>
        ))
      )}
      <p className="ios-foot">{t('drv.rentWithdrawNote')}</p>

      {/* Naghihintay sa terminal */}
      <p className="ios-head">🧍 {t('drv.rentWaitTitle')}</p>
      <div className="ios-group">
        {!online || waitList.length === 0 ? (
          <div className="ios-row text-gray-500">{online ? t('drv.rentWaitNone') : t('drv.goOnlineMap')}</div>
        ) : (
          waitList.map((w) => (
            <div key={w.name} className="ios-row">
              <span className="font-semibold">🚏 {w.name}</span>
              <span className="font-bold text-accent">{t('drv.rentWaitAt').replace('{n}', w.n)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}