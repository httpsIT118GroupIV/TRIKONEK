import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyDriver, updateDriver, uploadQr } from '../services/driverService';
import { getSheds } from '../services/mapService';
import StatusToggle from '../components/Driver/StatusToggle';
import ShiftSwitch from '../components/Driver/ShiftSwitch';
import QrUpload from '../components/Driver/QrUpload';

const USE_REAL_GPS = import.meta.env.VITE_USE_REAL_GPS === 'true';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const userId = session.user.id;

  const [driver, setDriver] = useState(null);
  const [sheds, setSheds] = useState([]);
  const [spot, setSpot] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyDriver(userId)
      .then(setDriver)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    getSheds().then(setSheds).catch(() => {});
  }, [userId]);

  // Totoong GPS: gagana lang kapag VITE_USE_REAL_GPS=true
  useEffect(() => {
    if (!USE_REAL_GPS || !driver?.is_online || !navigator.geolocation) return;
    let last = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - last < 5000) return;
        last = now;
        updateDriver(userId, {
          current_latitude: pos.coords.latitude,
          current_longitude: pos.coords.longitude,
        }).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [driver?.is_online, userId]);

  async function run(action) {
    setBusy(true);
    setError('');
    try {
      setDriver(await action());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function handlePickSpot(e) {
    const id = e.target.value;
    setSpot(id);
    const shed = sheds.find((s) => s.id === id);
    if (!shed) return;
    run(() =>
      updateDriver(userId, {
        current_latitude: shed.latitude,
        current_longitude: shed.longitude,
      })
    );
  }

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (!driver) {
    return (
      <div style={{ padding: 16 }}>
        <p style={{ color: 'crimson' }}>{error || 'Walang driver profile para sa account na ito.'}</p>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
      <h2>Driver Dashboard</h2>
      <p>Plate: <strong>{driver.tricycle_plate_number}</strong></p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      <ShiftSwitch
        isOnline={driver.is_online}
        disabled={busy}
        onChange={(v) => run(() => updateDriver(userId, { is_online: v }))}
      />
      <StatusToggle
        status={driver.status}
        disabled={busy}
        onChange={(s) => run(() => updateDriver(userId, { status: s }))}
      />

      {!USE_REAL_GPS && (
        <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Demo location</h3>
          <p style={{ fontSize: 13, color: '#555' }}>
            Naka-off ang totoong GPS. Pumili ng terminal kung saan ilalagay ang tricycle mo sa mapa.
          </p>
          <select value={spot} onChange={handlePickSpot} disabled={busy} style={{ width: '100%', padding: 8 }}>
            <option value="">Pumili ng terminal…</option>
            {sheds.map((s) => (
              <option key={s.id} value={s.id}>{s.shed_name}</option>
            ))}
          </select>
          <p style={{ fontSize: 13 }}>
            Kasalukuyan:{' '}
            {driver.current_latitude
              ? `${Number(driver.current_latitude).toFixed(4)}, ${Number(driver.current_longitude).toFixed(4)}`
              : 'wala pa'}
          </p>
        </section>
      )}

      <QrUpload
        qrUrl={driver.qr_code_url}
        disabled={busy}
        onUpload={(file) => run(() => uploadQr(userId, file))}
      />

      <button onClick={signOut} style={{ marginTop: 8 }}>Sign out</button>
    </div>
  );
}