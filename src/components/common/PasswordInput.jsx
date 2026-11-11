import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';

export default function PasswordInput({ id, value, onChange, autoComplete, minLength }) {
  const [show, setShow] = useState(false);
  const { t } = useLang();
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="input pr-20"
        placeholder="••••••"
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        minLength={minLength}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500"
      >
        {show ? t('auth.hide') : t('auth.show')}
      </button>
    </div>
  );
}