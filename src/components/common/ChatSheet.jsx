import { useCallback, useEffect, useRef, useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { chatMessages, chatSend, seenKey, chatErrorKey } from '../../services/rentService';

export default function ChatSheet({ rentalId, title, onClose }) {
  const { t } = useLang();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const end = useRef(null);

  const load = useCallback(() => {
    chatMessages(rentalId)
      .then((m) => {
        setMsgs(m ?? []);
        const last = m?.[m.length - 1];
        if (last) { try { localStorage.setItem(seenKey(rentalId), last.at); } catch { /* ignore */ } }
      })
      .catch((e) => { const k = chatErrorKey(e.message); setError(k ? t(k) : e.message); });
  }, [rentalId, t]);

  useEffect(() => {
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length]);

  async function send(e) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setBusy(true);
    setError('');
    try { await chatSend(rentalId, body); setText(''); load(); }
    catch (err) { const k = chatErrorKey(err.message); setError(k ? t(k) : err.message); }
    finally { setBusy(false); }
  }

  const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const who = (m) => (m.plate ? `🛺 ${m.plate} · ${m.name}` : `👤 ${m.name}`);

  return (
    <div className="fixed inset-0 z-[2500] flex flex-col bg-brand-soft">
      <header className="flex items-center gap-3 bg-brand px-4 py-3 shadow-sm">
        <button onClick={onClose} aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">←</button>
        <p className="min-w-0 flex-1 truncate text-lg font-extrabold">💬 {title}</p>
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && <p className="pt-10 text-center text-sm text-gray-500">{t('chat.empty')}</p>}
        {msgs.map((m) => (
          <div key={m.id} className={'flex ' + (m.mine ? 'justify-end' : 'justify-start')}>
            <div className={'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ' + (m.mine ? 'rounded-br-md bg-brand text-ink' : 'rounded-bl-md bg-white')}>
              {!m.mine && <p className="mb-0.5 text-xs font-extrabold text-accent">{who(m)}</p>}
              <p className="whitespace-pre-wrap break-words">{m.body}</p>
              <p className="mt-0.5 text-right text-[10px] text-gray-500">{time(m.at)}</p>
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>

      {error && <p className="mx-4 mb-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-full">{error}</p>}
      <form onSubmit={send} className="flex gap-2 border-t border-black/5 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input className="input h-12 flex-1" maxLength={500} placeholder={t('chat.placeholder')} value={text} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={busy || !text.trim()} className="h-12 shrink-0 rounded-full bg-brand px-5 font-extrabold disabled:opacity-50">➤</button>
      </form>
    </div>
  );
}