import { useLang } from '../../context/LanguageContext';

const TABS = [
  { id: 'home', icon: '🏠', key: 'tab.home' },
  { id: 'requests', icon: '🎉', key: 'tab.requests' },
  { id: 'profile', icon: '👤', key: 'tab.profile' },
];

export default function DriverTabs({ tab, onChange, badge = 0 }) {
  const { t } = useLang();
  return (
    <nav className="relative z-30 shrink-0 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md grid-cols-3">
        {TABS.map((x) => {
          const active = tab === x.id;
          return (
            <button
              key={x.id}
              onClick={() => onChange(x.id)}
              className={'flex flex-col items-center gap-0.5 py-2 text-xs font-bold transition ' + (active ? 'text-ink' : 'text-gray-400')}
            >
              <span className={'relative flex h-8 w-14 items-center justify-center rounded-full text-xl transition ' + (active ? 'bg-brand' : '')}>
                {x.icon}
                {x.id === 'requests' && badge > 0 && (
                  <span className="absolute -right-0.5 -top-1 min-w-5 rounded-full bg-full px-1 text-center text-[11px] font-bold leading-5 text-white">
                    {badge}
                  </span>
                )}
              </span>
              {t(x.key)}
            </button>
          );
        })}
      </div>
    </nav>
  );
}