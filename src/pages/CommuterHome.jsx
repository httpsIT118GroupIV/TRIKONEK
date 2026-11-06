import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  getSheds, getOnlineDrivers, getMyWaitingSignals, sendSignal, cancelSignal,
} from '../services/mapService';
import MapView from '../components/Map/MapView';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import LanguageToggle from '../components/common/LanguageToggle';

export default function CommuterHome() {
  const { session, signOut } = useAuth();
  const { t } = useLang();
  const userId = session.user.id;

  const [sheds, setSheds] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payId, setPayId] = useState(null);

  const refreshDrivers = useCallback(() => {
    getOnlineDrivers().then(setDrivers).catch((e) => setError(e.message));
  }, []);
  const refreshSignals = useCallback(() => {
    getMyWaitingSignals(userId).then(setSignals).catch((e) => setError(e.message));
  }, [userId]);

  useEffect(() => {
    getSheds().then(setSheds).catch((e) => setError(e.message));
    refreshDrivers();
    refreshSignals();

    const channel = supabase
      .channel('drivers-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, refreshDrivers)
      .subscribe();

    const timer = setInterval(refreshDrivers, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [refreshDrivers, refreshSignals]);

  const waitingByShed = Object.fromEntries(signals.map((s) => [s.shed_id, s.id]));
  const payDriver = drivers.find((d) => d.id === payId);

  async function handleSignal(shedId) {
    setBusy(true);
    setError('');
    try { await sendSignal(userId, shedId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleCancel(signalId) {
    setBusy(true);
    setError('');
    try { await cancelSignal(signalId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const legend = [
    { color: 'bg-available', label: t('map.legend.available') },
    { color: 'bg-full', label: t('map.legend.full') },
    { color: 'bg-blue-600', label: t('map.legend.terminal') },
    { color: 'bg-amber-500', label: t('map.legend.signaled') },
  ];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-brand-soft">
      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          sheds={sheds}
          drivers={drivers}
          waitingByShed={waitingByShed}
          busy={busy}
          onSignal={handleSignal}
          onCancel={handleCancel}
          onPay={setPayId}
        />
      </div>

      {/* Floating header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2">
          <div className="rounded-2xl bg-brand p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-2xl">🛺</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold leading-tight">{t('map.title')}</p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                    <span className="h-2 w-2 rounded-full bg-available" />
                    {drivers.length} {t('map.online')}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <LanguageToggle />
                <button
                  onClick={signOut}
                  aria-label={t('common.signOut')}
                  title={t('common.signOut')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white"
                >
                  ⎋
                </button>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {legend.map((l) => (
              <span
                key={l.label}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>

          {error && (
            <p className="rounded-xl bg-white px-4 py-3 text-sm font-medium text-full shadow-lg">{error}</p>
          )}
        </div>
      </div>

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}