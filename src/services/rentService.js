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

export const rentQuote = (lat, lng, dlat, dlng) =>
  rpc('rent_quote', { p_lat: lat, p_lng: lng, p_dlat: dlat, p_dlng: dlng });
export const fareTable = (originId) => rpc('fare_table', { p_origin: originId });
export const adminRentals = () => rpc('admin_rentals');
export const adminCancelRental = (id) => rpc('admin_cancel_rental', { p_id: id });

// Group chat
export const chatMessages = (rentalId) => rpc('group_messages', { p_rental: rentalId });
export const chatSend = (rentalId, body) => rpc('group_send', { p_rental: rentalId, p_body: body });
export const chatSummary = () => rpc('group_summary');

export const seenKey = (rentalId) => `chatseen:${rentalId}`;

// Set ng rental id na may bagong mensahe mula sa iba na hindi pa nababasa
export function unreadKeys(summary = []) {
  const out = new Set();
  for (const s of summary) {
    if (s.last_mine) continue;
    let seen = 0;
    try { seen = Date.parse(localStorage.getItem(seenKey(s.rental_id)) || '') || 0; } catch { /* ignore */ }
    if (Date.parse(s.last_at) > seen) out.add(s.rental_id);
  }
  return out;
}

const CODES = [
  'too_soon', 'bad_count', 'bad_phone', 'bad_destination', 'too_many', 'not_commuter',
  'not_eligible', 'rental_unavailable', 'rental_full', 'cannot_withdraw',
];

export function rentErrorKey(message = '') {
  const c = CODES.find((x) => message.includes(x));
  return c ? `rent.err.${c}` : null;
}

const CHAT_CODES = ['chat_denied', 'chat_closed'];
export function chatErrorKey(message = '') {
  const c = CHAT_CODES.find((x) => message.includes(x));
  return c ? `chat.err.${c}` : null;
}