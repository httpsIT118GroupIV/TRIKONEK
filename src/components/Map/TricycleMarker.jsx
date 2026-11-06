import { Marker, Popup } from 'react-leaflet';
import { useLang } from '../../context/LanguageContext';
import { tricycleIcon } from './icons';

export default function TricycleMarker({ driver, onPay }) {
  const { t } = useLang();
  if (driver.current_latitude == null || driver.current_longitude == null) return null;

  const available = driver.status === 'available';

  return (
    <Marker
      position={[driver.current_latitude, driver.current_longitude]}
      icon={tricycleIcon(available)}
    >
      <Popup>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('map.tricycle')}</p>
        <p className="text-lg font-extrabold tracking-wider">{driver.tricycle_plate_number}</p>
        <span
          className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
            available ? 'bg-green-50 text-available' : 'bg-rose-50 text-full'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${available ? 'bg-available' : 'bg-full'}`} />
          {available ? t('map.availableDesc') : t('map.fullDesc')}
        </span>
        <button
          onClick={() => onPay(driver.id)}
          className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-ink active:scale-[0.98]"
        >
          💵 {t('map.pay')}
        </button>
      </Popup>
    </Marker>
  );
}