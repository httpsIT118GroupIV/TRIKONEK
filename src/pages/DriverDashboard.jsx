import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getMyDriver, updateDriver, uploadQr } from '../services/driverService';
import { getSheds } from '../services/mapService';
import StatusToggle from '../components/Driver/StatusToggle';
import ShiftSwitch from '../components/Driver/ShiftSwitch';
import QrUpload from '../components/Driver/QrUpload';
import DriverHeader from '../components/Driver/DriverHeader';

const USE_REAL_GPS = import.meta.env.VITE_USE_REAL_GPS === 'true';

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const { t } = useLang();
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft">
        <div className="flex items-center gap-3 text-ink/70">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
          {t('driver.loading')}
        </div>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="mx-auto min-h-screen max-w-md bg-brand-soft p-4">
        <div className="card space-y-4">
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">
            {error || t('driver.noProfile')}
          </p>
          <button onClick={signOut} className="btn-dark">{t('common.signOut')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <DriverHeader plate={driver.tricycle_plate_number} />

      <main className="mx-auto -mt-1 max-w-md space-y-4 px-4">
        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>
        )}

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
          <section className="card">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h3 className="text-base font-extrabold">{t('demo.title')}</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t('demo.desc')}</p>
            <select
              value={spot}
              onChange={handlePickSpot}
              disabled={busy}
              className="input mt-3 appearance-none"
            >
              <option value="">{t('demo.pick')}</option>
              {sheds.map((s) => (
                <option key={s.id} value={s.id}>{s.shed_name}</option>
              ))}
            </select>
            <p className="mt-3 text-xs text-gray-500">
              {t('demo.current')}:{' '}
              <span className="font-semibold text-ink">
                {driver.current_latitude
                  ? `${Number(driver.current_latitude).toFixed(4)}, ${Number(driver.current_longitude).toFixed(4)}`
                  : t('demo.none')}
              </span>
            </p>
          </section>
        )}

        <QrUpload
          qrUrl={driver.qr_code_url}
          disabled={busy}
          onUpload={(file) => run(() => uploadQr(userId, file))}
        />

        <button onClick={signOut} className="btn-ghost">{t('common.signOut')}</button>
      </main>
    </div>
  );
}