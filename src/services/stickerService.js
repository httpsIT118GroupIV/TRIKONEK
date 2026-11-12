import { supabase } from './supabaseClient';

async function rpc(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

export const getTricycleInfo = (plate) => rpc('public_tricycle_info', { p_plate: plate });

export const recordTrip = (plate, originId, destId, passengers, discounted, method) =>
  rpc('record_sticker_trip', {
    p_plate: plate, p_origin: originId, p_dest: destId,
    p_passengers: passengers, p_discounted: discounted, p_method: method,
  });

export const myTripsToday = () => rpc('my_trips_today');

export function stickerErrorKey(message = '') {
  if (message.includes('not_verified')) return 'scan.err.notVerified';
  if (message.includes('bad_method')) return 'scan.err.method';
  return null;
}