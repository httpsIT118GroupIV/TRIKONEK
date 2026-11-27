import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const MPM = 420;

export default function ActiveTricycles({ f, sheds }) {
  const { t } = useLang();
  const sorted = [...sheds].sort((a, b) => a.shed_name.localeCompare(b.shed_name));
  const n = f.rows.length;
  const first = f.rows[0];

  const seg = (id, label) => (
    <button
      type="button"
      aria-pressed={f.mode === id}
      onClick={() => f.setMode(id)}
      className={
        'rounded-xl px-2 py-2 text-sm font-bold transition active:scale-[0.98] ' +
        (f.mode === id ? 'bg-ink text-white' : 'bg-gray-100 text-gray-600')
      }
    >
      {label}
    </button>
  );

  let summary;
  if (f.mode === 'route' && !f.ready) {
    summary = <p className="rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">{t('act.pickRoute')}</p>;
  } else if (n === 0) {
    summary = (
      <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm text-accent">
        {f.mode === 'route' ? t('act.noneComing') : t('act.noneAll')}
      </p>
    );
  } else {
    summary = (
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-available">
        {t(f.mode === 'route' ? 'act.sumComing' : 'act.sumAll').replace('{n}', n)}
        {f.mode === 'route' && first?.state === 'coming' &&
          ` ${t('act.nearest').replace('{d}', formatDistance(first.dist))} · ${t('act.eta').replace('{m}', Math.max(1, Math.round(first.dist / MPM)))}`}
      </p>
    );
  }

  return (
    <div className="card space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {seg('route', t('act.route'))}
        {seg('all', t('act.all'))}
      </div>

      {f.mode === 'route' && (
        <div className="space-y-2">
          <div>
            <label className="label" htmlFor="act-from">{t('act.from')}</label>
            <select id="act-from" className="input appearance-none" value={f.originId}
              onChange={(e) => f.changeOrigin(e.target.value)}>
              <option value="">{t('act.pick')}</option>
              {sorted.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
            </select>
            <button type="button" onClick={f.locate} disabled={f.locating} className="mt-1 text-sm font-bold underline">
              🎯 {f.locating ? t('wait.locating') : t('act.useGps')}
            </button>
            {f.locError && <p className="mt-1 text-xs text-full">{t('wait.gpsFailed')}</p>}
          </div>
          <div>
            <label className="label" htmlFor="act-to">{t('act.to')}</label>
            <select id="act-to" className="input appearance-none" value={f.destId}
              onChange={(e) => f.setDestId(e.target.value)}>
              <option value="">{t('act.pick')}</option>
              {sorted.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
            </select>
          </div>
        </div>
      )}

      {summary}
      <p className="text-xs text-gray-500">{t('tc.tapHint')}</p>
    </div>
  );
}