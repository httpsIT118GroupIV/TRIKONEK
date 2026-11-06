import { useLang } from '../../context/LanguageContext';

export default function ShiftSwitch({ isOnline, onChange, disabled }) {
  const { t } = useLang();
  return (
    <section className="card">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t('shift.title')}</h3>

      <div className="mt-3 flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          {isOnline && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-available opacity-60" />
          )}
          <span className={`relative inline-flex h-3 w-3 rounded-full ${isOnline ? 'bg-available' : 'bg-gray-400'}`} />
        </span>
        <div>
          <p className="text-lg font-extrabold leading-tight">
            {isOnline ? t('shift.online') : t('shift.offline')}
          </p>
          <p className="text-sm text-gray-500">
            {isOnline ? t('shift.onlineDesc') : t('shift.offlineDesc')}
          </p>
        </div>
      </div>

      <button
        onClick={() => onChange(!isOnline)}
        disabled={disabled}
        className={`mt-4 ${isOnline ? 'btn-ghost' : 'btn-primary'}`}
      >
        {isOnline ? t('shift.goOffline') : t('shift.goOnline')}
      </button>
    </section>
  );
}