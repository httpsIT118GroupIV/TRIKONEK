import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyDriver, updateDriver, uploadQr } from '../services/driverService';
import StatusToggle from '../components/Driver/StatusToggle';
import ShiftSwitch from '../components/Driver/ShiftSwitch';
import QrUpload from '../components/Driver/QrUpload';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const userId = session.user.id;

  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyDriver(userId)
      .then(setDriver)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  // Habang Online, i-update ang lokasyon (max isang beses kada 5 segundo)
  useEffect(() => {
    if (!driver?.is_online || !navigator.geolocation) return;
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
      <QrUpload
        qrUrl={driver.qr_code_url}
        disabled={busy}
        onUpload={(file) => run(() => uploadQr(userId, file))}
      />

      <button onClick={signOut} style={{ marginTop: 8 }}>Sign out</button>
    </div>
  );
}