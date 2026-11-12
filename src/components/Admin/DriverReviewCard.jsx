import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const LINES = ['libon_local', 'direct_polangui', 'libon_polangui'];

const BADGE = {
  verified: 'bg-emerald-50 text-available',
  pending: 'bg-amber-50 text-accent',
  rejected: 'bg-rose-50 text-full',
};

function Row({ label, children }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="break-all text-right font-semibold">{children || '—'}</span>
    </div>
  );
}

export default function DriverReviewCard({ d, busy, onApprove, onReject, onRevoke, onReopen, onSetLine }) {
  const { t, lang } = useLang();
  const [line, setLine] = useState(d.line ?? '');
  const u = d.user;
  const status = d.verification_status;
  const name = u?.full_name || u?.username || t('admin.noName');
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const date = u?.created_at
    ? new Date(u.created_at).toLocaleDateString(lang === 'tl' ? 'fil-PH' : 'en-PH', { dateStyle: 'medium' })
    : '';

  function pickLine(e) {
    const v = e.target.value;
    setLine(v);
    if (status === 'verified' && v) onSetLine(v);
  }

  return (
    <article className="card space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold leading-tight">{name}</p>
          <p className="truncate text-sm text-gray-500">🛺 {d.tricycle_plate_number}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + BADGE[status]}>
            {t(`verify.${status}`)}
          </span>
          {d.is_online && (
            <span className="text-xs font-semibold text-available">● {t('admin.online')}</span>
          )}
        </div>
      </div>

      <div className="space-y-1.5 rounded-xl bg-gray-50 p-3">
        <Row label={t('admin.toda')}>{d.toda_name}</Row>
        <Row label={t('admin.franchise')}>{d.franchise_number}</Row>
        <Row label={t('admin.phone')}>
          {u?.phone && <a href={`tel:${u.phone}`} className="underline">{u.phone}</a>}
        </Row>
        <Row label="Email">{u?.email}</Row>
        <Row label={t('admin.registered')}>{date}</Row>
      </div>

      {status !== 'rejected' && (
        <div>
          <label className="label">{t('admin.line')}</label>
          <select className="input" value={line} disabled={busy} onChange={pickLine}>
            <option value="">{t('admin.chooseLine')}</option>
            {LINES.map((l) => (
              <option key={l} value={l}>{t(`line.${l}`)}</option>
            ))}
          </select>
        </div>
      )}

      {status === 'verified' && (
        <div className="grid grid-cols-2 gap-3">
          <Link
            to={`/sticker/${encodeURIComponent(d.tricycle_plate_number)}`}
            className="btn-dark flex items-center justify-center"
          >
            🖨️ {t('sticker.open')}
          </Link>
          <button className="btn-ghost" disabled={busy} onClick={onRevoke}>{t('admin.revoke')}</button>
        </div>
      )}

      {status === 'verified' && (
        <button className="btn-ghost" disabled={busy} onClick={onRevoke}>{t('admin.revoke')}</button>
      )}

      {status === 'rejected' && (
        <button className="btn-ghost" disabled={busy} onClick={onReopen}>{t('admin.reopen')}</button>
      )}
    </article>
  );
}