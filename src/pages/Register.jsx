import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import PasswordInput from '../components/common/PasswordInput';
import { HOME } from '../utils/roleHome';
import { authErrorKey } from '../utils/authErrors';

const PH_PHONE = /^(09\d{9}|\+639\d{9})$/;

export default function Register() {
  const { session, role, loading: authLoading } = useAuth();
  const { t } = useLang();

  const [form, setForm] = useState({
    role: 'commuter', fullName: '', phone: '', username: '', email: '',
    password: '', confirm: '', plate: '', toda: '', franchise: '', agree: false,
  });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (!authLoading && session) {
    return <Navigate to={role ? HOME[role] : '/'} replace />;
  }

  const ROLES = [
    { value: 'commuter', icon: '🧍', label: t('role.commuter'), hint: t('role.commuterDesc') },
    { value: 'driver', icon: '🛺', label: t('role.driver'), hint: t('role.driverDesc') },
  ];
  const isDriver = form.role === 'driver';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');

    const phone = form.phone.replace(/[\s-]/g, '');
    const plate = form.plate.trim().toUpperCase();
    const franchise = form.franchise.trim();
    const toda = form.toda.trim();

    if (form.fullName.trim().length < 2) return setError(t('reg.err.name'));
    if (!PH_PHONE.test(phone)) return setError(t('reg.err.phone'));
    if (form.password !== form.confirm) return setError(t('reg.err.match'));
    if (isDriver && (!plate || !toda || !franchise)) return setError(t('reg.err.driverFields'));
    if (!form.agree) return setError(t('reg.err.consent'));

    setSubmitting(true);

    if (isDriver) {
      const { data: chk, error: chkErr } = await supabase.rpc('check_driver_signup', {
        p_plate: plate, p_franchise: franchise,
      });
      if (!chkErr && chk === 'plate') {
        setSubmitting(false);
        return setError(t('reg.err.plateTaken'));
      }
      if (!chkErr && chk === 'franchise') {
        setSubmitting(false);
        return setError(t('reg.err.franchiseTaken'));
      }
    }

    const meta = {
      username: form.username.trim(),
      full_name: form.fullName.trim(),
      phone,
      role: form.role,
    };
    if (isDriver) {
      meta.plate_number = plate;
      meta.toda_name = toda;
      meta.franchise_number = franchise;
    }

    const { data, error } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: { data: meta },
    });

    if (error) {
      setSubmitting(false);
      const k = authErrorKey(error.message);
      return setError(k ? t(k) : error.message);
    }
    if (!data.session) {
      setSubmitting(false);
      return setInfo(t('register.checkEmail'));
    }
    // May session na: ang redirect sa itaas ang magdadala sa tamang screen
  }

  return (
    <div className="min-h-screen bg-brand flex flex-col">
      <header className="px-5 pt-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🛺</span>
            <span className="text-xl font-extrabold tracking-tight">{t('app.name')}</span>
          </div>
          <LanguageToggle />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold leading-tight">{t('register.title')}</h1>
        <p className="mt-1 text-ink/70">{t('register.subtitle')}</p>
      </header>

      <main className="flex-1 bg-white rounded-t-[2rem] px-5 pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
          <div>
            <span className="label">{t('field.iAm')}</span>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((r) => {
                const on = form.role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setForm({ ...form, role: r.value })}
                    className={
                      'rounded-2xl border-2 px-3 py-3 text-left transition active:scale-[0.98] ' +
                      (on ? 'border-brand-dark bg-brand-soft ring-4 ring-brand/30' : 'border-gray-200 bg-white hover:bg-gray-50')
                    }
                  >
                    <span className="text-2xl">{r.icon}</span>
                    <span className="block font-bold mt-1">{r.label}</span>
                    <span className="block text-xs text-gray-500">{r.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="fullName">{t('field.fullName')}</label>
            <input id="fullName" className="input" placeholder="Juan Dela Cruz"
              value={form.fullName} onChange={set('fullName')} required autoComplete="name" />
          </div>

          <div>
            <label className="label" htmlFor="phone">{t('field.phone')}</label>
            <input id="phone" type="tel" inputMode="tel" className="input" placeholder="09xx xxx xxxx"
              value={form.phone} onChange={set('phone')} required autoComplete="tel" />
            <p className="mt-1 text-xs text-gray-500">{t('field.phoneHint')}</p>
          </div>

          <div>
            <label className="label" htmlFor="username">{t('field.username')}</label>
            <input id="username" className="input" placeholder="juan_dela_cruz"
              value={form.username} onChange={set('username')} required autoComplete="username" />
          </div>

          <div>
            <label className="label" htmlFor="email">{t('field.email')}</label>
            <input id="email" type="email" className="input" placeholder="you@email.com"
              value={form.email} onChange={set('email')} required autoComplete="email" />
          </div>

          <div>
            <label className="label" htmlFor="password">{t('field.password')}</label>
            <PasswordInput id="password" value={form.password} onChange={set('password')}
              autoComplete="new-password" minLength={6} />
            <p className="mt-1 text-xs text-gray-500">{t('field.passwordHint')}</p>
          </div>

          <div>
            <label className="label" htmlFor="confirm">{t('field.confirmPassword')}</label>
            <PasswordInput id="confirm" value={form.confirm} onChange={set('confirm')}
              autoComplete="new-password" minLength={6} />
          </div>

          {isDriver && (
            <div className="space-y-4 rounded-2xl bg-brand-soft p-4">
              <div>
                <label className="label" htmlFor="plate">{t('field.plate')}</label>
                <input id="plate" className="input uppercase" placeholder="ABC 123"
                  value={form.plate} onChange={set('plate')} required />
              </div>
              <div>
                <label className="label" htmlFor="toda">{t('field.toda')}</label>
                <input id="toda" className="input" value={form.toda} onChange={set('toda')} required />
              </div>
              <div>
                <label className="label" htmlFor="franchise">{t('field.franchise')}</label>
                <input id="franchise" className="input" value={form.franchise}
                  onChange={set('franchise')} required />
              </div>
              <p className="text-sm text-accent">{t('reg.driverNote')}</p>
            </div>
          )}

          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 shrink-0 accent-[#FFB300]"
              checked={form.agree}
              onChange={(e) => setForm({ ...form, agree: e.target.checked })}
            />
            <span>{t('reg.consent')}</span>
          </label>

          {error && (
            <p className="rounded-xl bg-rose-50 text-full text-sm font-medium px-4 py-3">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-50 text-available text-sm font-medium px-4 py-3">{info}</p>
          )}

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? t('register.loading') : t('register.button')}
          </button>

          <p className="text-center text-sm text-gray-600 pt-2">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
              {t('register.login')}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}