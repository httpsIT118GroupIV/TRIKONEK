import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const MPM = 420;

export default function DriverCard({ driver, row, onPay, onClose }) {
  const { t } = useLang();
  const avail = driver.status === 'available';
  return (
    <div className="pointer-events-auto mx-auto max-w-md space-y-3 rounded-t-[1.75rem] bg-white px-4 pb-4 pt-3 shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
      <div className="mx-auto h-1.5 w-10 rounded-full bg-gray-300" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('map.tricycle')}</p>
          <p className="text-2xl font-extrabold tracking-wider">🛺 {driver.tricycle_plate_number}</p>
        </div>
        <button onClick={onClose} aria-label="Close"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100">✕</button>
      </div>

      <span className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ' +
        (avail ? 'bg-emerald-50 text-available' : 'bg-rose-50 text-full')}>
        ● {avail ? t('map.availableDesc') : t('map.fullDesc')}
      </span>

      <div className="rounded-2xl bg-brand-soft px-3 py-2.5 text-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('tc.route')}</p>
        <p className="font-bold leading-snug">{driver.line ? t(`line.${driver.line}`) : '—'}</p>
        {row?.state === 'coming' && (
          <p className="mt-1 text-xs font-semibold text-gray-600">
            {t('act.coming')} · {formatDistance(row.dist)} · {t('act.eta').replace('{m}', Math.max(1, Math.round(row.dist / MPM)))}
          </p>
        )}
        {row?.state === 'idle' && <p className="mt-1 text-xs font-semibold text-gray-600">{t('act.atTerminal')}</p>}
      </div>

      <button className="btn-primary" onClick={() => onPay(driver.id)}>💵 {t('map.pay')}</button>
    </div>
  );
}