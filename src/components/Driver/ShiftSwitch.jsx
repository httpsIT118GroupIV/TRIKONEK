export default function ShiftSwitch({ isOnline, onChange, disabled }) {
  return (
    <section style={card}>
      <h3 style={{ marginTop: 0 }}>Shift visibility</h3>
      <p>
        Ngayon:{' '}
        <strong style={{ color: isOnline ? 'green' : 'gray' }}>
          {isOnline ? 'ONLINE (nakikita sa mapa)' : 'OFFLINE (nakatago)'}
        </strong>
      </p>
      <button
        onClick={() => onChange(!isOnline)}
        disabled={disabled}
        style={{ ...btn, background: isOnline ? 'gray' : '#0a66c2' }}
      >
        {isOnline ? 'Go Offline' : 'Go Online'}
      </button>
    </section>
  );
}

const card = { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 };
const btn = { width: '100%', padding: 14, fontSize: 16, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };