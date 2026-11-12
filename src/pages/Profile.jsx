import { useEffect, useState } from 'react';
import QrVisibility from '../components/Driver/QrVisibility';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import useProfile from '../hooks/useProfile';
import { getMyDriver, updateDriver, uploadQr } from '../services/driverService';
import QrUpload from '../components/Driver/QrUpload';
import LanguageToggle from '../components/common/LanguageToggle';

const BADGE = {
  verified: 'bg-emerald-50 text-available',
  pending: 'bg-amber-50 text-accent',
  rejected: 'bg-rose-50 text-full',
};

export default function Profile() {
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
    setPErr('');
    setPMsg('');
    setPBusy(true);
    const { error } = await supabase.rpc('update_my_profile', { p_full_name: fullName, p_phone: phone });
    setPBusy(false);
    if (error) return setPErr(error.message);
    setPMsg(t('profile.saved'));
    reload();
  }

  async function saveDriver(e) {
    e.preventDefault();
    setDErr('');
    setDMsg('');
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

  async function handleQr(file) {
    setDErr('');
    try {
      setDriver(await uploadQr(userId, file));
    } catch (err) {
      setDErr(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-soft text-ink/70">
        {t('driver.loading')}
      </div>
    );
  }

  const name = profile?.full_name || profile?.username || '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const locked = driver?.verification_status === 'verified';
  const status = driver?.verification_status || 'pending';

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <header className="flex items-center justify-between bg-brand px-4 py-3">
        <button
          onClick={() => nav('/')}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
        >
          ←
        </button>
        <h1 className="text-lg font-extrabold">{t('profile.title')}</h1>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        {/* Account */}
        <section className="card">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-extrabold">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-lg font-extrabold leading-tight">{name}</p>
              <p className="truncate text-sm text-gray-500">{profile?.email}</p>
              {role && (
                <span className="mt-1 inline-block rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-bold">
                  {t(`role.${role}`)}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={saveProfile} className="mt-4 space-y-3">
            <div>
              <label className="label" htmlFor="fullName">{t('profile.fullName')}</label>
              <input id="fullName" className="input" value={fullName} maxLength={80}
                onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
            </div>
            <div>
              <label className="label" htmlFor="phone">{t('profile.phone')}</label>
              <input id="phone" className="input" type="tel" inputMode="tel" placeholder="09xx xxx xxxx"
                value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
            </div>
            {pErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{pErr}</p>}
            {pMsg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{pMsg}</p>}
            <button type="submit" className="btn-primary" disabled={pBusy}>
              {pBusy ? t('profile.saving') : t('profile.save')}
            </button>
          </form>
        </section>

        {/* Driver details */}
        {role === 'driver' && driver && (
          <>
            <section className="card">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-extrabold">{t('profile.driverDetails')}</h3>
                <span className={'rounded-full px-2.5 py-1 text-xs font-bold ' + (BADGE[status] || BADGE.pending)}>
                  {t(`verify.${status}`)}
                </span>
              </div>

              <form onSubmit={saveDriver} className="mt-3 space-y-3">
                <div>
                  <label className="label" htmlFor="plate">{t('field.plate')}</label>
                  <input id="plate" className="input" value={form.plate} disabled={locked}
                    onChange={(e) => setForm({ ...form, plate: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="toda">{t('profile.toda')}</label>
                  <input id="toda" className="input" value={form.toda} disabled={locked}
                    onChange={(e) => setForm({ ...form, toda: e.target.value })} />
                </div>
                <div>
                  <label className="label" htmlFor="franchise">{t('profile.franchise')}</label>
                  <input id="franchise" className="input" value={form.franchise} disabled={locked}
                    onChange={(e) => setForm({ ...form, franchise: e.target.value })} />
                </div>

                <div>
                  <span className="label">{t('profile.line')}</span>
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    {driver.line ? t(`line.${driver.line}`) : t('profile.lineNone')}
                  </p>
                </div>

                {locked ? (
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-xs text-gray-500">{t('profile.locked')}</p>
                ) : (
                  <button type="submit" className="btn-primary" disabled={dBusy}>
                    {dBusy ? t('profile.saving') : t('profile.save')}
                  </button>
                )}
                {dErr && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{dErr}</p>}
                {dMsg && <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-available">{dMsg}</p>}
              </form>
            </section>

                       <QrVisibility driver={driver} onChange={setDriver} />
            {locked && (
              <Link
                to={`/sticker/${encodeURIComponent(driver.tricycle_plate_number)}`}
                className="btn-dark flex items-center justify-center"
              >
                🖨️ {t('sticker.open')}
              </Link>
            )}
            
          </>
        )}

        <button onClick={signOut} className="btn-ghost">{t('common.signOut')}</button>
      </main>
    </div>
  );
}