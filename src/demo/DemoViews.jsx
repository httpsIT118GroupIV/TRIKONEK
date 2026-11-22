import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { formatDistance } from '../utils/geo';
import MapView from '../components/Map/MapView';
import RoadsideLayer from '../components/Map/RoadsideLayer';
import PaymentSelector from '../components/Commuter/PaymentSelector';
import RideRequestPanel from '../components/Commuter/RideRequestPanel';
import ActiveRequestCard from '../components/Commuter/ActiveRequestCard';
import DriverMap from '../components/Driver/DriverMap';
import DriverRequests from '../components/Driver/DriverRequests';
import ShiftSwitch from '../components/Driver/ShiftSwitch';
import StatusToggle from '../components/Driver/StatusToggle';

export function DemoPassenger({ sim, payId, setPayId }) {
  const { t } = useLang();
  const [mode, setMode] = useState('idle'); // idle | pickup | form
  const [picked, setPicked] = useState(null);
  const req = sim.passengerReq;

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
  const payDriver = sim.vehicles.find((v) => v.id === payId);

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-soft">
      <div className="absolute inset-0">
        <MapView
          sheds={sim.sheds}
          drivers={sim.vehicles}
          waitingByShed={sim.waitingByShed}
          busy={false}
          onSignal={sim.signal}
          onCancel={sim.unsignal}
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

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md space-y-2">
          <div className="rounded-2xl bg-brand p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🛺</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold leading-tight">{t('map.title')}</p>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-ink/70">
                  <span className="h-2 w-2 rounded-full bg-available" />
                  {sim.vehicles.length} {t('map.online')}
                </p>
              </div>
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
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1100] p-3">
        <div className="pointer-events-auto mx-auto max-w-md">
          {req ? (
            <ActiveRequestCard req={req} busy={false} onCancel={sim.cancelRequest} onPay={setPayId} />
          ) : (
            <RideRequestPanel
              mode={mode}
              setMode={setMode}
              picked={picked}
              setPicked={setPicked}
              sheds={sim.sheds}
              onCreated={() => {}}
              api={sim.api}
            />
          )}
        </div>
      </div>

      {payId && <PaymentSelector driver={payDriver} onClose={() => setPayId(null)} />}
    </div>
  );
}

export function DemoDriver({ sim }) {
  const { t } = useLang();
  const { me, driverRequests: requests, driverActive: active } = sim;

  let banner;
  if (active) {
    banner = (
      <div className="rounded-2xl bg-amber-500 px-4 py-3 text-white shadow-lg">
        <p className="text-lg font-extrabold leading-tight">
          🧍 {t('drv.pickingUp').replace('{name}', active.commuter_first_name)}
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
        <p className="text-xs font-semibold text-white/90">{t('drv.reqCount').replace('{n}', requests.length)}</p>
      </div>
    );
  } else {
    banner = (
      <div className="inline-block rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-600 shadow">
        {me.online ? t('drv.reqNone') : t('drv.goOnlineMap')}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-brand-soft pb-6">
      <div className="bg-brand px-4 pb-8 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛺</span>
          <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <p className="mt-4 text-sm text-ink/70">{t('driver.title')}</p>
        <h1 className="text-2xl font-extrabold leading-tight">Mang Pedro</h1>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 text-sm font-bold">
          🛺 DEMO-DRV
        </span>
      </div>

      <main className="relative -mt-4 space-y-4 rounded-t-[2rem] bg-brand-soft px-4 pb-4 pt-5">
        <div className="card flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold">M</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">Mang Pedro</p>
            <p className="text-xs text-gray-500">Demo TODA</p>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-available">
            {t('verify.verified')}
          </span>
        </div>

        <DriverMap
          sheds={sim.sheds}
          waiting={sim.terminalWaiting}
          requests={requests}
          pickup={active ? [active.pickup_lat, active.pickup_lng] : null}
          me={me.pos}
          banner={banner}
          recenterLabel={t('drv.center')}
          meLabel={t('drv.me')}
        />

        <DriverRequests
          active={active}
          requests={requests}
          isOnline={me.online}
          isFull={me.status === 'full'}
          moving={false}
          busy={false}
          onAccept={() => sim.accept()}
          onRelease={() => sim.release()}
          onComplete={() => sim.complete()}
        />

        <ShiftSwitch isOnline={me.online} disabled={false} onChange={sim.setOnline} />
        <StatusToggle status={me.status} disabled={false} onChange={sim.setStatus} />
      </main>
    </div>
  );
}