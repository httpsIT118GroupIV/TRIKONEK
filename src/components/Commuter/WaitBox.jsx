import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { isInsideArea, snapToRoad, sendRoadsideSignal, cancelSignal, MAX_ROAD_M } from '../../services/mapService';

export default function WaitBox({ userId, sheds, active, mode, setMode, picked, setPicked, onChanged }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');

  function useGps() {
    if (!navigator.geolocation) return setError(t('wait.noGps'));
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPicked([p.coords.latitude, p.coords.longitude]); setLocating(false); },
      () => { setLocating(false); setError(t('wait.gpsFailed')); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function confirm() {
    if (!picked) return;
    setError('');
    if (!isInsideArea(picked[0], picked[1], sheds)) return setError(t('wait.outside'));
    setBusy(true);
    try {
      const snap = await snapToRoad(picked[0], picked[1]);
      if (snap && snap.distance > MAX_ROAD_M) { setBusy(false); return setError(t('wait.tooFar')); }
      const pt = snap ? [snap.lat, snap.lng] : picked;
      await sendRoadsideSignal(userId, pt[0], pt[1]);
      setPicked(null);
      setMode('idle');
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    try { await cancelSignal(active.id); onChanged(); } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }

  if (mode === 'pick') {
    return (
      <div className="mb-3 space-y-2 rounded-2xl bg-amber-50 p-3">
        <p className="font-bold">🧍 {t('wait.pickTitle')}</p>
        <button type="button" className="text-sm font-bold underline" onClick={useGps} disabled={locating}>
          🎯 {locating ? t('wait.locating') : t('wait.useGps')}
        </button>
        {error && <p className="text-xs font-medium text-full">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => { setMode('idle'); setPicked(null); setError(''); }}>{t('wait.cancel')}</button>
          <button className="btn-primary" disabled={!picked || busy} onClick={confirm}>{t('wait.confirm')}</button>
        </div>
      </div>
    );
  }

  if (active) {
    const mins = Math.max(1, Math.ceil((new Date(active.expires_at).getTime() - Date.now()) / 60000));
    return (
      <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-3">
        <div className="min-w-0">
          <p className="font-bold">🧍 {t('wait.active')}</p>
          <p className="text-xs text-gray-600">{t('wait.expires').replace('{n}', mins)}</p>
        </div>
        <button className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-bold shadow" disabled={busy} onClick={stop}>
          {t('wait.stop')}
        </button>
      </div>
    );
  }

  return (
    <button className="btn-primary mb-3" onClick={() => { setError(''); setMode('pick'); }}>
      🧍 {t('wait.here')}
    </button>
  );
}