import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useLang } from '../context/LanguageContext';
import { getTricycleInfo } from '../services/stickerService';
import { BASE_URL } from '../utils/baseUrl';

export default function Sticker() {
  const { plate } = useParams();
  const nav = useNavigate();
  const { t } = useLang();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getTricycleInfo(plate).then(setInfo).catch(() => setInfo({ status: 'error' }));
  }, [plate]);

  const url = `${BASE_URL}/t/${encodeURIComponent(plate)}`;

  return (
    <div className="min-h-screen bg-brand-soft pb-10 print:bg-white">
      <header className="flex items-center justify-between bg-brand px-4 py-3 print:hidden">
        <button onClick={() => nav(-1)} aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white">←</button>
        <h1 className="text-lg font-extrabold">{t('sticker.title')}</h1>
        <button onClick={() => window.print()} disabled={info?.status !== 'verified'}
          className="h-9 rounded-full bg-ink px-4 text-sm font-bold text-white disabled:opacity-40">
          🖨️ {t('sticker.print')}
        </button>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-6">
        {!info && <p className="text-center text-gray-500">…</p>}

        {info && info.status !== 'verified' && (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-accent">{t('sticker.notVerified')}</p>
        )}

        {info?.status === 'verified' && (
          <>
            <div className="mx-auto w-[9cm] rounded-2xl border-4 border-brand bg-white p-4 text-center">
              <p className="text-xl font-extrabold">🛺 TrikoNek</p>
              <p className="mt-1 inline-block rounded-full bg-emerald-50 px-3 py-0.5 text-sm font-extrabold text-available">
                ✓ {t('sticker.registered')}
              </p>
              <div className="mx-auto mt-3 inline-block bg-white p-2">
                <QRCodeSVG value={url} size={200} level="M" />
              </div>
              <p className="mt-2 text-3xl font-extrabold tracking-wider">{info.plate}</p>
              {info.toda && <p className="text-sm font-semibold text-gray-600">{info.toda}</p>}
              <p className="mt-2 text-xs text-gray-600">{t('sticker.scan')}</p>
              <p className="mt-1 break-all text-[10px] text-gray-400">{url}</p>
            </div>
            <p className="text-center text-xs text-gray-500 print:hidden">{t('sticker.tip')}</p>
          </>
        )}
      </main>
    </div>
  );
}