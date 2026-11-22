import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import PasswordInput from '../components/common/PasswordInput';
import { HOME } from '../utils/roleHome';
import { authErrorKey } from '../utils/authErrors';

export default function Login() {
  const { session, role, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Kapag handa na ang session at role, kusang pupunta sa tamang screen
  if (!authLoading && session) {
    return <Navigate to={role ? HOME[role] : '/'} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setSubmitting(false);
      const k = authErrorKey(error.message);
      return setError(k ? t(k) : error.message);
    }
    // Hindi na mag-navigate dito: ang redirect sa itaas ang bahala
  }

  const busy = submitting || authLoading;

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
              <PasswordInput id="password" value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>

            {error && (
              <p className="rounded-xl bg-rose-50 text-full text-sm font-medium px-4 py-3">{error}</p>
            )}

            <button type="submit" className="btn-primary" disabled={busy}>
              {busy ? t('login.loading') : t('login.button')}
            </button>

            <p className="text-center text-sm text-gray-600 pt-2">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-bold text-ink underline decoration-brand decoration-2 underline-offset-4">
                {t('login.register')}
              </Link>
            </p>
          </form>

          <Link to="/demo" className="btn-ghost mt-4 flex items-center justify-center">
            ▶ {t('dm.try')}
          </Link>
        </div>
      </main>
    </div>
  );
}