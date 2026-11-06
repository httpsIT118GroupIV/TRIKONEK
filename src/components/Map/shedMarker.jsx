import { Marker, Popup } from 'react-leaflet';
import { useLang } from '../../context/LanguageContext';
import { shedIcon } from './icons';

export default function ShedMarker({ shed, waiting, busy, onSignal, onCancel }) {
  const { t } = useLang();

  return (
    <Marker position={[shed.latitude, shed.longitude]} icon={shedIcon(waiting)}>
      <Popup>
        <p className="text-base font-extrabold leading-tight">{shed.shed_name}</p>
        {shed.route_zone && <p className="mt-0.5 text-xs text-gray-500">{shed.route_zone}</p>}
        {waiting ? (
          <button
            disabled={busy}
            onClick={onCancel}
            className="mt-3 w-full rounded-full border border-gray-300 bg-white py-2.5 text-sm font-bold text-ink disabled:opacity-50"
          >
            {t('map.cancelSignal')}
          </button>
        ) : (
          <button
            disabled={busy}
            onClick={onSignal}
            className="mt-3 w-full rounded-full bg-brand py-2.5 text-sm font-bold text-ink disabled:opacity-50 active:scale-[0.98]"
          >
            🙋 {t('map.signal')}
          </button>
        )}
      </Popup>
    </Marker>
  );
}