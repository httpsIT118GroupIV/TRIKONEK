import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import AppHeader from '../components/common/AppHeader';
import AppTabs from '../components/common/AppTabs';
import DriversPanel from '../components/Admin/DriversPanel';
import FaresPanel from '../components/Admin/FaresPanel';
import RentalsPanel from '../components/Admin/RentalsPanel';
import SettingsPanel from '../components/Admin/SettingsPanel';
import Profile from './Profile';

export default function AdminDashboard() {
  const { t } = useLang();
  const [tab, setTab] = useState('drivers');

  const TABS = [
    { id: 'drivers', icon: '🛺', label: t('admin.tabDrivers') },
    { id: 'fares', icon: '💰', label: t('admin.tabFares') },
    { id: 'rentals', icon: '🎉', label: t('admin.tabRentals') },
    { id: 'settings', icon: '⚙️', label: t('admin.tabSettings') },
    { id: 'profile', icon: '👤', label: t('tab.profile') },
  ];

  return (
    <div className="flex h-dvh flex-col bg-brand-soft">
      <AppHeader badge={`🛡️ ${t('admin.title')}`} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
          {tab === 'drivers' && <DriversPanel />}
          {tab === 'fares' && <FaresPanel />}
          {tab === 'rentals' && <RentalsPanel />}
          {tab === 'settings' && <SettingsPanel />}
        </main>
        {tab === 'profile' && <Profile embedded />}
      </div>
      <AppTabs tabs={TABS} tab={tab} onChange={setTab} />
    </div>
  );
}