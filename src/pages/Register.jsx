import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

export default function Register() {
  const nav = useNavigate();
  const { t } = useLang();

  // Gagamit ng translation kung meron, kung wala ay ang English na fallback
  const tr = (key, fallback) => {
    const v = t(key);
    return v && v !== key ? v : fallback;
  };

  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'commuter', plate: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const ROLES = [
    { value: 'commuter', icon: '🧍', label: tr('register.commuter', 'Commuter'), hint: tr('register.commuterHint', 'Sumasakay') },
    { value: 'driver', icon: '🛺', label: tr('register.driver', 'Driver'), hint: tr('register.driverHint', 'Nagmamaneho') },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          role: form.role,
          plate_number: form.role === 'driver' ? form.plate.trim() : null,
        },
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.session) {
      return setInfo(tr('register.checkEmail', 'Check your email to confirm your account, then log in.'));
    }
    nav('/'); // ang router na ang maghahatid sa tamang screen
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
        <h1 className="mt-6 text-3xl font-extrabold leading-tight">
          {tr('register.title', 'Create account')}
        </h1>
        <p className="mt-1 text-ink/70">
          {tr('register.subtitle', 'Sumali sa TrikoNek sa ilang segundo lang.')}
        </p>
      </header>

      <main className="flex-1 bg-white rounded-t-[2rem] px-5 pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
          <div>
            <span className="label">{tr('register.iAm', 'I am a')}</span>
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
                      (on
                        ? 'border-brand-dark bg-brand-soft ring-4 ring-brand/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50')
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
            <label className="label" htmlFor="username">{tr('field.username', 'Username')}</label>
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
            <input id="password" type="password" className="input" placeholder="••••••"
              value={form.password} onChange={set('password')} minLength={6} required autoComplete="new-password" />
            <p className="mt-1 text-xs text-gray-500">{tr('register.minPassword', 'At least 6 characters')}</p>
          </div>

          {form.role === 'driver' && (
            <div>
              <label className="label" htmlFor="plate">{tr('field.plate', 'Tricycle plate number')}</label>
              <input id="plate" className="input" placeholder="ABC 123"
                value={form.plate} onChange={set('plate')} required />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-rose-50 text-full text-sm font-medium px-4 py-3">{error}</p>
          )}
          {info && (
            <p className="rounded-xl bg-emerald-50 text-available text-sm font-medium px-4 py-3">{info}</p>
          )}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? tr('register.loading', 'Creating account…') : tr('register.button', 'Register')}
          </button>

          <p className="text-center text-sm text-gray-600 pt-2">
            {tr('register.haveAccount', 'Have an account?')}{' '}
            <Link to="/login" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
              {tr('register.login', 'Log in')}
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}