import { useCallback, useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { adminRentals, adminCancelRental } from '../../services/rentService';

export default function RentalsPanel() {
  const { t, lang } = useLang();
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  const load = useCallback(() => {
    adminRentals().then((r) => setList(r ?? [])).catch((e) => setError(e.message));
  }, []);
  useEffect(() => { load(); const id = setInterval(load, 10000); return () => clearInterval(id); }, [load]);

  async function cancel(id) {
    if (!window.confirm(t('rent.confirmCancel'))) return;
    try { await adminCancelRental(id); load(); } catch (e) { setError(e.message); }
  }

  return (
    <div className="space-y-3">
      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}
      {list.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-gray-500">{t('admin.empty')}</p>
      ) : list.map((r) => (
        <article key={r.id} className="card space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-bold">📅 {fmt(r.event_at)}</p>
              <p className="truncate text-sm text-gray-600">➡️ {r.dest_note}</p>
              <p className="text-sm text-gray-600">👤 {r.customer} · <a className="underline" href={`tel:${r.phone}`}>{r.phone}</a></p>
              <p className="text-sm text-gray-600">🛺 ×{r.trucks} · ₱{Number(r.flat_fare).toLocaleString('en-PH')} / tricycle</p>
            </div>
            <span className={'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ' +
              (r.status === 'cancelled' ? 'bg-rose-50 text-full' : r.accepted >= r.trucks ? 'bg-emerald-50 text-available' : 'bg-amber-50 text-accent')}>
              {r.status === 'cancelled' ? t('verify.rejected') : t('rent.confirmed').replace('{a}', r.accepted).replace('{n}', r.trucks)}
            </span>
          </div>
          {r.status === 'open' && (
            <button className="w-full text-center text-sm font-bold text-full underline" onClick={() => cancel(r.id)}>
              {t('rent.cancel')}
            </button>
          )}
        </article>
      ))}
    </div>
  );
}