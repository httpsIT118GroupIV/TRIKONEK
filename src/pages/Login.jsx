import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const DEMO_PASSWORD = 'Demo12345!';
const DEMO_ACCOUNTS = {
  commuter: 'demo.commuter@example.com',
  driver: 'demo.driver@example.com',
};

export default function Login() {
  const nav = useNavigate();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(em, pw) {
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
    setLoading(false);
    if (error) return setError(error.message);
    nav('/');
  }

  function handleSubmit(e) {
    e.preventDefault();
    signIn(email, password);
  }

  return (
    <div className="min-h-screen bg-brand flex flex-col">
      <header className="px-5 pt-6 pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🛺</span>
            <span className="text-xl font-extrabold tracking-tight">{t('app.name')}</span>
          </div>
          <LanguageToggle />
        </div>
        <h1 className="mt-8 text-3xl font-extrabold leading-tight">{t('login.title')}</h1>
        <p className="mt-1 text-ink/70">{t('login.subtitle')}</p>
      </header>

      <main className="flex-1 bg-white rounded-t-[2rem] px-5 pt-8 pb-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
        <div className="mx-auto w-full max-w-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label" htmlFor="email">{t('field.email')}</label>
              <input id="email" type="email" className="input" placeholder="you@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="label" htmlFor="password">{t('field.password')}</label>
              <input id="password" type="password" className="input" placeholder="••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 text-full text-sm font-medium px-4 py-3">{error}</p>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? t('login.loading') : t('login.button')}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
                {t('login.register')}
              </Link>
            </p>
          </form>

          {DEMO && (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-4">
              <p className="text-sm font-bold">Demo mode</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">Isang click lang, walang kailangang i-type.</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="btn-ghost" disabled={loading}
                  onClick={() => signIn(DEMO_ACCOUNTS.commuter, DEMO_PASSWORD)}>
                  View as Commuter
                </button>
                <button type="button" className="btn-dark" disabled={loading}
                  onClick={() => signIn(DEMO_ACCOUNTS.driver, DEMO_PASSWORD)}>
                  View as Driver
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}