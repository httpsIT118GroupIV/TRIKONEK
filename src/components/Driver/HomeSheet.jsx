import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
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
  driver, verified, busy, moving, error, active, requestProps,
  onOnline, onAccepting, onStatus,
  showDemo, sheds, spot, onPickSpot,
}) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const online = !!driver.is_online;
  const accepting = !!driver.accepting_requests;
  const isAvail = driver.status === 'available';

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

        {active && (
          <div className="[&>section]:border-0 [&>section]:p-0 [&>section]:shadow-none">
            <DriverRequests {...requestProps} />
          </div>
        )}

        {/* Online */}
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

            {(driver.line || true) && (
              <div className="flex items-center gap-3 rounded-2xl bg-brand-soft px-3 py-2.5">
                <span className="text-lg">🛣️</span>
                <p className="min-w-0 flex-1 text-xs font-bold leading-snug">
                  {driver.line ? t(`line.${driver.line}`) : t('profile.lineNone')}
                </p>
                <TripsChip />
              </div>
            )}

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