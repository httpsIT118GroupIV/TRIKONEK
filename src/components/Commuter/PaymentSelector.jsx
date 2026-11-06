import { useState } from 'react';
import { useLang } from '../../context/LanguageContext';

export default function PaymentSelector({ driver, onClose }) {
  const { t } = useLang();
  const [mode, setMode] = useState(null); // 'cash' | 'qr'

  const options = [
    { value: 'cash', icon: '💵', label: t('pay.cash'), desc: t('pay.cashDesc') },
    { value: 'qr', icon: '📱', label: t('pay.qr'), desc: t('pay.qrDesc') },
  ];

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-[2rem] bg-white px-5 pb-8 pt-3 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />

        <div className="flex items-center justify-between">
          <h3 className="text-xl font-extrabold">{t('pay.title')}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-lg"
          >
            ✕
          </button>
        </div>

        {!driver ? (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-full">
            {t('pay.offline')}
          </p>
        ) : (
          <>
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2">
              <span>🛺</span>
              <span className="font-extrabold tracking-widest">{driver.tricycle_plate_number}</span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {options.map((o) => {
                const active = mode === o.value;
                return (
                  <button
                    key={o.value}
                    onClick={() => setMode(o.value)}
                    className={`rounded-2xl border-2 p-3 text-left transition ${
                      active ? 'border-brand-dark bg-brand-soft' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl">{o.icon}</div>
                    <div className="mt-1 font-bold">{o.label}</div>
                    <div className="text-xs text-gray-500">{o.desc}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              {mode === 'cash' && (
                <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-gray-700">{t('pay.cashInfo')}</p>
              )}

              {mode === 'qr' &&
                (driver.qr_code_url ? (
                  <div className="text-center">
                    <img
                      src={driver.qr_code_url}
                      alt="Driver QR code"
                      className="mx-auto w-full max-w-[260px] rounded-2xl border border-gray-200 p-3"
                    />
                    <p className="mt-3 text-sm text-gray-600">{t('pay.qrInfo')}</p>
                  </div>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                    {t('pay.noQr')}
                  </p>
                ))}

              {!mode && <p className="text-center text-sm text-gray-400">{t('pay.choose')}</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}