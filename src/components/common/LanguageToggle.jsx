import { useLang } from '../../context/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang();
  return (
    <div className={`inline-flex rounded-full bg-black/10 p-1 text-xs font-bold ${className}`}>
      {['en', 'tl'].map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-full transition ${
            lang === l ? 'bg-ink text-white' : 'text-ink/70'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}