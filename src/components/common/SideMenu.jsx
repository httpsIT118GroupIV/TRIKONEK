import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import useProfile from '../../hooks/useProfile';
import LanguageToggle from './LanguageToggle';

export default function SideMenu({ open, onClose }) {
  const { session, role, signOut } = useAuth();
  const { t } = useLang();
  const { profile } = useProfile();

  const name = profile?.full_name || profile?.username || session?.user?.email || '';
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  const items = [
    { to: '/profile', icon: '👤', label: t('menu.profile') },
    { to: '/faq', icon: '❓', label: t('menu.faq') },
  ];

  return (
    <div className={'fixed inset-0 z-[2000] ' + (open ? '' : 'pointer-events-none')} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={'absolute inset-0 bg-black/50 transition-opacity ' + (open ? 'opacity-100' : 'opacity-0')}
      />
      <aside
        className={
          'absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-200 ' +
          (open ? 'translate-x-0' : '-translate-x-full')
        }
      >
        <div className="bg-brand px-5 pb-5 pt-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ink text-2xl font-extrabold text-white">
            {initial}
          </div>
          <p className="mt-3 truncate text-lg font-extrabold leading-tight">{name}</p>
          <p className="truncate text-sm text-ink/70">{profile?.email || session?.user?.email}</p>
          {role && (
            <span className="mt-2 inline-block rounded-full bg-white/70 px-2.5 py-0.5 text-xs font-bold">
              {t(`role.${role}`)}
            </span>
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((it) => (
            <Link
              key={it.to}
              to={it.to}
              onClick={onClose}
              className="flex items-center gap-3 rounded-2xl px-3 py-3 font-semibold transition hover:bg-gray-50 active:scale-[0.99]"
            >
              <span className="text-xl">{it.icon}</span>
              {it.label}
            </Link>
          ))}

          <div className="mt-4 rounded-2xl bg-gray-50 p-3">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('menu.settings')}</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold">{t('menu.language')}</span>
              <LanguageToggle />
            </div>
          </div>
        </nav>

        <div className="p-4">
          <button onClick={signOut} className="btn-dark">{t('common.signOut')}</button>
        </div>
      </aside>
    </div>
  );
}