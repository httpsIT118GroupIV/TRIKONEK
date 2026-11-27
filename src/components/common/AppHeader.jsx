import { useLang } from '../../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function AppHeader({ badge }) {
  const { t } = useLang();
  return (
    <header className="relative z-30 shrink-0 bg-brand shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛺</span>
          <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge && (
            <span className="rounded-lg bg-ink px-2.5 py-1 text-xs font-extrabold tracking-wide text-brand">
              {badge}
            </span>
          )}
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}