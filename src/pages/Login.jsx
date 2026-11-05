import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

export default function Login() {
  const nav = useNavigate();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    nav('/');
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
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4">
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
      </main>
    </div>
  );
}