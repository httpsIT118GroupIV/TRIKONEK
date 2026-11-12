import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';
import { updateDriver } from '../../services/driverService';

export default function QrVisibility({ driver, onChange }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle(e) {
    setBusy(true);
    setError('');
    try {
      onChange(await updateDriver(driver.user_id, { qr_on_sticker: e.target.checked }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-[#FFB300]"
          checked={!!driver.qr_on_sticker} disabled={busy} onChange={toggle} />
        <span>
          <span className="font-semibold">{t('qrvis.label')}</span>
          <span className="block text-xs text-gray-500">{t('qrvis.hint')}</span>
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-full">{error}</p>}
    </section>
  );
}