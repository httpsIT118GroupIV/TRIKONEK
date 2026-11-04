import { useState } from 'react';

export default function QrUpload({ qrUrl, onUpload, disabled }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  function handlePick(e) {
    const f = e.target.files[0];
    setError('');
    if (!f) return;
    if (!f.type.startsWith('image/')) return setError('Larawan lang ang puwede.');
    if (f.size > 2 * 1024 * 1024) return setError('Dapat mas maliit sa 2MB.');
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
    <section style={card}>
      <h3 style={{ marginTop: 0 }}>GCash / E-wallet QR</h3>
      {qrUrl ? (
        <img src={qrUrl} alt="Kasalukuyang QR" style={{ width: '100%', maxWidth: 240, display: 'block', marginBottom: 12 }} />
      ) : (
        <p style={{ color: '#777' }}>Wala pang QR. Cash lang ang makikita ng pasahero.</p>
      )}
      <input type="file" accept="image/*" onChange={handlePick} />
      {preview && (
        <img src={preview} alt="Preview" style={{ width: '100%', maxWidth: 240, display: 'block', margin: '12px 0' }} />
      )}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      <button
        onClick={handleUpload}
        disabled={!file || disabled}
        style={{ ...btn, background: file ? '#0a66c2' : '#aaa', marginTop: 12 }}
      >
        Upload QR
      </button>
    </section>
  );
}

const card = { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 };
const btn = { width: '100%', padding: 14, fontSize: 16, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };