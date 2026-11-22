import { useLang } from '../../context/LanguageContext';

export default function AcceptingSwitch({ accepting, onChange, disabled }) {
  const { t } = useLang();
  return (
    <section className="card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{t('drv.acceptingTitle')}</p>
          <h3 className="text-lg font-extrabold">
            {accepting ? t('drv.acceptingOn') : t('drv.acceptingOff')}
          </h3>
          <p className="text-sm text-gray-500">
            {accepting ? t('drv.acceptingOnHint') : t('drv.acceptingOffHint')}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={accepting}
          disabled={disabled}
          onClick={() => onChange(!accepting)}
          className={
            'relative h-9 w-16 shrink-0 rounded-full transition disabled:opacity-50 ' +
            (accepting ? 'bg-available' : 'bg-gray-300')
          }
        >
          <span
            className={
              'absolute left-1 top-1 h-7 w-7 rounded-full bg-white shadow transition-transform ' +
              (accepting ? 'translate-x-7' : '')
            }
          />
        </button>
      </div>
    </section>
  );
}