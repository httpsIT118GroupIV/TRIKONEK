import { CircleMarker, Popup } from 'react-leaflet';

export default function TricycleMarker({ driver, onPay }) {
  const available = driver.status === 'available';
  const color = available ? '#16a34a' : '#dc2626';
  return (
    <CircleMarker
      center={[driver.current_latitude, driver.current_longitude]}
      radius={11}
      pathOptions={{ color: '#fff', weight: 3, fillColor: color, fillOpacity: 1 }}
    >
      <Popup>
        <strong>Tricycle {driver.tricycle_plate_number}</strong>
        <br />
        <span style={{ color }}>{available ? 'Available (may upuan)' : 'Full (puno na)'}</span>
        <br />
        <button onClick={() => onPay(driver.id)} style={{ marginTop: 8 }}>
          Bayad
        </button>
      </Popup>
    </CircleMarker>
  );
}