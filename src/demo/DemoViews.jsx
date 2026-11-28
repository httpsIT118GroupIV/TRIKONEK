import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { formatDistance } from '../utils/geo';
import useTricycleFilter from '../hooks/useTricycleFilter';
import MapView from '../components/Map/MapView';
import FlyToLayer from '../components/Map/FlyToLayer';
import RoadsideLayer from '../components/Map/RoadsideLayer';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import ActiveTricycles from '../components/Commuter/ActiveTricycles';
import DriverCard from '../components/Commuter/DriverCard';
import Sheet from '../components/Commuter/Sheet';
import AppHeader from '../components/common/AppHeader';
import AppTabs from '../components/common/AppTabs';
import DriverMap from '../components/Driver/DriverMap';
import DriverRentals from '../components/Driver/DriverRentals';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;
const findShed = (sheds, prefix) =>
  sheds.find((s) => s.shed_name.toLowerCase().startsWith(prefix)) ?? sheds[0];

/* ---------------- Rent panel (sample) ---------------- */
function DemoRentPanel({ sim }) {
  const { t, lang } = useLang();
  const [form, setForm] = useState(false);
  const [count, setCount] = useState(2);
  const [destId, setDestId] = useState('');
  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  if (form && !sim.rental) {
    return (
      <form
        className="card space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          sim.createRental(destId || findShed(sim.sheds, 'libon').id, count);
          setForm(false);
        }}
      >
        <div>
          <span className="label">{t('rent.count')}</span>
          <div className="flex items-center gap-3">
            <button type="button" className="h-11 w-11 rounded-full bg-gray-100 text-xl font-bold"
              onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
            <span className="w-10 text-center text-2xl font-extrabold">{count}</span>
            <button type="button" className="h-11 w-11 rounded-full bg-gray-100 text-xl font-bold"
              onClick={() => setCount((c) => Math.min(20, c + 1))}>+</button>
          </div>
        </div>
        <div>
          <span className="label">{t('rent.pickup')}</span>
          <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm">📍 {t('dn.nearBonbon')}</p>
        </div>
        <div>
          <label className="label" htmlFor="dm-dest">{t('rent.dest')}</label>
          <select id="dm-dest" className="input appearance-none" value={destId} onChange={(e) => setDestId(e.target.value)}>
            <option value="">{findShed(sim.sheds, 'libon').shed_name}</option>
            {sim.sheds.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
          </select>
        </div>
        <div className="rounded-2xl bg-brand-soft p-3">
          <div className="flex items-center justify-between text-sm">
            <span>{t('rent.rate').replace('{n}', sim.flatFare)} × {count}</span>
            <span className="text-lg font-extrabold">{t('rent.total')}: {peso(sim.flatFare * count)}</span>
          </div>
          <p className="mt-1 text-xs text-gray-600">{t('rent.rateNote')}</p>
        </div>
        <button type="submit" className="btn-primary">{t('rent.submit')}</button>
      </form>
    );
  }

  return (
    <div className="card space-y-3">
      <p className="text-sm text-gray-600">{t('rent.intro')}</p>
      {!sim.rental && <button className="btn-primary" onClick={() => setForm(true)}>{t('rent.cta')}</button>}

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('rent.mine')}</p>
        {sim.myRentals.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('rent.none')}</p>
        ) : (
          sim.myRentals.map((r) => {
            const full = r.accepted >= r.trucks;
            return (
              <div key={r.id} className="space-y-2 rounded-2xl border border-black/5 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold">📅 {fmt(r.event_at)}</p>
                    <p className="truncate text-sm text-gray-600">➡️ {r.dest_note}</p>
                    <p className="text-sm text-gray-600">🛺 ×{r.trucks} · {peso(r.total)}</p>
                  </div>
                  <span className={'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ' +
                    (full ? 'bg-emerald-50 text-available' : 'bg-amber-50 text-accent')}>
                    {t('rent.confirmed').replace('{a}', r.accepted).replace('{n}', r.trucks)}
                  </span>
                </div>
                {r.accepted === 0 && <p className="text-xs text-gray-500">{t('rent.waitingDrivers')}</p>}
                {r.accepted > 0 && !full && <p className="text-xs text-accent">{t('rent.partialNote')}</p>}
                {r.drivers.length > 0 && (
                  <div className="rounded-xl bg-gray-50 p-2 text-xs">
                    <p className="mb-1 font-bold text-gray-500">{t('rent.drivers')}</p>
                    {r.drivers.map((d, i) => (
                      <p key={i}>🛺 <b>{d.plate}</b> · {d.first_name} · {d.toda}</p>
                    ))}
                  </div>
                )}
                <button className="w-full text-center text-sm font-bold text-full underline" onClick={sim.cancelRental}>
                  {t('rent.cancel')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------- Passenger ---------------- */
export function DemoPassenger({ sim, step, payId, setPayId }) {
  const { t } = useLang();
  const [tab, setTab] = useState('home');
  const [selectedId, setSelectedId] = useState(null);
  const [focus, setFocus] = useState(null);
  const f = useTricycleFilter(sim.vehicles, sim.sheds);

  const bonbon = findShed(sim.sheds, 'bonbon');
  const polangui = findShed(sim.sheds, 'polangui');

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (step === 0) { setTab('home'); setSelectedId(null); f.setMode('all'); }
    if (step === 1) {
      setTab('home'); setSelectedId(null);
      f.setMode('route'); f.changeOrigin(bonbon.id); f.setDestId(polangui.id);
    }
    if (step === 2) setTab('home');
    if (step === 3 || step === 6) setTab('rent');
    if (step === 8) {
      setTab('home'); f.setMode('all'); setSelectedId('me');
      const m = sim.vehicles.find((v) => v.id === 'me');
      if (m) setFocus({ pos: [m.current_latitude, m.current_longitude], ts: Date.now() });
    }
  }, [step]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const selected = sim.vehicles.find((v) => v.id === selectedId) ?? null;
  const selectedRow = f.rows.find((r) => r.driver.id === selectedId) ?? null;
  const payDriver = sim.vehicles.find((v) => v.id === payId);

  const dimming = tab === 'home' && f.mode === 'route' && f.ready;
  const highlightIds = dimming ? new Set(f.rows.map((r) => r.driver.id)) : null;

  function select(id) {
    const d = sim.vehicles.find((x) => x.id === id);
    setSelectedId(id);
    if (d) setFocus({ pos: [d.current_latitude, d.current_longitude], ts: Date.now() });
  }

  const pins = tab === 'rent' && sim.rental
    ? [{ id: 'draft', latitude: sim.rental.pickup[0], longitude: sim.rental.pickup[1] }]
    : [];

  const legend = [
    { color: 'bg-available', label: t('map.legend.available') },
    { color: 'bg-full', label: t('map.legend.full') },
    { color: 'bg-blue-600', label: t('map.legend.terminal') },
    { color: 'bg-amber-500', label: t('map.legend.signaled') },
  ];
  if (dimming) legend.push({ color: 'bg-gray-300', label: t('map.fadedNote') });

  const TABS = [
    { id: 'home', icon: '🛺', label: t('tab.home') },
    { id: 'rent', icon: '🎉', label: t('tab.rent') },
  ];

  return (
    <div className="flex h-full flex-col bg-brand-soft">
      <AppHeader badge={`● ${sim.vehicles.length} ${t('map.online')}`} />

      <div className="relative isolate min-h-0 flex-1">
        <div className="absolute inset-0">
          <MapView
            sheds={sim.sheds}
            drivers={sim.vehicles}
            highlightIds={highlightIds}
            waitingByShed={sim.waitingByShed}
            busy={false}
            onSignal={sim.signal}
            onCancel={sim.unsignal}
            onSelect={tab === 'home' ? select : undefined}
            extra={
              <>
                <RoadsideLayer
                  signals={pins}
                  picked={null}
                  picking={false}
                  onPick={() => {}}
                  dest={tab === 'rent' && sim.rental ? sim.rental.dest : null}
                  label={t('wait.me')}
                />
                <FlyToLayer focus={focus} />
              </>
            }
          />
        </div>

        <div className="pointer-events-none absolute left-3 right-14 top-3 z-[1100]">
          <div className="no-scrollbar pointer-events-auto flex gap-2 overflow-x-auto">
            {legend.map((l) => (
              <span key={l.label}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold shadow">
                <span className={`h-2.5 w-2.5 rounded-full ${l.color}`} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100]">
          {tab === 'home' && selected ? (
            <DriverCard driver={selected} row={selectedRow} onPay={setPayId} onClose={() => setSelectedId(null)} />
          ) : tab === 'home' ? (
            <Sheet key="home" title={t('tab.tricycles')}>
              <ActiveTricycles f={f} sheds={sim.sheds} />
            </Sheet>
          ) : (
            <Sheet key="rent" title={t('rent.title')} forceOpen>
              <DemoRentPanel sim={sim} />
            </Sheet>
          )}
        </div>
      </div>

      <AppTabs tabs={TABS} tab={tab} onChange={(x) => { setTab(x); setSelectedId(null); }} />

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}

/* ---------------- Driver ---------------- */
function DemoDriverSheet({ sim, rentRoute }) {
  const { t } = useLang();
  const [open, setOpen] = useState(true);
  const { me } = sim;
  const isAvail = me.status === 'available';

  useEffect(() => { if (rentRoute) setOpen(false); }, [rentRoute?.rental?.id]); // eslint-disable-line

  const routeCard = rentRoute && (() => {
    const r = rentRoute.rental;
    const info = rentRoute.info;
    const leg = (color, label, l) => (
      <div className="rounded-xl bg-white p-2">
        <p className="flex items-center gap-1.5 font-bold"><span className={'h-2.5 w-2.5 rounded-full ' + color} />{label}</p>
        <p className="text-gray-600">
          {l && l.distance != null ? `${formatDistance(l.distance)} · ${Math.max(1, Math.round(l.duration / 60))} min` : '…'}
        </p>
      </div>
    );
    return (
      <div className="space-y-2 rounded-2xl border-2 border-violet-200 bg-violet-50 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-violet-700">{t('drv.routeTitle')}</p>
            <p className="font-bold">👤 {r.customer}</p>
            <p className="truncate text-sm">🏁 {r.dest_note}</p>
          </div>
          <button onClick={rentRoute.onClose} aria-label={t('drv.routeClose')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm">✕</button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {leg('bg-blue-600', t('drv.legPickup'), info?.toPickup)}
          {leg('bg-violet-600', t('drv.legDest'), info?.trip)}
        </div>
      </div>
    );
  })();

  return (
    <div className="max-h-[62%] overflow-y-auto rounded-t-[1.75rem] bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.18)]">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full justify-center pb-1 pt-2.5">
        <span className="h-1.5 w-10 rounded-full bg-gray-300" />
      </button>
      <div className="space-y-3 px-4 pb-4">
        {open ? routeCard : rentRoute && (
          <button type="button" onClick={() => setOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl bg-violet-50 px-3 py-2 text-left text-sm font-bold text-violet-700">
            <span className="truncate">🎉 {t('drv.routeTitle')} · {rentRoute.rental.customer}</span>
            <span>⌃</span>
          </button>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-lg font-extrabold leading-tight">{me.online ? t('shift.online') : t('shift.offline')}</p>
            <p className="truncate text-xs text-gray-500">{me.online ? t('shift.onlineDesc') : t('shift.offlineDesc')}</p>
          </div>
          <button onClick={() => sim.setOnline(!me.online)}
            className={'h-11 shrink-0 rounded-full px-5 text-sm font-extrabold ' + (me.online ? 'bg-gray-100 text-ink' : 'bg-brand text-ink shadow')}>
            {me.online ? t('shift.goOffline') : t('shift.goOnline')}
          </button>
        </div>

        {open && (
          <>
            <button type="button" onClick={() => sim.setStatus(isAvail ? 'full' : 'available')}
              className={'w-full rounded-2xl p-3 text-left ' + (isAvail ? 'bg-green-50' : 'bg-rose-50')}>
              <p className="text-xs font-semibold text-gray-500">{t('seat.title')}</p>
              <p className={'mt-1 text-sm font-extrabold ' + (isAvail ? 'text-available' : 'text-full')}>
                {isAvail ? '🪑 ' + t('seat.available') : '🚫 ' + t('seat.full')}
              </p>
              <p className="text-[11px] text-gray-500">{t('drv.tapChange')}</p>
            </button>

            {sim.terminalWaiting.length > 0 && (
              <div className="rounded-2xl bg-amber-50 px-3 py-2.5 text-sm">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('drv.rentWaitTitle')}</p>
                {sim.terminalWaiting.map((w) => (
                  <p key={w.id} className="font-semibold">🚏 {w.name} · {t('drv.rentWaitAt').replace('{n}', 1)}</p>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 rounded-2xl bg-brand-soft px-3 py-2.5">
              <span className="text-lg">🛣️</span>
              <p className="min-w-0 flex-1 text-xs font-bold leading-snug">{t('line.direct_polangui')}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function DemoDriver({ sim, step }) {
  const { t } = useLang();
  const [tab, setTab] = useState('home');
  const [routeInfo, setRouteInfo] = useState(null);
  const { me } = sim;
  const mine = sim.driverMine[0] ?? null;
  const routing = !!(mine && sim.rental?.showRoute);

  useEffect(() => {
    if (step === 4 || step === 5) setTab('requests');
    if (step === 7) setTab('home');
  }, [step]);

  useEffect(() => { if (!routing) setRouteInfo(null); }, [routing]);

  const routeProps = routing
    ? { me: me.pos, pickup: [mine.pickup_lat, mine.pickup_lng], dest: [mine.dest_lat, mine.dest_lng] }
    : null;

  let banner;
  if (routing) {
    banner = (
      <div className="rounded-2xl bg-violet-600 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">🎉 {t('drv.routeTitle')}</p>
        <p className="truncate text-xs font-semibold text-white/90">🏁 {mine.dest_note}</p>
      </div>
    );
  } else {
    banner = (
      <div className="inline-block rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow">
        {me.online ? t('drv.rentWaitNone') : t('drv.goOnlineMap')}
      </div>
    );
  }

  const TABS = [
    { id: 'home', icon: '🏠', label: t('tab.home') },
    { id: 'requests', icon: '🎉', label: t('tab.requests') },
  ];

  return (
    <div className="flex h-full flex-col bg-brand-soft">
      <AppHeader badge="DEMO-DRV" />

      {tab === 'home' ? (
        <div className="relative min-h-0 flex-1">
          <DriverMap
            fill
            sheds={sim.sheds}
            waiting={sim.terminalWaiting}
            pickup={null}
            me={me.pos}
            banner={banner}
            recenterLabel={t('drv.center')}
            meLabel={t('drv.me')}
            route={routeProps}
            onRouteInfo={setRouteInfo}
          />
          <div className="absolute inset-x-0 bottom-0 z-10 max-h-full">
            <DemoDriverSheet
              sim={sim}
              rentRoute={routing ? { rental: mine, info: routeInfo, onClose: () => sim.showRoute(false) } : null}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <main className="space-y-4 px-4 py-4">
            <DriverRentals
              open={sim.driverOpenRentals}
              mine={sim.driverMine}
              waiting={sim.terminalWaiting}
              online={me.online}
              busy={false}
              onAccept={() => sim.accept()}
              onWithdraw={() => sim.withdraw()}
              onShowRoute={() => { setRouteInfo(null); sim.showRoute(true); setTab('home'); }}
            />
          </main>
        </div>
      )}

      <AppTabs tabs={TABS} tab={tab} onChange={setTab} />
    </div>
  );
}