import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import Stepper from '../components/common/Stepper';
import { getSheds } from '../services/mapService';
import { estimateTrip, rideErrorKey } from '../services/rideService';
import { getTricycleInfo, recordTrip, stickerErrorKey } from '../services/stickerService';
import { distanceM } from '../utils/geo';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

function PaidScreen({ result, method, routeText, onClose }) {
  const { t } = useLang();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[3000] flex flex-col items-center justify-center bg-available p-6 text-center text-white">
      <div className="text-7xl">✓</div>
      <p className="mt-2 text-4xl font-extrabold tracking-wide">{t('scan.paidTitle')}</p>
      <p className="mt-4 text-6xl font-extrabold">{peso(result.total_fare)}</p>
      <p className="mt-2 rounded-full bg-white/20 px-4 py-1 text-lg font-bold">
        {method === 'cash' ? t('scan.method.cash') : t('scan.method.ewallet')}
      </p>
      <p className="mt-6 text-sm text-white/80">{t('req.plate')}</p>
      <p className="text-4xl font-extrabold tracking-wider">{result.plate}</p>
      <p className="mt-3 text-base font-semibold">{routeText}</p>
      <p className="mt-4 text-2xl font-bold tabular-nums">
        {now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-sm text-white/80">{now.toLocaleDateString('en-PH', { dateStyle: 'medium' })}</p>
      <p className="mt-6 max-w-xs text-sm text-white/90">{t('scan.paidNote')}</p>
      <button onClick={onClose} className="mt-6 h-12 rounded-full bg-white px-8 font-bold text-ink">
        {t('scan.close')}
      </button>
    </div>
  );
}

