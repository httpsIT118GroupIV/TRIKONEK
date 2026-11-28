import { useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { getSheds } from '../../services/mapService';
import { fareTable } from '../../services/rentService';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;

export default function FaresTable() {
  const { t } = useLang();
  const [sheds, setSheds] = useState([]);
  const [origin, setOrigin] = useState('');
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSheds().then((s) => setSheds([...s].sort((a, b) => a.shed_name.localeCompare(b.shed_name)))).catch(() => {});
  }, []);

  useEffect(() => {
    if (!origin) { setRows([]); return; }
    setBusy(true);
    fareTable(origin).then((r) => setRows(r ?? [])).catch(() => setRows([])).finally(() => setBusy(false));
  }, [origin]);

  const cols = [
    ['regular', 'fares.regular'], ['discounted', 'fares.student'],
    ['discounted', 'fares.senior'], ['discounted', 'fares.pwd'], ['special', 'fares.special'],
  ];

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      <div className="card space-y-3">
        <h2 className="text-lg font-extrabold">💰 {t('fares.title')}</h2>
        <p className="text-xs text-gray-500">{t('fares.note')}</p>
        <div>
          <label className="label" htmlFor="fr-from">{t('fares.from')}</label>
          <select id="fr-from" className="input appearance-none" value={origin} onChange={(e) => setOrigin(e.target.value)}>
            <option value="">{t('act.pick')}</option>
            {sheds.map((s) => <option key={s.id} value={s.id}>{s.shed_name}</option>)}
          </select>
        </div>
      </div>

      {origin && (
        <div className="card overflow-x-auto p-0">
          {busy ? (
            <p className="p-4 text-sm text-gray-500">…</p>
          ) : rows.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">{t('fares.none')}</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-soft text-xs uppercase tracking-wide text-gray-600">
                  <th className="sticky left-0 bg-brand-soft px-3 py-2 text-left">{t('fares.to')}</th>
                  {cols.map(([, k]) => <th key={k} className="px-2 py-2 text-right">{t(k)}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.dest_id} className="border-t border-black/5">
                    <td className="sticky left-0 bg-white px-3 py-2.5 font-bold">{r.dest_name}</td>
                    {cols.map(([f, k]) => (
                      <td key={k} className="px-2 py-2.5 text-right font-semibold">{peso(r[f])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}