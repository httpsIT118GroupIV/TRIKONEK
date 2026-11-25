import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { myTripsToday } from '../../services/stickerService';

export default function TripsChip() {
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
    <div className="shrink-0 border-l border-black/10 pl-3 text-right">
      <p className="text-sm font-extrabold leading-tight">₱{Number(s.total).toLocaleString('en-PH')}</p>
      <p className="text-[11px] text-gray-500">{t('drv.tripsShort').replace('{n}', s.count)}</p>
    </div>
  );
}