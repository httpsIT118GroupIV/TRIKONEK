import { useLang } from '../../context/LanguageContext';

function Switch({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={'relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ' + (checked ? 'bg-available' : 'bg-gray-300')}
    >
      <span className={'absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ' + (checked ? 'translate-x-6' : '')} />
    </button>
  );
}

export default function StatusPanel({ driver, verified, busy, moving, onOnline, onAccepting, onStatus }) {
  const { t } = useLang();
  const online = !!driver.is_online;
  const accepting = !!driver.accepting_requests;

  return (
    <section className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            {online && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-available opacity-60" />}
            <span className={'relative inline-flex h-3 w-3 rounded-full ' + (online ? 'bg-available' : 'bg-gray-400')} />
          </span>
          <div>
            <p className="text-lg font-extrabold leading-tight">{online ? t('shift.online') : t('shift.offline')}</p>
            <p className="text-xs text-gray-500">{online ? t('shift.onlineDesc') : t('shift.offlineDesc')}</p>
          </div>
        </div>
        <Switch checked={online} onChange={onOnline} disabled={busy || !verified} label={t('shift.title')} />
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-black/5 pt-4">
        <div>
          <p className="font-bold leading-tight">{accepting ? t('drv.acceptingOn') : t('drv.acceptingOff')}</p>
          <p className="text-xs text-gray-500">{accepting ? t('drv.acceptingOnHint') : t('drv.acceptingOffHint')}</p>
        </div>
        <Switch checked={accepting} onChange={onAccepting} disabled={busy || !verified} label={t('drv.acceptingTitle')} />
      </div>

      <div className="border-t border-black/5 pt-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('seat.title')}</p>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-gray-100 p-1">
          {['available', 'full'].map((s) => {
            const on = driver.status === s;
            return (
              <button
                key={s}
                disabled={busy || moving}
                onClick={() => !on && onStatus(s)}
                className={
                  'h-10 rounded-full text-sm font-bold transition disabled:opacity-50 ' +
                  (on ? (s === 'available' ? 'bg-available text-white' : 'bg-full text-white') : 'text-gray-600')
                }
              >
                {s === 'available' ? '🪑 ' + t('seat.available') : '🚫 ' + t('seat.full')}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}