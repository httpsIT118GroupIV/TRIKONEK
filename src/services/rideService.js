import { supabase } from './supabaseClient';

async function rpc(fn, args = {}) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

const tripArgs = (lat, lng, destId, passengers, discounted) => ({
  p_lat: lat, p_lng: lng, p_dest: destId, p_passengers: passengers, p_discounted: discounted,
});

export const estimateTrip = (...a) => rpc('compute_trip', tripArgs(...a));
export const createRequest = (...a) => rpc('create_ride_request', tripArgs(...a));
export const getMyRequest = () => rpc('my_ride_request');
export const cancelRequest = (id) => rpc('cancel_ride_request', { p_id: id });

export const driverOpenRequests = () => rpc('driver_open_requests');
export const driverActiveRequest = () => rpc('driver_active_request');
export const acceptRequest = (id) => rpc('accept_ride_request', { p_id: id });
export const releaseRequest = (id) => rpc('driver_release_request', { p_id: id });
export const completeRequest = (id) => rpc('driver_complete_request', { p_id: id });

const CODES = [
  'active_request_exists', 'outside_area', 'no_fare', 'bad_passengers', 'bad_discounted',
  'bad_destination', 'not_commuter', 'request_unavailable', 'seat_full', 'not_eligible',
  'already_has_request', 'no_terminals',
];

// Ginagawang translation key ang code na galing sa database
export function rideErrorKey(message = '') {
  const c = CODES.find((x) => message.includes(x));
  return c ? `req.err.${c}` : null;
}