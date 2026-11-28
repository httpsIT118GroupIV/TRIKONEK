import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import useProfile from '../hooks/useProfile';
import { getMyDriver, updateDriver, uploadQr } from '../services/driverService';
import QrUpload from '../components/Driver/QrUpload';
import QrVisibility from '../components/Driver/QrVisibility';

const BADGE = {
  verified: 'bg-emerald-50 text-available',
  pending: 'bg-amber-50 text-accent',
  rejected: 'bg-rose-50 text-full',
};

function Field({ label, children }) {
  return (
    <label className="ios-row">
      <span className="shrink-0 font-medium">{label}</span>
      {children}
    </label>
  );
}

export default function Profile({ embedded = false }) {
  const nav = useNavigate();
  const { session, role, signOut } = useAuth();
  const { t } = useLang();
  const { profile, loading, reload } = useProfile();
  const userId = session.user.id;

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pBusy, setPBusy] = useState(false);
  const [pMsg, setPMsg] = useState('');
  const [pErr, setPErr] = useState('');

  const [driver, setDriver] = useState(null);
  const [form, setForm] = useState({ plate: '', toda: '', franchise: '' });
  const [dBusy, setDBusy] = useState(false);
  const [dMsg, setDMsg] = useState('');
  const [dErr, setDErr] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
    }
  }, [profile]);

  useEffect(() => {
    if (role !== 'driver') return;
    getMyDriver(userId)
      .then((d) => {
        setDriver(d);
        setForm({
          plate: d.tricycle_plate_number ?? '',
          toda: d.toda_name ?? '',
          franchise: d.franchise_number ?? '',
        });
      })
      .catch((e) => setDErr(e.message));
  }, [role, userId]);

  async function saveProfile(e) {
    e.preventDefault();
    setPErr(''); setPMsg(''); setPBusy(true);
    const { error } = await supabase.rpc('update_my_profile', { p_full_name: fullName, p_phone: phone });
    setPBusy(false);
    if (error) return setPErr(error.message);
    setPMsg(t('profile.saved'));
    reload();
  }

  async function saveDriver(e) {
    e.preventDefault();
    setDErr(''); setDMsg('');
    if (!form.plate.trim()) return setDErr(t('profile.plateRequired'));
    setDBusy(true);
    try {
      const d = await updateDriver(userId, {
        tricycle_plate_number: form.plate.trim(),
        toda_name: form.toda.trim() || null,
        franchise_number: form.franchise.trim() || null,
      });
      setDriver(d);
      setDMsg(t('profile.saved'));
    } catch (err) {
      setDErr(err.message);
    } finally {
      setDBusy(false);
    }
  }

  // Walang try/catch dito: ang QrUpload ang magpapakita ng error
  async function handleQr(file) {
    setDriver(await uploadQr(userId, file));
  }

  if (loading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-ink/70">{t('driver.loading')}</div>;
  }

  const name = profile?.full_name || profile?.username || '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const locked = driver?.verification_status === 'verified';
  const status = driver?.verification_status || 'pending';

  return (
    <div className={embedded ? '' : 'min-h-screen bg-brand-soft pb-10'}>
      {!embedded && (
        <header className="flex items-center bg-brand px-4 py-3">
          <button onClick={() => nav(-1)} aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">←</button>
          <h1 className="flex-1 pr-9 text-center text-lg font-extrabold">{t('profile.title')}</h1>
        </header>
      )}

      <main className="mx-auto max-w-md px-4 py-4">
        {/* Avatar */}
        <div className="flex flex-col items-center pb-2 pt-2 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand text-3xl font-extrabold">{initial}</span>
          <p className="mt-2 text-xl font-extrabold leading-tight">{name}</p>
          <p className="text-sm text-gray-500">{profile?.email}</p>
          {role && (
            <span className="mt-1.5 rounded-full bg-white px-3 py-0.5 text-xs font-bold">{t(`role.${role}`)}</span>
          )}
        </div>

        {/* Account */}
        <form onSubmit={saveProfile}>
          <div className="ios-group mt-3">
            <Field label={t('profile.fullName')}>
              <input className="ios-input" value={fullName} maxLength={80} autoComplete="name"
                onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label={t('profile.phone')}>
              <input className="ios-input" type="tel" inputMode="tel" placeholder="09xx xxx xxxx"
                value={phone} maxLength={20} autoComplete="tel" onChange={(e) => setPhone(e.target.value)} />
            </Field>
          </div>
          {pErr && <p className="mt-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{pErr}</p>}
          {pMsg && <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{pMsg}</p>}
          <button type="submit" className="btn-primary mt-3" disabled={pBusy}>
            {pBusy ? t('profile.saving') : t('profile.save')}
          </button>
        </form>

        {/* Driver */}
        {role === 'driver' && driver && (
          <>
            <form onSubmit={saveDriver}>
              <p className="ios-head">{t('profile.driverDetails')}</p>
              <div className="ios-group">
                <div className="ios-row">
                  <span className="font-medium">Status</span>
                  <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + (BADGE[status] || BADGE.pending)}>
                    {t(`verify.${status}`)}
                  </span>
                </div>
                <Field label={t('field.plate')}>
                  <input className="ios-input" value={form.plate} disabled={locked}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })} />
                </Field>
                <Field label={t('profile.toda')}>
                  <input className="ios-input" value={form.toda} disabled={locked}
                    onChange={(e) => setForm({ ...form, toda: e.target.value })} />
                </Field>
                <Field label={t('profile.franchise')}>
                  <input className="ios-input" value={form.franchise} disabled={locked}
                    onChange={(e) => setForm({ ...form, franchise: e.target.value })} />
                </Field>
                <div className="ios-row">
                  <span className="shrink-0 font-medium">{t('profile.line')}</span>
                  <span className="text-right text-sm text-gray-600">
                    {driver.line ? t(`line.${driver.line}`) : t('profile.lineNone')}
                  </span>
                </div>
              </div>
              {locked && <p className="ios-foot">{t('profile.locked')}</p>}
              {dErr && <p className="mt-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{dErr}</p>}
              {dMsg && <p className="mt-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{dMsg}</p>}
              {!locked && (
                <button type="submit" className="btn-primary mt-3" disabled={dBusy}>
                  {dBusy ? t('profile.saving') : t('profile.save')}
                </button>
              )}
            </form>

            <QrUpload qrUrl={driver.qr_code_url} onUpload={handleQr} />

            <div className="mt-3 [&>section]:rounded-2xl [&>section]:border-0 [&>section]:shadow-none">
              <QrVisibility driver={driver} onChange={setDriver} />
            </div>

            {locked && (
              <div className="ios-group mt-3">
                <Link to={`/sticker/${encodeURIComponent(driver.tricycle_plate_number)}`} className="ios-row font-semibold">
                  <span>🖨️ {t('sticker.open')}</span>
                  <span className="text-gray-400">›</span>
                </Link>
              </div>
            )}
          </>
        )}

        {/* Iba pa */}
        <div className="ios-group mt-5">
          <Link to="/faq" className="ios-row font-semibold">
            <span>❓ {t('menu.faq')}</span>
            <span className="text-gray-400">›</span>
          </Link>
          <button onClick={signOut} className="ios-row w-full justify-center font-semibold text-full">
            {t('common.signOut')}
          </button>
        </div>
      </main>
    </div>
  );
}