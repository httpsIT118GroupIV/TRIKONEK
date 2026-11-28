import { supabase } from './supabaseClient';

async function rpc(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

export const rentRate = () => rpc('rent_rate');
export const myRentals = () => rpc('my_rentals');
export const cancelRental = (id) => rpc('cancel_rental', { p_id: id });
export const createRental = (a) =>
  rpc('create_rental', {
    p_event_at: a.eventAt, p_lat: a.lat, p_lng: a.lng,
    p_pickup_note: a.pickupNote, p_dest: a.dest, p_count: a.count, p_phone: a.phone,
    p_dest_lat: a.destLat ?? null, p_dest_lng: a.destLng ?? null,
  });

export const driverOpenRentals = () => rpc('driver_open_rentals');
export const driverMyRentals = () => rpc('driver_my_rentals');
export const acceptRental = (id) => rpc('accept_rental', { p_id: id });
export const withdrawRental = (id) => rpc('withdraw_rental', { p_id: id });

const CODES = [
  'too_soon', 'bad_count', 'bad_phone', 'bad_destination', 'too_many', 'not_commuter',
  'not_eligible', 'rental_unavailable', 'rental_full', 'cannot_withdraw',
];

export function rentErrorKey(message = '') {
  const c = CODES.find((x) => message.includes(x));
  return c ? `rent.err.${c}` : null;
}

export const rentQuote = (lat, lng, dlat, dlng) =>
  rpc('rent_quote', { p_lat: lat, p_lng: lng, p_dlat: dlat, p_dlng: dlng });
export const fareTable = (originId) => rpc('fare_table', { p_origin: originId });
export const adminRentals = () => rpc('admin_rentals');
export const adminCancelRental = (id) => rpc('admin_cancel_rental', { p_id: id });