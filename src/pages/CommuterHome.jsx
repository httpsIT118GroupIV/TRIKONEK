import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  getSheds, getOnlineDrivers, getMyWaitingSignals, sendSignal, cancelSignal,
} from '../services/mapService';
import { getMyRequest, cancelRequest, rideErrorKey } from '../services/rideService';
import MapView from '../components/Map/MapView';
import RoadsideLayer from '../components/Map/RoadsideLayer';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import RideRequestPanel from '../components/Commuter/RideRequestPanel';
import ActiveRequestCard from '../components/Commuter/ActiveRequestCard';
import LanguageToggle from '../components/common/LanguageToggle';
import SideMenu from '../components/common/SideMenu';

export default function CommuterHome() {
  const { session } = useAuth();
  const { t } = useLang();
  const userId = session.user.id;

  const [sheds, setSheds] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [req, setReq] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payId, setPayId] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState('idle'); // idle | pickup | form
  const [picked, setPicked] = useState(null);

  const refreshDrivers = useCallback(() => {
    getOnlineDrivers().then(setDrivers).catch((e) => setError(e.message));
  }, []);
  const refreshSignals = useCallback(() => {
    getMyWaitingSignals(userId).then(setSignals).catch((e) => setError(e.message));
  }, [userId]);
  const refreshRequest = useCallback(() => {
    getMyRequest().then(setReq).catch(() => {});
  }, []);

  useEffect(() => {
    getSheds().then(setSheds).catch((e) => setError(e.message));
    refreshDrivers();
    refreshSignals();
    refreshRequest();

    const channel = supabase
      .channel('drivers-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, refreshDrivers)
      .subscribe();
    const timer = setInterval(() => { refreshDrivers(); refreshRequest(); }, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [refreshDrivers, refreshSignals, refreshRequest]);

  const shedSignals = signals.filter((s) => s.shed_id);
  const waitingByShed = Object.fromEntries(shedSignals.map((s) => [s.shed_id, s.id]));
  const payDriver = drivers.find((d) => d.id === payId);

  async function handleSignal(shedId) {
    setBusy(true);
    setError('');
    try { await sendSignal(userId, shedId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleCancelSignal(signalId) {
    setBusy(true);
    setError('');
    try { await cancelSignal(signalId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleCancelRequest() {
    if (!req) return;
    setBusy(true);
    setError('');
    try { await cancelRequest(req.id); setReq(null); refreshRequest(); }
    catch (e) { const k = rideErrorKey(e.message); setError(k ? t(k) : e.message); }
    finally { setBusy(false); }
  }

  // Mga pin sa mapa: ang sundo ng aktibong request, o ang pipiliin pa lang
  const pins = req
    ? [{ id: req.id, latitude: req.pickup_lat, longitude: req.pickup_lng }]
    : mode === 'form' && picked
      ? [{ id: 'draft', latitude: picked[0], longitude: picked[1] }]
      : [];

  const legend = [
    { color: 'bg-available', label: t('map.legend.available') },
    { color: 'bg-full', label: t('map.legend.full') },
    { color: 'bg-blue-600', label: t('map.legend.terminal') },
    { color: 'bg-amber-500', label: t('map.legend.signaled') },
  ];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-brand-soft">
      <div className="absolute inset-0">
        <MapView
          sheds={sheds}
          drivers={drivers}
          waitingByShed={waitingByShed}
          busy={busy}
          onSignal={handleSignal}
          onCancel={handleCancelSignal}
          onPay={setPayId}
          extra={
            <RoadsideLayer
              signals={pins}
              picked={picked}
              picking={mode === 'pickup' && !req}
              onPick={setPicked}
              label={t('wait.me')}
            />
          }
        />
      </div>

      {/* Header */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2">
          <div className="rounded-2xl bg-brand p-3 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <button
                  onClick={() => setMenuOpen(true)}
                  aria-label={t('menu.open')}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-lg text-white"
                >
                  ☰
                </button>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold leading-tight">{t('map.title')}</p>
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                    <span className="h-2 w-2 rounded-full bg-available" />
                    {drivers.length} {t('map.online')}
                  </p>
                </div>
              </div>
              <LanguageToggle />
            </div>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {legend.map((l) => (
              <span key={l.label}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
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

      {/* Ibaba: humiling o aktibong request */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md">
          {req ? (
            <ActiveRequestCard req={req} busy={busy} onCancel={handleCancelRequest} onPay={setPayId} />
          ) : (
            <RideRequestPanel
              mode={mode}
              setMode={setMode}
              picked={picked}
              setPicked={setPicked}
              sheds={sheds}
              onCreated={refreshRequest}
            />
          )}
        </div>
      </div>

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </div>
  );
}