import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import {
  getSheds, getOnlineDrivers, getMyWaitingSignals, sendSignal, cancelSignal,
} from '../services/mapService';
import useTricycleFilter from '../hooks/useTricycleFilter';
import MapView from '../components/Map/MapView';
import FlyToLayer from '../components/Map/FlyToLayer';
import RoadsideLayer from '../components/Map/RoadsideLayer';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import ActiveTricycles from '../components/Commuter/ActiveTricycles';
import RentPanel from '../components/Commuter/RentPanel';
import DriverCard from '../components/Commuter/DriverCard';
import Sheet from '../components/Commuter/Sheet';
import AppHeader from '../components/common/AppHeader';
import AppTabs from '../components/common/AppTabs';
import Profile from './Profile';

export default function CommuterHome() {
  const { session } = useAuth();
  const { t } = useLang();
  const userId = session.user.id;

  const [sheds, setSheds] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [signals, setSignals] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [payId, setPayId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const [tab, setTab] = useState('home'); // home | rent | profile
  const [rentMode, setRentMode] = useState('list'); // list | form | pick | pickDest
  const [picked, setPicked] = useState(null);
  const [pickedDest, setPickedDest] = useState(null);

  const f = useTricycleFilter(drivers, sheds);

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
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, [refreshDrivers, refreshSignals]);

  const shedSignals = signals.filter((s) => s.shed_id);
  const waitingByShed = Object.fromEntries(shedSignals.map((s) => [s.shed_id, s.id]));
  const payDriver = drivers.find((d) => d.id === payId);
  const selected = drivers.find((d) => d.id === selectedId) ?? null;
  const selectedRow = f.rows.find((r) => r.driver.id === selectedId) ?? null;

  const dimming = tab === 'home' && f.mode === 'route' && f.ready;
  const highlightIds = dimming ? new Set(f.rows.map((r) => r.driver.id)) : null;

  const pins =
    tab === 'rent' && (rentMode === 'form' || rentMode === 'pickDest') && picked
      ? [{ id: 'draft', latitude: picked[0], longitude: picked[1] }]
      : [];

  function selectDriver(id) {
    const d = drivers.find((x) => x.id === id);
    setSelectedId(id);
    if (d) setFocus({ pos: [Number(d.current_latitude), Number(d.current_longitude)], ts: Date.now() });
  }

  async function handleSignal(shedId) {
    setBusy(true); setError('');
    try { await sendSignal(userId, shedId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  async function handleCancelSignal(signalId) {
    setBusy(true); setError('');
    try { await cancelSignal(signalId); refreshSignals(); }
    catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  const TABS = [
    { id: 'home', icon: '🛺', label: t('tab.home') },
    { id: 'rent', icon: '🎉', label: t('tab.rent') },
    { id: 'profile', icon: '👤', label: t('tab.profile') },
  ];

  const legend = [
    { color: 'bg-available', label: t('map.legend.available') },
    { color: 'bg-full', label: t('map.legend.full') },
    { color: 'bg-blue-600', label: t('map.legend.terminal') },
    { color: 'bg-amber-500', label: t('map.legend.signaled') },
  ];
  if (dimming) legend.push({ color: 'bg-gray-300', label: t('map.fadedNote') });

  return (
    <div className="flex h-dvh flex-col bg-brand-soft">
      <AppHeader badge={`● ${drivers.length} ${t('map.online')}`} />

      {tab !== 'profile' && (
        <div className="relative isolate min-h-0 flex-1">
          <div className="absolute inset-0">
            <MapView
              sheds={sheds}
              drivers={drivers}
              highlightIds={highlightIds}
              waitingByShed={waitingByShed}
              busy={busy}
              onSignal={handleSignal}
              onCancel={handleCancelSignal}
              onSelect={tab === 'home' ? selectDriver : undefined}
              extra={
                <>
                  <RoadsideLayer
                    signals={pins}
                    picked={rentMode === 'pickDest' ? pickedDest : picked}
                    picking={tab === 'rent' && (rentMode === 'pick' || rentMode === 'pickDest')}
                    onPick={rentMode === 'pickDest' ? setPickedDest : setPicked}
                    dest={tab === 'rent' && rentMode === 'form' ? pickedDest : null}
                    label={t('wait.me')}
                  />
                  <FlyToLayer focus={focus} />
                </>
              }
            />
          </div>

          <div className="pointer-events-none absolute left-3 right-14 top-3 z-[1100] space-y-2">
            <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto">
              {legend.map((l) => (
                <span key={l.label}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
                  <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                  {l.label}
                </span>
              ))}
            </div>
            {error && (
              <p className="pointer-events-auto rounded-xl bg-white px-4 py-3 text-sm font-medium text-full shadow-lg">{error}</p>
            )}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100]">
            {tab === 'home' && selected ? (
              <DriverCard
                driver={selected}
                row={selectedRow}
                onPay={setPayId}
                onClose={() => setSelectedId(null)}
              />
            ) : tab === 'home' ? (
              <Sheet key="home" title={t('tab.tricycles')}>
                <ActiveTricycles f={f} sheds={sheds} />
              </Sheet>
            ) : (
              <Sheet key="rent" title={t('rent.title')} forceOpen={rentMode !== 'list'}>
                <RentPanel
                  mode={rentMode} setMode={setRentMode}
                  picked={picked} setPicked={setPicked}
                  pickedDest={pickedDest} setPickedDest={setPickedDest}
                  sheds={sheds}
                />
              </Sheet>
            )}
          </div>
        </div>
      )}

      {tab === 'profile' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Profile embedded />
        </div>
      )}

      <AppTabs tabs={TABS} tab={tab} onChange={(x) => { setTab(x); setSelectedId(null); }} />

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}