export default function Verify() {
  const { plate } = useParams();
  const { t } = useLang();

  const [info, setInfo] = useState(null);
  const [sheds, setSheds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [origin, setOrigin] = useState('');
  const [dest, setDest] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [discounted, setDiscounted] = useState(0);
  const [quote, setQuote] = useState(null);
  const [method, setMethod] = useState(null);
  const [paid, setPaid] = useState(null);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  const errText = (e) => {
    const k = stickerErrorKey(e.message) || rideErrorKey(e.message);
    return k ? t(k) : e.message;
  };

  useEffect(() => {
    let off = false;
    Promise.all([getTricycleInfo(plate), getSheds()])
      .then(([i, s]) => {
        if (off) return;
        setInfo(i);
        setSheds([...s].sort((a, b) => a.shed_name.localeCompare(b.shed_name)));
      })
      .catch((e) => { if (!off) setError(e.message); })
      .finally(() => { if (!off) setLoading(false); });
    return () => { off = true; };
  }, [plate]);

  const originShed = sheds.find((s) => s.id === origin);
  const destShed = sheds.find((s) => s.id === dest);

  // Ang pamasahe ay kinukuwenta ng database
  useEffect(() => {
    if (!originShed || !dest) {
      setQuote(null);
      return;
    }
    let off = false;
    estimateTrip(Number(originShed.latitude), Number(originShed.longitude), dest, passengers, discounted)
      .then((q) => { if (!off) { setQuote(q); setError(''); } })
      .catch((e) => { if (!off) { setQuote(null); setError(errText(e)); } });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin, dest, passengers, discounted, sheds]);

  function useMyLocation() {
    if (!navigator.geolocation) return setError(t('wait.noGps'));
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = [pos.coords.latitude, pos.coords.longitude];
        let best = null;
        for (const s of sheds) {
          const d = distanceM(here, [Number(s.latitude), Number(s.longitude)]);
          if (!best || d < best.d) best = { id: s.id, d };
        }
        if (best) setOrigin(best.id);
        setLocating(false);
      },
      () => { setLocating(false); setError(t('wait.gpsFailed')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function confirmPaid() {
    setSaving(true);
    setError('');
    try {
      setPaid(await recordTrip(plate, origin, dest, passengers, discounted, method));
    } catch (e) {
      setError(errText(e));
    } finally {
      setSaving(false);
    }
  }

  const verified = info?.status === 'verified';
  const lineMismatch = verified && quote && info.line && !quote.lines.includes(info.line);
  const OPTIONS = [
    { value: 'cash', icon: '💵', label: t('pay.cash'), hint: t('pay.cashDesc') },
    { value: 'ewallet', icon: '📱', label: t('pay.qr'), hint: t('pay.qrDesc') },
  ];

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <header className="flex items-center justify-between bg-brand px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛺</span>
          <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {loading && (
          <div className="flex justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
          </div>
        )}

        {!loading && !info && error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>
        )}

        {!loading && info && !verified && (
          <div className="card space-y-2 border-2 border-amber-300">
            <p className="text-lg font-extrabold text-accent">⚠️ {t('scan.notVerifiedTitle')}</p>
            <p className="text-sm text-gray-700">{t('scan.notVerifiedBody')}</p>
            <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm">
              {t('req.plate')}: <span className="font-bold">{plate}</span>
            </p>
          </div>
        )}

        {verified && (
          <>
            <div className="card space-y-1 border-2 border-emerald-300 bg-emerald-50">
              <p className="font-extrabold text-available">✓ {t('scan.registered')}</p>
              <p className="text-4xl font-extrabold tracking-wide">{info.plate}</p>
              <p className="text-sm text-gray-700">
                {t('scan.driver')}: <span className="font-bold">{info.first_name}</span>
                {info.toda ? ` · ${t('scan.toda')}: ${info.toda}` : ''}
              </p>
              <p className="text-xs text-gray-600">{t('scan.matchPlate')}</p>
            </div>

            <section className="card space-y-4">
              <div>
                <label className="label" htmlFor="origin">{t('scan.from')}</label>
                <select id="origin" className="input appearance-none" value={origin}
                  onChange={(e) => setOrigin(e.target.value)}>
                  <option value="">{t('req.chooseDest')}</option>
                  {sheds.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
                </select>
                <button type="button" className="mt-2 text-sm font-bold underline" onClick={useMyLocation} disabled={locating}>
                  🎯 {locating ? t('wait.locating') : t('scan.useLocation')}
                </button>
              </div>

              <div>
                <label className="label" htmlFor="dest">{t('req.whereTo')}</label>
                <select id="dest" className="input appearance-none" value={dest}
                  onChange={(e) => setDest(e.target.value)}>
                  <option value="">{t('req.chooseDest')}</option>
                  {sheds.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
                </select>
              </div>

              <Stepper label={t('req.passengers')} value={passengers} min={1} max={4}
                onChange={(n) => { setPassengers(n); setDiscounted((d) => Math.min(d, n)); }} />
              <Stepper label={t('req.discounted')} hint={t('req.discountedHint')} value={discounted}
                min={0} max={passengers} onChange={setDiscounted} />

              {quote && (
                <div className="rounded-2xl bg-brand-soft p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-accent">{t('req.estimate')}</p>
                  <p className="mt-1 text-3xl font-extrabold leading-none">{peso(quote.total_fare)}</p>
                  <p className="mt-1 text-sm text-gray-600">{peso(quote.regular_fare)} {t('req.perPerson')}</p>
                  {quote.is_sample && <p className="mt-2 text-xs font-semibold text-accent">{t('req.sample')}</p>}
                </div>
              )}

              {lineMismatch && (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-accent">{t('scan.lineNote')}</p>
              )}

              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}
            </section>

            {quote && (
              <section className="card space-y-4">
                <p className="font-bold">{t('scan.method')}</p>
                <div className="grid grid-cols-2 gap-3">
                  {OPTIONS.map((o) => {
                    const on = method === o.value;
                    return (
                      <button key={o.value} type="button" aria-pressed={on} onClick={() => setMethod(o.value)}
                        className={
                          'rounded-2xl border-2 px-3 py-3 text-left transition active:scale-[0.98] ' +
                          (on ? 'border-brand-dark bg-brand-soft ring-4 ring-brand/30' : 'border-gray-200 bg-white hover:bg-gray-50')
                        }>
                        <span className="text-2xl">{o.icon}</span>
                        <span className="mt-1 block font-bold">{o.label}</span>
                        <span className="block text-xs text-gray-500">{o.hint}</span>
                      </button>
                    );
                  })}
                </div>

                {method === 'cash' && (
                  <p className="rounded-2xl bg-emerald-50 p-4 text-sm text-gray-700">{t('pay.cashInfo')}</p>
                )}

                {method === 'ewallet' &&
                  (info.qr_url ? (
                    <div className="text-center">
                      <img src={info.qr_url} alt="Driver QR code"
                        className="mx-auto w-full max-w-[280px] rounded-2xl border border-gray-200 p-2" />
                      <p className="mt-3 text-sm text-gray-500">{t('pay.qrInfo')}</p>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-accent">{t('pay.noQr')}</p>
                  ))}

                {method && (
                  <button className="btn-primary" onClick={confirmPaid} disabled={saving}>
                    {saving ? t('scan.paying') : t('scan.paidBtn')}
                  </button>
                )}
                <p className="text-xs text-gray-500">{t('scan.declared')}</p>
              </section>
            )}
          </>
        )}

        <p className="text-center text-xs text-gray-500">{t('scan.noAccount')}</p>
      </main>

      {paid && (
        <PaidScreen
          result={paid}
          method={method}
          routeText={`${originShed?.shed_name ?? ''} → ${destShed?.shed_name ?? ''}`}
          onClose={() => { setPaid(null); setMethod(null); }}
        />
      )}
    </div>
  );
}