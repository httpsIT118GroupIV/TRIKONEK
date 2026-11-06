import { useLang } from '../../context/LanguageContext';

export default function StatusToggle({ status, onChange, disabled }) {
  const { t } = useLang();
  const isAvailable = status === 'available';

  return (
    <section className="card">
      <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">{t('seat.title')}</h3>

      <div
        className={`mt-3 flex items-center gap-3 rounded-2xl p-4 ${
          isAvailable ? 'bg-green-50' : 'bg-rose-50'
        }`}
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${
            isAvailable ? 'bg-available' : 'bg-full'
          }`}
        >
          {isAvailable ? '🪑' : '🚫'}
        </span>
        <div>
          <p className={`text-xl font-extrabold leading-tight ${isAvailable ? 'text-available' : 'text-full'}`}>
            {isAvailable ? t('seat.available') : t('seat.full')}
          </p>
          <p className="text-sm text-gray-600">
            {isAvailable ? t('seat.availableDesc') : t('seat.fullDesc')}
          </p>
        </div>
      </div>

      <button
        onClick={() => onChange(isAvailable ? 'full' : 'available')}
        disabled={disabled}
        className={`mt-4 ${isAvailable ? 'btn-danger' : 'btn-primary'}`}
      >
        {isAvailable ? t('seat.markFull') : t('seat.markAvailable')}
      </button>
    </section>
  );
}