import { Link } from 'react-router-dom';
import { useLang } from '../../context/LanguageContext';
import useProfile from '../../hooks/useProfile';

const BADGE = {
  verified: 'bg-emerald-50 text-available',
  pending: 'bg-amber-50 text-accent',
  rejected: 'bg-rose-50 text-full',
};

export default function ProfileCard({ driver }) {
  const { t } = useLang();
  const { profile } = useProfile();
  const name = profile?.full_name || profile?.username || '';
  const initial = name.trim().charAt(0).toUpperCase() || '🛺';
  const status = driver?.verification_status || 'pending';

  return (
    <Link to="/profile" className="card flex items-center gap-3 transition active:scale-[0.99]">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-xl font-extrabold">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{name}</p>
        <p className="text-xs text-gray-500">{t('profile.view')}</p>
      </div>
      <span className={'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ' + (BADGE[status] || BADGE.pending)}>
        {t(`verify.${status}`)}
      </span>
      <span className="text-gray-400">›</span>
    </Link>
  );
}