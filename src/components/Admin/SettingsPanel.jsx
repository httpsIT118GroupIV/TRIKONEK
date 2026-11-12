import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { getSettings, saveSettings } from '../../services/adminService';

const FIELDS = [
  { key: 'request_radius_m', label: 'set.radius', hint: 'set.radiusHint', min: 200, max: 10000, int: true },
  { key: 'request_ttl_min', label: 'set.ttl', hint: 'set.ttlHint', min: 1, max: 60, int: true },
  { key: 'night_start_hour', label: 'set.nightStart', min: 0, max: 23, int: true },
  { key: 'night_end_hour', label: 'set.nightEnd', min: 0, max: 23, int: true },
  { key: 'discount_rate', label: 'set.discount', hint: 'set.discountHint', min: 0, max: 100, percent: true },
  { key: 'min_fare', label: 'set.minFare', hint: 'set.minFareHint', min: 1, max: 500 },
];

export default function SettingsPanel() {
  const { t } = useLang();
  const [vals, setVals] = useState({});
  const [sample, setSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getSettings()
      .then((s) => {
        const v = {};
        FIELDS.forEach((f) => {
          const raw = s[f.key] ?? '';
          v[f.key] = f.percent && raw !== '' ? String(Math.round(Number(raw) * 100)) : raw;
        });
        setVals(v);
        setSample(s.fare_is_sample !== 'false');
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e) {
    e.preventDefault();
    setError('');
    setMsg('');
    const out = {};
    for (const f of FIELDS) {
      const n = Number(vals[f.key]);
      if (!Number.isFinite(n) || n < f.min || n > f.max || (f.int && !Number.isInteger(n))) {
        return setError(
          t('set.invalid').replace('{name}', t(f.label)).replace('{min}', f.min).replace('{max}', f.max)
        );
      }
      out[f.key] = f.percent ? n / 100 : n;
    }
    out.fare_is_sample = sample ? 'true' : 'false';
    setBusy(true);
    try {
      await saveSettings(out);
      setMsg(t('set.saved'));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-brand-dark border-t-transparent" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold">{t('set.title')}</h2>
        <p className="text-sm text-gray-600">{t('set.hint')}</p>
      </div>

      <div className="card space-y-4">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={f.key}>{t(f.label)}</label>
            <input
              id={f.key}
              className="input"
              inputMode="decimal"
              value={vals[f.key] ?? ''}
              onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })}
            />
            {f.hint && <p className="mt-1 text-xs text-gray-500">{t(f.hint)}</p>}
          </div>
        ))}

        <label className="flex items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 h-5 w-5 shrink-0 accent-[#FFB300]"
            checked={sample}
            onChange={(e) => setSample(e.target.checked)}
          />
          <span>
            <span className="font-semibold">{t('set.sample')}</span>
            <span className="block text-xs text-gray-500">{t('set.sampleHint')}</span>
          </span>
        </label>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}
      {msg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{msg}</p>}

      <button type="submit" className="btn-primary" disabled={busy}>{t('set.save')}</button>
    </form>
  );
}