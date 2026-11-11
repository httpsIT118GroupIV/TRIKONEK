import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

export default function Faq() {
  const nav = useNavigate();
  const { t } = useLang();

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
        <h1 className="text-lg font-extrabold">{t('faq.title')}</h1>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-md space-y-3 px-4 pt-4">
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className="card">
            <summary className="cursor-pointer font-bold">{t(`faq.q${n}`)}</summary>
            <p className="mt-2 text-sm text-gray-600">{t(`faq.a${n}`)}</p>
          </details>
        ))}
      </main>
    </div>
  );
}