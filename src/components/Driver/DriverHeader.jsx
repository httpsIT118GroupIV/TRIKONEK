import { useLang } from '../../context/LanguageContext';
import LanguageToggle from '../common/LanguageToggle';

export default function DriverHeader({ plate, onSignOut }) {
  const { t } = useLang();
  return (
    <header className="relative z-30 shrink-0 bg-brand shadow-sm">
      <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛺</span>
          <span className="hidden text-lg font-extrabold tracking-tight min-[400px]:inline">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-ink px-2.5 py-1 text-xs font-extrabold tracking-widest text-brand">
            {plate}
          </span>
          <LanguageToggle />
          <button
            onClick={onSignOut}
            aria-label={t('common.signOut')}
            title={t('common.signOut')}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white"
          >
            ⎋
          </button>
        </div>
      </div>
    </header>
  );
}