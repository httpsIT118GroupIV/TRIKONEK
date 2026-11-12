import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import LanguageToggle from '../components/common/LanguageToggle';
import DriversPanel from '../components/Admin/DriversPanel';
import FaresPanel from '../components/Admin/FaresPanel';
import SettingsPanel from '../components/Admin/SettingsPanel';

const SECTIONS = [
  { id: 'drivers', icon: '🛺', label: 'admin.tabDrivers' },
  { id: 'fares', icon: '💰', label: 'admin.tabFares' },
  { id: 'settings', icon: '⚙️', label: 'admin.tabSettings' },
];

export default function AdminDashboard() {
  const { signOut } = useAuth();
  const { t } = useLang();
  const [section, setSection] = useState('drivers');

  return (
    <div className="min-h-screen bg-brand-soft pb-10">
      <header className="bg-brand px-4 pb-5 pt-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-lg font-extrabold tracking-tight">{t('admin.title')}</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <Link to="/profile" className="flex h-9 items-center rounded-full bg-white/70 px-3 text-sm font-bold">
              {t('menu.profile')}
            </Link>
            <button onClick={signOut} className="h-9 rounded-full bg-ink px-3 text-sm font-bold text-white">
              {t('common.signOut')}
            </button>
          </div>
        </div>
        <p className="mx-auto mt-3 max-w-2xl text-ink/70">{t('admin.subtitle')}</p>
      </header>

      <main className="mx-auto -mt-1 max-w-2xl space-y-4 px-4 pt-4">
        <div className="grid grid-cols-3 gap-2">
          {SECTIONS.map((s) => {
            const on = section === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                aria-pressed={on}
                className={
                  'rounded-2xl px-2 py-3 text-center text-sm font-bold transition active:scale-[0.98] ' +
                  (on ? 'bg-ink text-white shadow' : 'bg-white text-ink')
                }
              >
                <span className="block text-xl">{s.icon}</span>
                {t(s.label)}
              </button>
            );
          })}
        </div>

        {section === 'drivers' && <DriversPanel />}
        {section === 'fares' && <FaresPanel />}
        {section === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}