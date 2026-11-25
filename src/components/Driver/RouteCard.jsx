import { useLang } from '../../context/LanguageContext';

export default function RouteCard({ line }) {
  const { t } = useLang();
  return (
    <section className="card flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xl">🛣️</span>
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{t('drv.route')}</p>
        <p className="text-sm font-bold leading-snug">{line ? t(`line.${line}`) : t('profile.lineNone')}</p>
      </div>
    </section>
  );
}