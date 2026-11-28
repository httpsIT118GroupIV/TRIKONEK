import { useCallback, useEffect, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import useProfile from '../../hooks/useProfile';
import ChatSheet from '../common/ChatSheet';
import { isInsideArea } from '../../services/mapService';
import {
  createRental, myRentals, cancelRental, rentRate, rentQuote, rentErrorKey,
  chatSummary, unreadKeys,
} from '../../services/rentService';

const peso = (n) => `₱${Number(n).toLocaleString('en-PH')}`;
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function RentPanel({ mode, setMode, picked, setPicked, pickedDest, setPickedDest, sheds, onChat, unread }) {
      const { t, lang } = useLang();
  const { profile } = useProfile();

  const [mine, setMine] = useState([]);
  const [rate, setRate] = useState(null);
  const [when, setWhen] = useState('');
  const [count, setCount] = useState(2);
  const [note, setNote] = useState('');
  const [dest, setDest] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    myRentals().then(setMine).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    rentRate().then((r) => setRate(Number(r))).catch(() => {});
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    if (profile?.phone) setPhone((p) => p || profile.phone);
  }, [profile?.phone]);

  useEffect(() => {
    if (picked && pickedDest) {
      rentQuote(picked[0], picked[1], pickedDest[0], pickedDest[1])
        .then((r) => setRate(Number(r)))
        .catch(() => {});
    }
  }, [picked, pickedDest]);

  const fmt = (iso) =>
    new Date(iso).toLocaleString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  function confirmPin() {
    const pt = mode === 'pickDest' ? pickedDest : picked;
    if (!pt) return;
    if (!isInsideArea(pt[0], pt[1], sheds)) return setError(t('wait.outside'));
    setError('');
    setMode('form');
  }

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!picked) return setError(t('rent.needPin'));
    if (!pickedDest) return setError(t('rent.needDestPin'));
    setBusy(true);
    try {
      await createRental({
        eventAt: new Date(when).toISOString(),
        lat: picked[0], lng: picked[1],
        destLat: pickedDest[0], destLng: pickedDest[1],
        pickupNote: note.trim(), dest: dest.trim(), count, phone: phone.trim(),
      });
      setWhen(''); setNote(''); setDest(''); setPicked(null); setPickedDest(null);
      setMode('list');
      load();
    } catch (err) {
      const k = rentErrorKey(err.message);
      setError(k ? t(k) : err.message);
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id) {
    if (!window.confirm(t('rent.confirmCancel'))) return;
    try { await cancelRental(id); load(); } catch { /* ignore */ }
  }

  if (mode === 'pick' || mode === 'pickDest') {
    const isDest = mode === 'pickDest';
    const pt = isDest ? pickedDest : picked;
    return (
      <div className="card space-y-3 shadow-lg">
        <p className="font-bold">{isDest ? '🏁' : '📍'} {t(isDest ? 'rent.pickDestHint' : 'rent.pickHint')}</p>
        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-full">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-ghost" onClick={() => { setError(''); setMode('form'); }}>{t('wait.cancel')}</button>
          <button className="btn-primary" disabled={!pt} onClick={confirmPin}>{t('rent.pickDone')}</button>
        </div>
      </div>
    );
  }

  if (mode === 'form') {
    const total = rate != null ? rate * count : null;
    return (
      <form onSubmit={submit} className="card max-h-[62vh] space-y-3 overflow-y-auto shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-extrabold">{t('rent.title')}</h3>
          <button type="button" className="text-sm font-bold underline" onClick={() => { setMode('list'); setError(''); }}>
            {t('req.back')}
          </button>
        </div>

        <div>
          <label className="label" htmlFor="r-when">{t('rent.when')}</label>
          <input id="r-when" type="datetime-local" className="input" required value={when}
            min={toLocalInput(new Date(Date.now() + 24 * 3600 * 1000))}
            onChange={(e) => setWhen(e.target.value)} />
        </div>

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
          <button type="button" className="btn-ghost" onClick={() => setMode('pick')}>
            📍 {picked ? t('rent.changePin') : t('rent.pickOnMap')}
          </button>
          <p className={'mt-1 text-xs ' + (picked ? 'font-semibold text-available' : 'text-gray-500')}>
            {picked ? t('rent.pinSet') : t('rent.noPin')}
          </p>
          <input className="input mt-2" maxLength={120} placeholder={t('rent.pickupNote')}
            value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div>
          <label className="label" htmlFor="r-dest">{t('rent.dest')}</label>
          <input id="r-dest" className="input" required maxLength={120} value={dest}
            onChange={(e) => setDest(e.target.value)} />
          <button type="button" className="btn-ghost mt-2" onClick={() => setMode('pickDest')}>
            🏁 {pickedDest ? t('rent.changeDest') : t('rent.pickDest')}
          </button>
          <p className={'mt-1 text-xs ' + (pickedDest ? 'font-semibold text-available' : 'text-gray-500')}>
            {pickedDest ? t('rent.destPinSet') : t('rent.noDestPin')}
          </p>
        </div>

        <div>
          <label className="label" htmlFor="r-phone">{t('rent.phone')}</label>
          <input id="r-phone" className="input" type="tel" inputMode="tel" required maxLength={20}
            placeholder="09xx xxx xxxx" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>

        {rate != null && (
          <div className="rounded-2xl bg-brand-soft p-3">
            <div className="flex items-center justify-between text-sm">
              <span>{t('rent.rate').replace('{n}', rate.toLocaleString('en-PH'))} × {count}</span>
              <span className="text-lg font-extrabold">{t('rent.total')}: {peso(total)}</span>
            </div>
            <p className="mt-1 text-xs text-gray-600">{t('rent.rateNote')}</p>
          </div>
        )}

        {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-full">{error}</p>}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? t('rent.sending') : t('rent.submit')}
        </button>
      </form>
    );
  }

  return (
    <div className="card max-h-[52vh] space-y-3 overflow-y-auto shadow-lg">
      <div>
        <h3 className="text-lg font-extrabold">🎉 {t('rent.title')}</h3>
        <p className="mt-1 text-sm text-gray-600">{t('rent.intro')}</p>
      </div>
      <button className="btn-primary" onClick={() => { setError(''); setMode('form'); }}>{t('rent.cta')}</button>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('rent.mine')}</p>
        {mine.length === 0 ? (
          <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-gray-500">{t('rent.none')}</p>
        ) : (
          <ul className="space-y-2">
            {mine.map((r) => {
              const full = r.accepted >= r.trucks;
              return (
                <li key={r.id} className="space-y-2 rounded-2xl border border-black/5 p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold">📅 {fmt(r.event_at)}</p>
                      <p className="truncate text-sm text-gray-600">➡️ {r.dest_note}</p>
                      <p className="text-sm text-gray-600">🛺 ×{r.trucks} · {peso(r.total)}</p>
                    </div>
                    <span className={
                      'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ' +
                      (full ? 'bg-emerald-50 text-available' : 'bg-amber-50 text-accent')
                    }>
                      {t('rent.confirmed').replace('{a}', r.accepted).replace('{n}', r.trucks)}
                    </span>
                  </div>

                  {r.accepted === 0 && <p className="text-xs text-gray-500">{t('rent.waitingDrivers')}</p>}
                  {r.accepted > 0 && !full && <p className="text-xs text-accent">{t('rent.partialNote')}</p>}

                  {r.drivers?.length > 0 && (
                    <div className="rounded-xl bg-gray-50 p-2 text-xs">
                      <p className="mb-1 font-bold text-gray-500">{t('rent.drivers')}</p>
                      {r.drivers.map((d, i) => (
                        <p key={i} className="py-0.5">🛺 <b>{d.plate}</b> · {d.first_name}{d.toda ? ` · ${d.toda}` : ''}</p>
                      ))}
                      <button
                        className="relative mt-2 w-full rounded-full bg-brand px-3 py-2 text-sm font-extrabold"
                        onClick={() => onChat({ rentalId: r.id, title: `${t('chat.group')} · ${r.dest_note}` })}
                      >
                        💬 {t('chat.group')} ({r.drivers.length + 1})
                        {unread.has(r.id) && <span className="absolute right-3 top-2 h-3 w-3 rounded-full bg-full" />}
                      </button>
                    </div>
                  )}

                  <button className="w-full text-center text-sm font-bold text-full underline" onClick={() => cancel(r.id)}>
                    {t('rent.cancel')}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}