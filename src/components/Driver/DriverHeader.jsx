import { useLang } from '../../context/LanguageContext';
import LanguageToggle from '../common/LanguageToggle';

export default function DriverHeader({ plate, onSignOut }) {
  const { t } = useLang();
  return (
    <header className="sticky top-0 z-20 bg-brand shadow-sm">
      <div className="mx-auto max-w-md px-4 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛺</span>
            <span className="text-lg font-extrabold tracking-tight">{t('app.name')}</span>
          </div>
          <LanguageToggle />
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight">{t('driver.title')}</h1>
            <p className="text-sm text-ink/70">{t('driver.plate')}</p>
          </div>
          <span className="rounded-lg bg-ink px-3 py-1.5 text-sm font-extrabold tracking-widest text-brand">
            {plate}
          </span>
        </div>
      </div>
      <div className="h-4 rounded-t-[1.5rem] bg-brand-soft" />
      <button onClick={onSignOut} className="sr-only">{t('common.signOut')}</button>
    </header>
  );
}