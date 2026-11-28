import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';

const KEYS = {
  commuter: ['faq', 5],
  driver: ['faqd', 6],
  admin: ['faq', 5],
};

export default function Faq() {
  const nav = useNavigate();
  const { role } = useAuth();
  const { t } = useLang();
  const [prefix, count] = KEYS[role] ?? KEYS.commuter;
  const items = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <header className="flex items-center justify-between bg-brand px-4 py-3">
        <button
          onClick={() => nav(-1)}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"
        >
          ←
        </button>
        <h1 className="text-lg font-extrabold">{t('faq.title')}</h1>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-md space-y-3 px-4 py-4">
        {items.map((n) => (
          <details key={n} className="card group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold">
              {t(`${prefix}.q${n}`)}
              <span className="text-gray-400 transition group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{t(`${prefix}.a${n}`)}</p>
          </details>
        ))}
      </main>
    </div>
  );
}