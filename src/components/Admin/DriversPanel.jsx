import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import DriverReviewCard from './DriverReviewCard';
import { listDrivers, setVerification, setLine } from '../../services/adminService';

const TABS = ['pending', 'verified', 'rejected'];

export default function DriversPanel() {
  const { t } = useLang();
  const [drivers, setDrivers] = useState([]);
  const [tab, setTab] = useState('pending');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    return listDrivers()
      .then(setDrivers)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const counts = useMemo(() => {
    const c = { pending: 0, verified: 0, rejected: 0 };
    drivers.forEach((d) => { c[d.verification_status] = (c[d.verification_status] || 0) + 1; });
    return c;
  }, [drivers]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return drivers.filter((d) => {
      if (d.verification_status !== tab) return false;
      if (!needle) return true;
      const hay = [
        d.tricycle_plate_number, d.toda_name, d.franchise_number,
        d.user?.full_name, d.user?.username, d.user?.email, d.user?.phone,
      ].join(' ').toLowerCase();
      return hay.includes(needle);
    });
  }, [drivers, tab, q]);

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      await action();
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {TABS.map((k) => {
          const on = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              aria-pressed={on}
              className={
                'rounded-2xl border-2 px-2 py-3 text-center transition active:scale-[0.98] ' +
                (on ? 'border-brand-dark bg-white shadow-sm' : 'border-transparent bg-white/60')
              }
            >
              <span className="block text-2xl font-extrabold leading-none">{counts[k] || 0}</span>
              <span className="mt-1 block text-xs font-semibold text-gray-600">{t(`verify.${k}`)}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2">
        <input className="input" placeholder={t('admin.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <button
          onClick={load}
          aria-label={t('admin.refresh')}
          title={t('admin.refresh')}
          className="h-12 shrink-0 rounded-xl bg-white px-4 text-lg shadow-sm active:scale-95"
        >
          ↻
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-gray-500">{t('admin.empty')}</p>
      ) : (
        <div className="space-y-3">
          {list.map((d) => (
            <DriverReviewCard
              key={d.id}
              d={d}
              busy={busy}
              onApprove={(line) => run(() => setVerification(d.id, 'verified', line))}
              onReject={() => window.confirm(t('admin.confirmReject')) && run(() => setVerification(d.id, 'rejected'))}
              onRevoke={() => window.confirm(t('admin.confirmRevoke')) && run(() => setVerification(d.id, 'pending'))}
              onReopen={() => run(() => setVerification(d.id, 'pending'))}
              onSetLine={(line) => run(() => setLine(d.id, line))}
            />
          ))}
        </div>
      )}
    </div>
  );
}