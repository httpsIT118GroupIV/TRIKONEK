export default function StatusToggle({ status, onChange, disabled }) {
  const isAvailable = status === 'available';
  return (
    <section style={card}>
      <h3 style={{ marginTop: 0 }}>Seat status</h3>
      <p>
        Ngayon:{' '}
        <strong style={{ color: isAvailable ? 'green' : 'crimson' }}>
          {isAvailable ? 'AVAILABLE (may upuan)' : 'FULL (puno na)'}
        </strong>
      </p>
      <button
        onClick={() => onChange(isAvailable ? 'full' : 'available')}
        disabled={disabled}
        style={{ ...btn, background: isAvailable ? 'crimson' : 'green' }}
      >
        {isAvailable ? 'Mark as FULL' : 'Mark as AVAILABLE'}
      </button>
    </section>
  );
}

const card = { border: '1px solid #ddd', borderRadius: 8, padding: 16, marginBottom: 16 };
const btn = { width: '100%', padding: 14, fontSize: 16, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' };