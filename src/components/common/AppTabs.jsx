export default function AppTabs({ tabs, tab, onChange }) {
  return (
    <nav className="relative z-30 shrink-0 border-t border-black/5 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-md" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((x) => {
          const active = tab === x.id;
          return (
            <button
              key={x.id}
              onClick={() => onChange(x.id)}
              className={'flex flex-col items-center gap-0.5 py-2 text-xs font-bold transition ' + (active ? 'text-ink' : 'text-gray-400')}
            >
              <span className={'flex h-8 w-14 items-center justify-center rounded-full text-xl transition ' + (active ? 'bg-brand' : '')}>
                {x.icon}
              </span>
              {x.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}