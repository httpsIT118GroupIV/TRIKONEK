import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { getMyDriver, updateDriver } from '../services/driverService';
import { getSheds, getActiveSignals } from '../services/mapService';
import {
  driverOpenRequests, driverActiveRequest, releaseRequest, completeRequest, rideErrorKey,
} from '../services/rideService';
import {
  driverOpenRentals, driverMyRentals, acceptRental, withdrawRental, rentErrorKey,
} from '../services/rentService';
import { distanceM, formatDistance, bearingDeg } from '../utils/geo';
import { alertDriver, unlockAudio } from '../utils/alerts';
import useWakeLock from '../hooks/useWakeLock';
import DriverTabs from '../components/Driver/DriverTabs';
import HomeSheet from '../components/Driver/HomeSheet';
import DriverMap from '../components/Driver/DriverMap';
import DriverRequests from '../components/Driver/DriverRequests';
import DriverRentals from '../components/Driver/DriverRentals';
import Profile from './Profile';
import AppHeader from '../components/common/AppHeader'

const USE_REAL_GPS = import.meta.env.VITE_USE_REAL_GPS === 'true';
const MOVING_KMH = 10;

export default function DriverDashboard() {
  const { session, signOut } = useAuth();
  const { t } = useLang();
  const userId = session.user.id;

  const [tab, setTab] = useState('home');
  const [driver, setDriver] = useState(null);
  const [sheds, setSheds] = useState([]);
  const [signals, setSignals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [active, setActive] = useState(null);
  const [rentOpen, setRentOpen] = useState([]);
  const [rentMine, setRentMine] = useState([]);
  const [routeId, setRouteId] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [gps, setGps] = useState(null);
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

  // Rentals
  const loadRentals = useCallback(async () => {
    try {
      const [o, m] = await Promise.all([driverOpenRentals(), driverMyRentals()]);
      setRentOpen(o ?? []);
      setRentMine(m ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!verified) { setRentOpen([]); setRentMine([]); return; }
    loadRentals();
    const id = setInterval(loadRentals, 10000);
    return () => clearInterval(id);
  }, [verified, loadRentals]);

  // Totoong GPS + direksyon
  useEffect(() => {
    if (!USE_REAL_GPS || !isOnline || !navigator.geolocation) return;
    let last = 0;
    let prev = null;
    let latest = null;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const here = [pos.coords.latitude, pos.coords.longitude];
        setGps({ pos: here, speed: pos.coords.speed });

        let heading = null;
        const c = pos.coords;
        if (c.heading != null && !Number.isNaN(c.heading) && (c.speed ?? 0) > 1) heading = c.heading;
        else if (prev && distanceM(prev, here) >= 15) heading = bearingDeg(prev, here);
        if (!prev || distanceM(prev, here) >= 15) prev = here;
        if (heading != null) latest = { h: heading, at: Date.now() };

        const now = Date.now();
        if (now - last < 5000) return;
        last = now;
        updateDriver(userId, { current_latitude: here[0], current_longitude: here[1] }).catch(() => {});
        if (latest && now - latest.at < 15000) {
          updateDriver(userId, { heading_deg: Math.round(latest.h), heading_at: new Date().toISOString() }).catch(() => {});
        }
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [isOnline, userId]);

  // Lumang solo request (naiwan para sa kasalukuyang aktibong sundo, kung meron)
  useEffect(() => {
    if (!verified) { setRequests([]); setActive(null); return; }
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

  // Mga naghihintay sa terminal
  useEffect(() => {
    if (!isOnline) { setSignals([]); return; }
    const load = () => getActiveSignals().then(setSignals).catch(() => {});
    load();
    const channel = supabase
      .channel('signals-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commuter_signals' }, load)
      .subscribe();
    const timer = setInterval(load, 5000);
    return () => { supabase.removeChannel(channel); clearInterval(timer); };
  }, [isOnline]);

  // Beep sa bagong rental
  useEffect(() => {
    for (const r of rentOpen) {
      if (!seen.current.has(r.id)) {
        seen.current.add(r.id);
        alertDriver();
      }
    }
  }, [rentOpen]);

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

  const routeR = rentMine.find((x) => x.id === routeId) ?? null;
  const routeProps = routeR
    ? {
        me,
        pickup: [Number(routeR.pickup_lat), Number(routeR.pickup_lng)],
        dest: routeR.dest_lat != null ? [Number(routeR.dest_lat), Number(routeR.dest_lng)] : null,
      }
    : null;

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

  async function finish(fn, id) {
    setBusy(true);
    setError('');
    try {
      await fn(id);
      setActive(null);
    } catch (e) {
      rideErr(e);
    } finally {
      setBusy(false);
    }
  }

  async function rentAct(fn, id) {
    setBusy(true);
    setError('');
    try { await fn(id); }
    catch (e) { const k = rentErrorKey(e.message); setError(k ? t(k) : e.message); }
    finally { await loadRentals(); setBusy(false); }
  }

  function handlePickSpot(e) {
    unlockAudio();
    const id = e.target.value;
    setSpot(id);
    const shed = sheds.find((s) => s.id === id);
    if (!shed) return;
    setGps(null);
    run(() => updateDriver(userId, { current_latitude: shed.latitude, current_longitude: shed.longitude }));
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

  const reqProps = {
    active, requests, isOnline, moving, busy,
    isFull: driver.status === 'full',
    accepting: !!driver.accepting_requests,
    onAccept: () => {},
    onRelease: (id) => finish(releaseRequest, id),
    onComplete: (id) => finish(completeRequest, id),
  };

  let banner;
  if (routeR) {
    banner = (
      <div className="rounded-2xl bg-violet-600 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">🎉 {t('drv.routeTitle')}</p>
        <p className="truncate text-xs font-semibold text-white/90">🏁 {routeR.dest_note}</p>
      </div>
    );
  } else if (active) {
    banner = (
      <div className="rounded-2xl bg-amber-500 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">
          🧍 {t('drv.pickingUp').replace('{name}', active.commuter_first_name || '')}
        </p>
        <p className="text-xs font-semibold text-white/90">{t('drv.toDest').replace('{name}', active.dest_name)}</p>
      </div>
    );
  } else {
    banner = (
      <div className="inline-block rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow">
        {isOnline ? t('drv.rentWaitNone') : t('drv.goOnlineMap')}
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-brand-soft">
    <AppHeader badge={driver.tricycle_plate_number} />

      {tab === 'home' && (
        <div className="relative min-h-0 flex-1">
          <DriverMap
            fill
            sheds={sheds}
            waiting={waiting}
            pickup={active ? [Number(active.pickup_lat), Number(active.pickup_lng)] : null}
            me={me}
            banner={banner}
            recenterLabel={t('drv.center')}
            meLabel={t('drv.me')}
            route={routeProps}
            onRouteInfo={setRouteInfo}
          />
          <div className="absolute inset-x-0 bottom-0 z-10 mx-auto max-w-md">
            <HomeSheet
              driver={driver}
              verified={verified}
              busy={busy}
              moving={moving}
              error={error}
              active={active}
              requestProps={reqProps}
              rentRoute={routeR ? { rental: routeR, info: routeInfo, onClose: () => setRouteId(null) } : null}
              onOnline={(v) => { if (v) unlockAudio(); run(() => updateDriver(userId, { is_online: v })); }}
              onAccepting={(v) => { if (v) unlockAudio(); run(() => updateDriver(userId, { accepting_requests: v })); }}
              onStatus={(s) => run(() => updateDriver(userId, { status: s }))}
              showDemo={!USE_REAL_GPS}
              sheds={sheds}
              spot={spot}
              onPickSpot={handlePickSpot}
            />
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="mx-auto max-w-md space-y-4 px-4 py-4">
            {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}
            <DriverRentals
              open={rentOpen}
              mine={rentMine}
              waiting={waiting}
              online={isOnline}
              busy={busy}
              onAccept={(id) => rentAct(acceptRental, id)}
              onWithdraw={(id) => rentAct(withdrawRental, id)}
              onShowRoute={(id) => { setRouteInfo(null); setRouteId(id); setTab('home'); }}
            />
          </main>
        </div>
      )}

      {tab === 'profile' && (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <Profile embedded />
        </div>
      )}

      <DriverTabs tab={tab} onChange={setTab} badge={rentOpen.length} />
    </div>
  );
}