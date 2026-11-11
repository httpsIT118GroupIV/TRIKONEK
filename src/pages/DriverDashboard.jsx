import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getMyDriver, updateDriver } from '../services/driverService';
import { getSheds, getActiveSignals } from '../services/mapService';
import {
  driverOpenRequests, driverActiveRequest, acceptRequest, releaseRequest, completeRequest, rideErrorKey,
} from '../services/rideService';
import { formatDistance } from '../utils/geo';
import { alertDriver, unlockAudio } from '../utils/alerts';
import useWakeLock from '../hooks/useWakeLock';
import StatusToggle from '../components/Driver/StatusToggle';
import ShiftSwitch from '../components/Driver/ShiftSwitch';
import DriverHeader from '../components/Driver/DriverHeader';
import ProfileCard from '../components/Driver/ProfileCard';
import DriverMap from '../components/Driver/DriverMap';
import DriverRequests from '../components/Driver/DriverRequests';

const USE_REAL_GPS = import.meta.env.VITE_USE_REAL_GPS === 'true';
const MOVING_KMH = 10; // mas mabilis dito = naka-lock ang Accept at Available/Full

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const { t } = useLang();
  const userId = session.user.id;

  const [driver, setDriver] = useState(null);
  const [sheds, setSheds] = useState([]);
  const [signals, setSignals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState(null);
  const [gps, setGps] = useState(null); // { pos: [lat, lng], speed: m/s | null }
  const [spot, setSpot] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const seen = useRef(new Set());

  useEffect(() => {
    getMyDriver(userId)
      .then(setDriver)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    getSheds().then(setSheds).catch(() => {});
  }, [userId]);

  const isOnline = !!driver?.is_online;
  const verified = driver?.verification_status === 'verified';

  useWakeLock(isOnline);

  // Totoong GPS: gagana lang kapag VITE_USE_REAL_GPS=true
  useEffect(() => {
    if (!USE_REAL_GPS || !isOnline || !navigator.geolocation) return;
    let last = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setGps({ pos: [pos.coords.latitude, pos.coords.longitude], speed: pos.coords.speed });
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
  }, [isOnline, userId]);

  // Mga request: bawat 3 segundo. Ang aktibong sundo ay tinitingnan kahit Offline.
  useEffect(() => {
    if (!verified) {
      setRequests([]);
      setActive(null);
      return;
    }
    let stop = false;
    const load = async () => {
      try {
        const [open, act] = await Promise.all([
          isOnline ? driverOpenRequests() : Promise.resolve([]),
          driverActiveRequest(),
        ]);
        if (!stop) { setRequests(open ?? []); setActive(act ?? null); }
      } catch { /* ignore */ }
    };
    load();
    const timer = setInterval(load, 3000);
    return () => { stop = true; clearInterval(timer); };
  }, [isOnline, verified]);

  // Mga naghihintay sa terminal (pasibo): bilang lang
  useEffect(() => {
    if (!isOnline) {
      setSignals([]);
      return;
    }
    const load = () => getActiveSignals().then(setSignals).catch(() => {});
    load();
    const channel = supabase
      .channel('signals-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commuter_signals' }, load)
      .subscribe();
    const timer = setInterval(load, 5000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(timer);
    };
  }, [isOnline]);

  // Beep at vibration kapag may bagong request, isang beses bawat request
  useEffect(() => {
    for (const r of requests) {
      if (!seen.current.has(r.id)) {
        seen.current.add(r.id);
        alertDriver();
      }
    }
  }, [requests]);

  const me = useMemo(() => {
    if (gps?.pos) return gps.pos;
    if (driver?.current_latitude != null && driver?.current_longitude != null) {
      return [Number(driver.current_latitude), Number(driver.current_longitude)];
    }
    return null;
  }, [gps, driver?.current_latitude, driver?.current_longitude]);

  const waiting = useMemo(
    () =>
      signals
        .filter((s) => s.shed_id)
        .map((s) => {
          const sh = sheds.find((x) => x.id === s.shed_id);
          return sh
            ? { id: s.id, kind: 'terminal', shedId: sh.id, name: sh.shed_name, lat: Number(sh.latitude), lng: Number(sh.longitude) }
            : null;
        })
        .filter(Boolean),
    [signals, sheds]
  );

  const kmh = gps?.speed != null ? gps.speed * 3.6 : 0;
  const moving = kmh > MOVING_KMH;

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

  const rideErr = (e) => {
    const k = rideErrorKey(e.message);
    setError(k ? t(k) : e.message);
  };

  async function accept(id) {
    setBusy(true);
    setError('');
    try {
      setActive(await acceptRequest(id));
      setRequests([]);
    } catch (e) {
      rideErr(e);
      setRequests(await driverOpenRequests().catch(() => []));
    } finally {
      setBusy(false);
    }
  }

  async function finish(fn, id) {
    setBusy(true);
    setError('');
    try {
      await fn(id);
      setActive(null);
      setRequests(await driverOpenRequests().catch(() => []));
    } catch (e) {
      rideErr(e);
    } finally {
      setBusy(false);
    }
  }

  function handlePickSpot(e) {
    unlockAudio();
    const id = e.target.value;
    setSpot(id);
    const shed = sheds.find((s) => s.id === id);
    if (!shed) return;
    setGps(null);
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

  // Ang makikita sa ibabaw ng mapa
  let banner;
  if (active) {
    banner = (
      <div className="rounded-2xl bg-amber-500 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">
          🧍 {t('drv.pickingUp').replace('{name}', active.commuter_first_name || '')}
        </p>
        <p className="text-xs font-semibold text-white/90">{t('drv.toDest').replace('{name}', active.dest_name)}</p>
      </div>
    );
  } else if (requests.length) {
    banner = (
      <div className="rounded-2xl bg-amber-500 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">
          🧍 {t('drv.reqNearby')} · {formatDistance(requests[0].distance_m)}
        </p>
        <p className="text-xs font-semibold text-white/90">
          {t('drv.reqCount').replace('{n}', requests.length)}
        </p>
      </div>
    );
  } else {
    banner = (
      <div className="inline-block rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow">
        {isOnline ? t('drv.reqNone') : t('drv.goOnlineMap')}
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

        {!verified && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-accent">
            {t('verify.notVerified')}
          </p>
        )}

        <ProfileCard driver={driver} />

        <DriverMap
          sheds={sheds}
          waiting={waiting}
          requests={requests}
          pickup={active ? [Number(active.pickup_lat), Number(active.pickup_lng)] : null}
          me={me}
          banner={banner}
          recenterLabel={t('drv.center')}
          meLabel={t('drv.me')}
        />

        <DriverRequests
          active={active}
          requests={requests}
          isOnline={isOnline}
          isFull={driver.status === 'full'}
          moving={moving}
          busy={busy}
          onAccept={accept}
          onRelease={(id) => finish(releaseRequest, id)}
          onComplete={(id) => finish(completeRequest, id)}
        />

        <ShiftSwitch
          isOnline={driver.is_online}
          disabled={busy || !verified}
          onChange={(v) => {
            if (v) unlockAudio();
            run(() => updateDriver(userId, { is_online: v }));
          }}
        />

        {moving && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-accent">
            🛑 {t('drv.stopFirst')}
          </p>
        )}

        <StatusToggle
          status={driver.status}
          disabled={busy || moving}
          onChange={(s) => run(() => updateDriver(userId, { status: s }))}
        />

        {!USE_REAL_GPS && (
          <section className="card">
            <div className="flex items-center gap-2">
              <span className="text-xl">📍</span>
              <h3 className="text-base font-extrabold">{t('demo.title')}</h3>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t('demo.desc')}</p>
            <select value={spot} onChange={handlePickSpot} disabled={busy} className="input mt-3 appearance-none">
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

        <button onClick={signOut} className="btn-ghost">{t('common.signOut')}</button>
      </main>
    </div>
  );
}