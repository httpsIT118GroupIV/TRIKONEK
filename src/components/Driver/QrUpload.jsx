import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';

export default function QrUpload({ qrUrl, onUpload, disabled }) {
  const { t } = useLang();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [errorKey, setErrorKey] = useState('');

  function handlePick(e) {
    const f = e.target.files[0];
    setErrorKey('');
    if (!f) return;
    if (!f.type.startsWith('image/')) return setErrorKey('qr.errType');
    if (f.size > 2 * 1024 * 1024) return setErrorKey('qr.errSize');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleUpload() {
    if (!file) return;
    await onUpload(file);
    setFile(null);
    setPreview('');
  }

  return (
    <section className="card">
      <div className="flex items-center gap-2">
        <span className="text-xl">💳</span>
        <h3 className="text-base font-extrabold">{t('qr.title')}</h3>
      </div>

      {qrUrl ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{t('qr.current')}</p>
          <img
            src={qrUrl}
            alt={t('qr.current')}
            className="mx-auto w-full max-w-[220px] rounded-xl border border-gray-200 p-2"
          />
        </div>
      ) : (
        <p className="mt-2 rounded-xl bg-brand-soft px-4 py-3 text-sm text-gray-600">{t('qr.none')}</p>
      )}

      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="mx-auto mt-4 w-full max-w-[220px] rounded-xl border-2 border-dashed border-brand-dark p-2"
        />
      )}

      <label className="btn-ghost mt-4 flex cursor-pointer items-center justify-center">
        {qrUrl || file ? t('qr.change') : t('qr.choose')}
        <input type="file" accept="image/*" onChange={handlePick} className="hidden" />
      </label>

      {errorKey && (
        <p className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">{t(errorKey)}</p>
      )}

      <button onClick={handleUpload} disabled={!file || disabled} className="btn-primary mt-3">
        {t('qr.upload')}
      </button>
    </section>
  );
}