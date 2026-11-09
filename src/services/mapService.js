import { supabase } from './supabaseClient';

export const MAX_ROAD_M = 80; // pinakamalayong puwede mula sa kalsada

export async function getSheds() {
  const { data, error } = await supabase.from('waiting_sheds').select('*');
  if (error) throw error;
  return data;
}

export async function getOnlineDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, tricycle_plate_number, status, verification_status, current_latitude, current_longitude, qr_code_url')
    .eq('is_online', true)
    .eq('verification_status', 'verified')
    .not('current_latitude', 'is', null)
    .not('current_longitude', 'is', null);
  if (error) throw error;
  return data;
}

// Aktibong signal lang (hindi pa expired)
export async function getMyWaitingSignals(commuterId) {
  const { data, error } = await supabase
    .from('commuter_signals')
    .select('id, shed_id, latitude, longitude, expires_at')
    .eq('commuter_id', commuterId)
    .eq('status', 'waiting')
    .gt('expires_at', new Date().toISOString());
  if (error) throw error;
  return data;
}

// Isa lang ang aktibong signal bawat commuter
async function cancelMine(commuterId) {
  const { error } = await supabase
    .from('commuter_signals')
    .update({ status: 'cancelled' })
    .eq('commuter_id', commuterId)
    .eq('status', 'waiting');
  if (error) throw error;
}

export async function sendSignal(commuterId, shedId) {
  await cancelMine(commuterId);
  const { error } = await supabase
    .from('commuter_signals')
    .insert({ commuter_id: commuterId, shed_id: shedId, status: 'waiting' });
  if (error) throw error;
}

export async function sendRoadsideSignal(commuterId, lat, lng) {
  await cancelMine(commuterId);
  const { error } = await supabase.from('commuter_signals').insert({
    commuter_id: commuterId,
    latitude: Number(lat.toFixed(5)),
    longitude: Number(lng.toFixed(5)),
    status: 'waiting',
  });
  if (error) throw error;
}

export async function cancelSignal(signalId) {
  const { error } = await supabase
    .from('commuter_signals')
    .update({ status: 'cancelled' })
    .eq('id', signalId);
  if (error) throw error;
}

// Sakop ba ng mapa ang lugar (malawak na tsek, ~2 km na palugit mula sa mga terminal)
export function isInsideArea(lat, lng, sheds, pad = 0.02) {
  if (!sheds.length) return true;
  const lats = sheds.map((s) => Number(s.latitude));
  const lngs = sheds.map((s) => Number(s.longitude));
  return (
    lat >= Math.min(...lats) - pad && lat <= Math.max(...lats) + pad &&
    lng >= Math.min(...lngs) - pad && lng <= Math.max(...lngs) + pad
  );
}

// Inilalapit sa pinakamalapit na kalsada (OSRM). null kung hindi maabot ang serbisyo.
export async function snapToRoad(lat, lng) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(
      `https://router.project-osrm.org/nearest/v1/driving/${lng},${lat}`,
      { signal: ctrl.signal }
    );
    clearTimeout(timer);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.waypoints?.length) return null;
    const w = data.waypoints[0];
    return { lat: w.location[1], lng: w.location[0], distance: w.distance };
  } catch {
    return null;
  }
}

// Para sa driver: mga naghihintay na aktibo pa. Sinadyang walang commuter_id para pribado.
export async function getActiveSignals() {
  const { data, error } = await supabase
    .from('commuter_signals')
    .select('id, shed_id, latitude, longitude, expires_at')
    .eq('status', 'waiting')
    .gt('expires_at', new Date().toISOString());
  if (error) throw error;
  return data;
}