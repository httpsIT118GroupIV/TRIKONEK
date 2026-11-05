import { supabase } from './supabaseClient';

export async function getSheds() {
  const { data, error } = await supabase.from('waiting_sheds').select('*');
  if (error) throw error;
  return data;
}

export async function getOnlineDrivers() {
  const { data, error } = await supabase
    .from('drivers')
    .select('id, tricycle_plate_number, status, current_latitude, current_longitude, qr_code_url')
    .eq('is_online', true)
    .not('current_latitude', 'is', null)
    .not('current_longitude', 'is', null);
  if (error) throw error;
  return data;
}

export async function getMyWaitingSignals(commuterId) {
  const { data, error } = await supabase
    .from('commuter_signals')
    .select('id, shed_id')
    .eq('commuter_id', commuterId)
    .eq('status', 'waiting');
  if (error) throw error;
  return data;
}

export async function sendSignal(commuterId, shedId) {
  const { error } = await supabase
    .from('commuter_signals')
    .insert({ commuter_id: commuterId, shed_id: shedId, status: 'waiting' });
  if (error) throw error;
}

export async function cancelSignal(signalId) {
  const { error } = await supabase
    .from('commuter_signals')
    .update({ status: 'cancelled' })
    .eq('id', signalId);
  if (error) throw error;
}