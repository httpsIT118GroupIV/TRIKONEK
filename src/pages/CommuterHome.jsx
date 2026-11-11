import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  getSheds, getOnlineDrivers, getMyWaitingSignals, sendSignal, sendRoadsideSignal,
  cancelSignal, snapToRoad, isInsideArea, MAX_ROAD_M,
} from '../services/mapService';
import MapView from '../components/Map/MapView';
import RoadsideLayer from '../components/Map/RoadsideLayer';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import LanguageToggle from '../components/common/LanguageToggle';
import SideMenu from '../components/common/SideMenu';

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

  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState(null);
  const [locating, setLocating] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [menuOpen, setMenuOpen] = useState(false);

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
    // Para mawala ang expired na signal at gumalaw ang countdown
    const tick = setInterval(() => {
      setNow(Date.now());
      refreshSignals();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
      clearInterval(tick);
    };
  }, [refreshDrivers, refreshSignals]);

  const shedSignals = signals.filter((s) => s.shed_id);
  const roadside = signals.filter((s) => !s.shed_id && s.latitude != null);
  const waitingByShed = Object.fromEntries(shedSignals.map((s) => [s.shed_id, s.id]));
  const payDriver = drivers.find((d) => d.id === payId);
  const active = roadside[0] ?? null;
  const minsLeft = active
    ? Math.max(0, Math.ceil((new Date(active.expires_at).getTime() - now) / 60000))
    : 0;

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

  function startPick() {
    setError('');
    setPicked(null);
    setPicking(true);
  }

  function cancelPick() {
    setPicking(false);
    setPicked(null);
  }

  function locateMe() {
    if (!navigator.geolocation) return setError(t('wait.noGps'));
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPicked([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError(t('wait.gpsFailed'));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function confirmPick() {
    if (!picked) return;
    setBusy(true);
    setError('');
    try {
      if (!isInsideArea(picked[0], picked[1], sheds)) {
        setError(t('wait.outside'));
        return;
      }
      const snap = await snapToRoad(picked[0], picked[1]);
      if (snap && snap.distance > MAX_ROAD_M) {
        setError(t('wait.tooFar'));
        return;
      }
      const [lat, lng] = snap ? [snap.lat, snap.lng] : picked;
      await sendRoadsideSignal(userId, lat, lng);
      setPicking(false);
      setPicked(null);
      refreshSignals();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
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
          extra={
            <RoadsideLayer
              signals={roadside}
              picked={picked}
              picking={picking}
              onPick={setPicked}
              label={t('wait.me')}
            />
          }
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
                onClick={() => setMenuOpen(true)}
                aria-label={t('menu.open')}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-lg text-white"
              >
                ☰
              </button>
              </div>
            </div>
            <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
          </div>

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

      {/* Floating bottom bar: "Dito ako naghihintay" */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md">
          {picking ? (
            <div className="card space-y-3 shadow-lg">
              <p className="font-bold">{t('wait.pickTitle')}</p>
              <button className="btn-ghost" onClick={locateMe} disabled={locating}>
                {locating ? t('wait.locating') : `🎯 ${t('wait.useGps')}`}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button className="btn-ghost" onClick={cancelPick}>{t('wait.cancel')}</button>
                <button className="btn-primary" onClick={confirmPick} disabled={!picked || busy}>
                  {t('wait.confirm')}
                </button>
              </div>
            </div>
          ) : active ? (
            <div className="card flex items-center justify-between gap-3 shadow-lg">
              <div>
                <p className="font-bold">🧍 {t('wait.active')}</p>
                <p className="text-xs text-gray-500">{t('wait.expires').replace('{n}', minsLeft)}</p>
              </div>
              <button
                onClick={() => handleCancel(active.id)}
                disabled={busy}
                className="h-10 shrink-0 rounded-full border border-gray-200 bg-white px-4 text-sm font-bold disabled:opacity-50"
              >
                {t('wait.stop')}
              </button>
            </div>
          ) : (
            <button className="btn-primary shadow-lg" onClick={startPick}>
              📍 {t('wait.here')}
            </button>
          )}
        </div>
      </div>

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}