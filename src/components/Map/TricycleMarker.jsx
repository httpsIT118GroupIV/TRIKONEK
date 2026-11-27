import { Marker } from 'react-leaflet';
import { tricycleIcon } from './icons';

export default function TricycleMarker({ driver, onSelect, dim = false }) {
  if (driver.current_latitude == null || driver.current_longitude == null) return null;
  const available = driver.status === 'available';
  return (
    <Marker
      position={[driver.current_latitude, driver.current_longitude]}
      icon={tricycleIcon(available, dim)}
      zIndexOffset={dim ? 0 : 500}
      eventHandlers={{ click: () => onSelect?.(driver.id) }}
    />
  );
}