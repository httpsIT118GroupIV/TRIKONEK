import { useState } from 'react';

export default function PaymentSelector({ driver, onClose }) {
  const [mode, setMode] = useState(null); // 'cash' | 'qr'

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Paraan ng bayad</h3>
          <button onClick={onClose}>✕</button>
        </div>

        {!driver ? (
          <p style={{ color: 'crimson' }}>
            Offline na ang driver na ito, kaya hindi na maipapakita ang detalye.
          </p>
        ) : (
          <>
            <p style={{ margin: '8px 0' }}>
              Tricycle <strong>{driver.tricycle_plate_number}</strong>
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setMode('cash')}
                style={{ ...btn, background: mode === 'cash' ? '#16a34a' : '#555' }}
              >
                💵 Cash
              </button>
              <button
                onClick={() => setMode('qr')}
                style={{ ...btn, background: mode === 'qr' ? '#0a66c2' : '#555' }}
              >
                📱 E-wallet (QR)
              </button>
            </div>

            {mode === 'cash' && (
              <p>Magbayad nang cash sa driver pagdating sa destinasyon. Ihanda ang barya.</p>
            )}

            {mode === 'qr' &&
              (driver.qr_code_url ? (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={driver.qr_code_url}
                    alt="QR code ng driver"
                    style={{ width: '100%', maxWidth: 280 }}
                  />
                  <p style={{ fontSize: 13, color: '#555' }}>
                    I-scan gamit ang GCash o ibang e-wallet. Ipakita sa driver ang resibo
                    pagkatapos magbayad.
                  </p>
                </div>
              ) : (
                <p style={{ color: '#b45309' }}>
                  Wala pang QR ang driver na ito. Cash na lang muna.
                </p>
              ))}

            {!mode && <p style={{ color: '#777' }}>Pumili ng paraan ng bayad sa itaas.</p>}
          </>
        )}
      </div>
    </div>
  );
}

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 2000,
};
const sheet = {
  background: '#fff', width: '100%', maxWidth: 420, maxHeight: '85vh',
  overflowY: 'auto', padding: 16, borderRadius: '12px 12px 0 0',
};
const btn = {
  flex: 1, padding: 12, fontSize: 15, color: '#fff',
  border: 'none', borderRadius: 8, cursor: 'pointer',
};