import { CircleMarker, Popup } from 'react-leaflet';

export default function ShedMarker({ shed, waiting, busy, onSignal, onCancel }) {
  return (
    <CircleMarker
      center={[shed.latitude, shed.longitude]}
      radius={9}
      pathOptions={{
        color: '#fff',
        weight: 3,
        fillColor: waiting ? '#f59e0b' : '#2563eb',
        fillOpacity: 1,
      }}
    >
      <Popup>
        <strong>{shed.shed_name}</strong>
        <br />
        <small>{shed.route_zone}</small>
        <br />
        {waiting ? (
          <button disabled={busy} onClick={onCancel} style={{ marginTop: 8 }}>
            Cancel signal
          </button>
        ) : (
          <button disabled={busy} onClick={onSignal} style={{ marginTop: 8 }}>
            May naghihintay dito
          </button>
        )}
      </Popup>
    </CircleMarker>
  );
}
