import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { createRequest, estimateTrip, rideErrorKey } from '../../services/rideService';
import { isInsideArea, snapToRoad, MAX_ROAD_M } from '../../services/mapService';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

function Stepper({ label, hint, value, min, max, onChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-semibold">{label}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white text-lg font-bold disabled:opacity-40">−</button>
        <span className="w-5 text-center text-lg font-extrabold">{value}</span>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)}
          className="h-9 w-9 rounded-full border border-gray-200 bg-white text-lg font-bold disabled:opacity-40">+</button>
      </div>
    </div>
  );
}

export default function RideRequestPanel({ mode, setMode, picked, setPicked, sheds, onCreated }) {
  const { t } = useLang();
  const [locating, setLocating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pickup, setPickup] = useState(null);
  const [dest, setDest] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [discounted, setDiscounted] = useState(0);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');

  const errText = (e) => {
    const k = rideErrorKey(e.message);
    return k ? t(k) : e.message;
  };

  // Kinukuwenta ang pamasahe sa database tuwing may nagbabago
  useEffect(() => {
    if (mode !== 'form' || !pickup || !dest) {
      setQuote(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const q = await estimateTrip(pickup[0], pickup[1], dest, passengers, discounted);
        if (!cancelled) { setQuote(q); setError(''); }
      } catch (e) {
        if (!cancelled) { setQuote(null); setError(errText(e)); }
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, pickup, dest, passengers, discounted]);

  function startPick() {
    setError('');
    setPicked(null);
    setPickup(null);
    setMode('pickup');
  }

  function reset() {
    setMode('idle');
    setPicked(null);
    setPickup(null);
    setDest('');
    setPassengers(1);
    setDiscounted(0);
    setQuote(null);
    setError('');
  }

  function locateMe() {
    if (!navigator.geolocation) return setError(t('wait.noGps'));
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPicked([pos.coords.latitude, pos.coords.longitude]); setLocating(false); },
      () => { setLocating(false); setError(t('wait.gpsFailed')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function confirmPickup() {
    if (!picked) return;
    setChecking(true);
    setError('');
    try {
      if (!isInsideArea(picked[0], picked[1], sheds)) return setError(t('req.err.outside_area'));
      const snap = await snapToRoad(picked[0], picked[1]);
      if (snap && snap.distance > MAX_ROAD_M) return setError(t('wait.tooFar'));
      const p = snap ? [snap.lat, snap.lng] : picked;
      setPickup(p);
      setPicked(p);
      setMode('form');
    } finally {
      setChecking(false);
    }
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await createRequest(pickup[0], pickup[1], dest, passengers, discounted);
      reset();
      onCreated();
    } catch (e) {
      setError(errText(e));
    } finally {
      setSubmitting(false);
    }
  }

  const err = error && (
    <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>
  );

  if (mode === 'idle') {
    return (
      <button className="btn-primary shadow-lg" onClick={startPick}>
        🛺 {t('req.cta')}
      </button>
    );
  }

  if (mode === 'pickup') {
    return (
      <div className="card space-y-3 shadow-lg">
        <p className="font-bold">{t('req.pickTitle')}</p>
        <button className="btn-ghost" onClick={locateMe} disabled={locating}>
          {locating ? t('wait.locating') : `🎯 ${t('wait.useGps')}`}
        </button>
        {err}
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={reset}>{t('wait.cancel')}</button>
          <button className="btn-primary" onClick={confirmPickup} disabled={!picked || checking}>
            {t('req.next')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-h-[70vh] space-y-4 overflow-y-auto shadow-lg">
      <div>
        <label className="label" htmlFor="dest">{t('req.whereTo')}</label>
        <select id="dest" className="input appearance-none" value={dest} onChange={(e) => setDest(e.target.value)}>
          <option value="">{t('req.chooseDest')}</option>
          {sheds.map((s) => (
            <option key={s.id} value={s.id}>{s.shed_name}</option>
          ))}
        </select>
      </div>

      <Stepper label={t('req.passengers')} value={passengers} min={1} max={4}
        onChange={(n) => { setPassengers(n); setDiscounted((d) => Math.min(d, n)); }} />
      <Stepper label={t('req.discounted')} hint={t('req.discountedHint')} value={discounted} min={0} max={passengers}
        onChange={setDiscounted} />

      {quote && (
        <div className="rounded-2xl bg-brand-soft p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-accent">{t('req.estimate')}</p>
          <p className="mt-1 text-3xl font-extrabold leading-none">{peso(quote.total_fare)}</p>
          <p className="mt-1 text-sm text-gray-600">
            {peso(quote.regular_fare)} {t('req.perPerson')} · {t('req.nearTerminal').replace('{name}', quote.origin_name)}
          </p>
          {quote.is_sample && <p className="mt-2 text-xs font-semibold text-accent">{t('req.sample')}</p>}
        </div>
      )}

      <p className="text-xs text-gray-500">{t('req.payNote')} {t('req.privacy')}</p>
      {err}

      <div className="grid grid-cols-2 gap-3">
        <button className="btn-ghost" onClick={() => setMode('pickup')} disabled={submitting}>{t('req.back')}</button>
        <button className="btn-primary" onClick={submit} disabled={!quote || submitting}>
          {submitting ? t('req.sending') : t('req.send')}
        </button>
      </div>
    </div>
  );
}