import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';
import DriverRequests from './DriverRequests';
import TripsChip from './TripsChip';

function MiniSwitch({ checked }) {
  return (
    <span className={'relative h-6 w-11 shrink-0 rounded-full transition ' + (checked ? 'bg-available' : 'bg-gray-300')}>
      <span className={'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-5' : '')} />
    </span>
  );
}

export default function HomeSheet({
  driver, verified, busy, moving, error, active, requestProps, rentRoute,
  onOnline, onAccepting, onStatus,
  showDemo, sheds, spot, onPickSpot,
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
    useEffect(() => { if (rentRoute) setOpen(false); }, [rentRoute?.rental?.id]); // eslint-disable-line
  const online = !!driver.is_online;
  const accepting = !!driver.accepting_requests;
  const isAvail = driver.status === 'available';

  const routeCard = rentRoute && (() => {
    const r = rentRoute.rental;
    const info = rentRoute.info;
    const leg = (color, label, l, missing) => (
      <div className="rounded-xl bg-white p-2">
        <p className="flex items-center gap-1.5 font-bold">
          <span className={'h-2.5 w-2.5 rounded-full ' + color} />{label}
        </p>
        <p className="text-gray-600">
          {missing
            ? t('drv.routeNoDest')
            : l && l.distance != null
              ? `${formatDistance(l.distance)} · ${Math.max(1, Math.round(l.duration / 60))} min`
              : '…'}
        </p>
      </div>
    );
    return (
      <div className="space-y-2 rounded-2xl border-2 border-violet-200 bg-violet-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{t('drv.routeTitle')}</p>
            <p className="font-bold">👤 {r.customer}</p>
            {r.pickup_note && <p className="truncate text-sm">📍 {r.pickup_note}</p>}
            <p className="truncate text-sm">🏁 {r.dest_note}</p>
          </div>
          <button
            onClick={rentRoute.onClose}
            aria-label={t('drv.routeClose')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {leg('bg-blue-600', t('drv.legPickup'), info?.toPickup, false)}
          {leg('bg-violet-600', t('drv.legDest'), info?.trip, r.dest_lat == null)}
        </div>
        <a className="btn-dark flex items-center justify-center" href={`tel:${r.phone}`}>
          📞 {t('drv.rentCall')}
        </a>
      </div>
    );
  })();

  return (
    <div className="max-h-[62dvh] overflow-y-auto rounded-t-[1.75rem] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle panel"
        className="flex w-full justify-center pb-1 pt-2.5"
      >
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
      </button>

      <div className="space-y-3 px-4 pb-4">
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-full">{error}</p>}
        {!verified && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-accent">{t('verify.notVerified')}</p>}
        {moving && <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-accent">🛑 {t('drv.stopFirst')}</p>}

        {open ? routeCard : rentRoute && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-violet-50 px-3 py-2 text-left text-sm font-bold text-violet-700"
          >
            <span className="truncate">🎉 {t('drv.routeTitle')} · {rentRoute.rental.customer}</span>
            <span>⌃</span>
          </button>
        )}
        
        {active && (
          <div className="[&>section]:border-0 [&>section]:p-0 [&>section]:shadow-none">
            <DriverRequests {...requestProps} />
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-available opacity-60" />}
              <span className={'relative inline-flex h-3 w-3 rounded-full ' + (online ? 'bg-available' : 'bg-gray-400')} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold leading-tight">{online ? t('shift.online') : t('shift.offline')}</p>
              <p className="truncate text-xs text-gray-500">{online ? t('shift.onlineDesc') : t('shift.offlineDesc')}</p>
            </div>
          </div>
          <button
            disabled={busy || !verified}
            onClick={() => onOnline(!online)}
            className={
              'h-11 shrink-0 rounded-full px-5 text-sm font-extrabold transition active:scale-95 disabled:opacity-50 ' +
              (online ? 'bg-gray-100 text-ink' : 'bg-brand text-ink shadow')
            }
          >
            {online ? t('shift.goOffline') : t('shift.goOnline')}
          </button>
        </div>

        {open && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={accepting}
                disabled={busy || !verified}
                onClick={() => onAccepting(!accepting)}
                className="rounded-2xl bg-gray-50 p-3 text-left transition active:scale-[0.98] disabled:opacity-50"
              >
                <p className="text-xs font-semibold text-gray-500">{t('drv.acceptingTitle')}</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-extrabold leading-tight">
                    {accepting ? t('drv.acceptingOn') : t('drv.acceptingOff')}
                  </p>
                  <MiniSwitch checked={accepting} />
                </div>
              </button>

              <button
                type="button"
                disabled={busy || moving}
                onClick={() => onStatus(isAvail ? 'full' : 'available')}
                className={'rounded-2xl p-3 text-left transition active:scale-[0.98] disabled:opacity-50 ' + (isAvail ? 'bg-green-50' : 'bg-rose-50')}
              >
                <p className="text-xs font-semibold text-gray-500">{t('seat.title')}</p>
                <p className={'mt-1 text-sm font-extrabold leading-tight ' + (isAvail ? 'text-available' : 'text-full')}>
                  {isAvail ? '🪑 ' + t('seat.available') : '🚫 ' + t('seat.full')}
                </p>
                <p className="text-[11px] text-gray-500">{t('drv.tapChange')}</p>
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-brand-soft px-3 py-2.5">
              <span className="text-lg">🛣️</span>
              <p className="min-w-0 flex-1 text-xs font-bold leading-snug">
                {driver.line ? t(`line.${driver.line}`) : t('profile.lineNone')}
              </p>
              <TripsChip />
            </div>

            {showDemo && (
              <select value={spot} onChange={onPickSpot} disabled={busy} className="input h-11 appearance-none text-sm">
                <option value="">📍 {t('demo.pick')}</option>
                {sheds.map((s) => (
                  <option key={s.id} value={s.id}>{s.shed_name}</option>
                ))}
              </select>
            )}
          </>
        )}
      </div>
    </div>
  );
}