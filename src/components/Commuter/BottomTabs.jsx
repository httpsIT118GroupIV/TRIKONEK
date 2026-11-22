export default function BottomTabs({ tabs, active, onChange }) {
  return (
    <nav
      className="grid gap-1.5 rounded-2xl bg-white p-1.5 shadow-lg"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const on = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            aria-pressed={on}
            className={
              'rounded-xl px-2 py-2 text-center text-sm font-bold transition active:scale-[0.98] ' +
              (on ? 'bg-brand text-ink' : 'text-gray-500')
            }
          >
            <span className="block text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}