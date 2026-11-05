import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  getSheds, getOnlineDrivers, getMyWaitingSignals, sendSignal, cancelSignal,
} from '../services/mapService';
import MapView from "../components/Map/MapView.jsx";
import PaymentSelector from '../components/Commuter/PaymentSelector';

export default function CommuterHome() {
  const { session, signOut } = useAuth();
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #ddd' }}>
        <div>
          <strong>Libon–Polangui Tricycles</strong>
          <div style={{ fontSize: 12 }}>
            🟢 Available &nbsp; 🔴 Full &nbsp; 🔵 Terminal &nbsp; 🟠 Naka-signal ka
            &nbsp;· {drivers.length} online
          </div>
        </div>
        <button onClick={signOut}>Sign out</button>
      </header>

      {error && <p style={{ color: 'crimson', margin: 8 }}>{error}</p>}

      <div style={{ flex: 1 }}>
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

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}