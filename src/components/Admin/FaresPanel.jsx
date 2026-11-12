import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { getSheds } from '../../services/mapService';
import { listFares, saveFares } from '../../services/adminService';

const pairKey = (a, b) => (a < b ? `${a}|${b}` : `${b}|${a}`);

export default function FaresPanel() {
  const { t } = useLang();
  const [sheds, setSheds] = useState([]);
  const [saved, setSaved] = useState({}); // pairKey -> { id, shed_a, shed_b, regular }
  const [draft, setDraft] = useState({}); // pairKey -> string
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [s, f] = await Promise.all([getSheds(), listFares()]);
      const sorted = [...s].sort(
        (a, b) =>
          (a.route_zone || '').localeCompare(b.route_zone || '') ||
          a.shed_name.localeCompare(b.shed_name)
      );
      const map = {};
      const d = {};
      f.forEach((r) => {
        const k = pairKey(r.shed_a, r.shed_b);
        map[k] = r;
        d[k] = String(Number(r.regular));
      });
      setSheds(sorted);
      setSaved(map);
      setDraft(d);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const pairs = useMemo(() => {
    const out = [];
    for (let i = 0; i < sheds.length; i++) {
      for (let j = i + 1; j < sheds.length; j++) {
        out.push({ a: sheds[i], b: sheds[j], k: pairKey(sheds[i].id, sheds[j].id) });
      }
    }
    return out;
  }, [sheds]);

  const needle = q.trim().toLowerCase();
  const visible = pairs.filter(
    (p) => !needle || `${p.a.shed_name} ${p.b.shed_name}`.toLowerCase().includes(needle)
  );

  const oldValue = (k) => (saved[k] ? String(Number(saved[k].regular)) : '');
  const isChanged = (k) => {
    const v = (draft[k] ?? '').trim();
    return v !== '' && v !== oldValue(k);
  };
  const changed = pairs.filter((p) => isChanged(p.k));
  const invalid = changed.some((p) => {
    const n = Number(draft[p.k]);
    return !Number.isFinite(n) || n < 1 || n > 500;
  });

  async function save() {
    setError('');
    setMsg('');
    if (invalid) return setError(t('fare.invalid'));
    setBusy(true);
    try {
      const updates = [];
      const inserts = [];
      for (const p of changed) {
        const regular = Math.round(Number(draft[p.k]) * 100) / 100;
        const ex = saved[p.k];
        if (ex) {
          updates.push({ id: ex.id, shed_a: ex.shed_a, shed_b: ex.shed_b, regular });
        } else {
          const [a, b] = p.a.id < p.b.id ? [p.a.id, p.b.id] : [p.b.id, p.a.id];
          inserts.push({ shed_a: a, shed_b: b, regular });
        }
      }
      await saveFares({ updates, inserts });
      await load();
      setMsg(t('fare.saved'));
    } catch (e) {
      setError(e.message);
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
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-extrabold">{t('fare.title')}</h2>
        <p className="text-sm text-gray-600">{t('fare.hint')}</p>
        <p className="mt-1 text-xs font-semibold text-accent">{t('fare.sampleNote')}</p>
      </div>

      {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}
      {msg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{msg}</p>}

      <input className="input" placeholder={t('fare.search')} value={q} onChange={(e) => setQ(e.target.value)} />

      {visible.length === 0 ? (
        <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-gray-500">{t('admin.empty')}</p>
      ) : (
        <div className="space-y-2">
          {visible.map((p) => (
            <div
              key={p.k}
              className={
                'flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ' +
                (isChanged(p.k) ? 'ring-2 ring-brand-dark' : '')
              }
            >
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-bold">{p.a.shed_name}</p>
                <p className="truncate text-gray-500">↔ {p.b.shed_name}</p>
              </div>
              <div className="relative w-28 shrink-0">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₱</span>
                <input
                  inputMode="decimal"
                  className="input pl-8 text-right"
                  placeholder={t('fare.notSet')}
                  value={draft[p.k] ?? ''}
                  onChange={(e) => setDraft({ ...draft, [p.k]: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {changed.length > 0 && (
        <div className="sticky bottom-3 z-10">
          <button className="btn-primary shadow-lg" onClick={save} disabled={busy}>
            {t('fare.save').replace('{n}', changed.length)}
          </button>
        </div>
      )}
    </div>
  );
}