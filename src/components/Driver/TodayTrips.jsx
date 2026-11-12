import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { myTripsToday } from '../../services/stickerService';

export default function TodayTrips() {
  const { t } = useLang();
  const [s, setS] = useState(null);

  useEffect(() => {
    const load = () => myTripsToday().then(setS).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  if (!s) return null;
  return (
    <section className="card">
      <p className="text-sm font-semibold text-gray-500">{t('trips.title')}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-3xl font-extrabold leading-none">{s.count}</p>
        <p className="text-sm text-gray-600">
          {t('trips.total')}: <span className="font-bold text-ink">₱{Number(s.total).toLocaleString('en-PH')}</span>
        </p>
      </div>
      <p className="mt-2 text-xs text-gray-500">{t('trips.note')}</p>
    </section>
  );
}