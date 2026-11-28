import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';

export default function QrUpload({ qrUrl, onUpload, disabled }) {
  const { t } = useLang();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function handlePick(e) {
    const f = e.target.files[0];
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError(t('qr.errType'));
    if (f.size > 2 * 1024 * 1024) return setError(t('qr.errSize'));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      await onUpload(file);
      setFile(null);
      setPreview('');
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  const shown = preview || qrUrl;

  return (
    <div>
      <p className="ios-head">{t('qr.title')}</p>
      <div className="ios-group">
        {shown ? (
          <div className="flex justify-center px-4 py-4">
            <img
              src={shown}
              alt="QR"
              className={'w-full max-w-[220px] rounded-xl p-2 ' + (preview ? 'border-2 border-dashed border-brand-dark' : 'border border-gray-200')}
            />
          </div>
        ) : (
          <div className="ios-row text-gray-500">{t('qr.none')}</div>
        )}

        <label className="ios-row cursor-pointer font-semibold">
          <span>{shown ? t('qr.change') : t('qr.choose')}</span>
          <span className="text-gray-400">›</span>
          <input type="file" accept="image/*" onChange={handlePick} className="hidden" />
        </label>
      </div>

      {error && <p className="mt-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{error}</p>}

      {file && (
        <button onClick={handleUpload} disabled={disabled || busy} className="btn-primary mt-3">
          {busy ? '…' : t('qr.upload')}
        </button>
      )}
    </div>
  );
}