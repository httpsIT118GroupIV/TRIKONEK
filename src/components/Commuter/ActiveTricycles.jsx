import { useLang } from '../../context/LanguageContext';
import { formatDistance } from '../../utils/geo';

const MPM = 420; // ~25 km/h

export default function ActiveTricycles({ f, sheds, onLocate, onPay }) {
  const { t } = useLang();
  const sorted = [...sheds].sort((a, b) => a.shed_name.localeCompare(b.shed_name));
  const n = f.rows.length;

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
      </p>
    );
  }

  return (
    <div className="card max-h-[46vh] space-y-3 overflow-y-auto shadow-lg">
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

      {n > 0 && (
        <ul className="space-y-2">
          {f.rows.map((r) => {
            const avail = r.driver.status === 'available';
            return (
              <li key={r.driver.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-black/5 bg-white p-3 shadow-sm">
                <div className="min-w-0">
                  <p className="truncate font-bold">🛺 {r.driver.tricycle_plate_number}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className={
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ' +
                      (avail ? 'bg-emerald-50 text-available' : 'bg-rose-50 text-full')
                    }>
                      ● {avail ? t('map.legend.available') : t('map.legend.full')}
                    </span>
                    {r.tag === 'partial' && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-accent">
                        {t('act.toLibon')}
                      </span>
                    )}
                  </div>
                  {r.state === 'coming' && (
                    <p className="mt-1 text-xs font-semibold text-gray-600">
                      {t('act.coming')} · {formatDistance(r.dist)} · {t('act.eta').replace('{m}', Math.max(1, Math.round(r.dist / MPM)))}
                    </p>
                  )}
                  {r.state === 'idle' && (
                    <p className="mt-1 text-xs font-semibold text-gray-600">{t('act.atTerminal')}</p>
                  )}
                  {!r.state && r.dist != null && (
                    <p className="mt-1 text-xs text-gray-500">{formatDistance(r.dist)}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button onClick={() => onLocate(r.pos)}
                    className="h-9 rounded-full border border-gray-200 bg-white px-3 text-sm font-bold active:scale-95">
                    {t('c.locate')}
                  </button>
                  <button onClick={() => onPay(r.driver.id)}
                    className="h-9 rounded-full bg-brand px-3 text-sm font-bold active:scale-95">
                    {t('c.pay')}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {f.ready && (f.hidden > 0 || f.showAll) && (
        <button type="button" className="w-full text-center text-sm font-bold underline"
          onClick={() => f.setShowAll(!f.showAll)}>
          {f.showAll ? t('act.showNearby') : t('act.showAllBtn').replace('{n}', f.hidden)}
        </button>
      )}
      {f.ready && !f.showAll && f.hasRef && (
        <p className="text-xs text-gray-500">{t('act.limitNote')}</p>
      )}
    </div>
  );
}