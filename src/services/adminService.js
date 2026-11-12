import { supabase } from './supabaseClient';

export async function listDrivers() {
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('id, user_id, tricycle_plate_number, toda_name, franchise_number, line, verification_status, is_online');
  if (error) throw error;

  const ids = drivers.map((d) => d.user_id);
  let users = [];
  if (ids.length) {
    const { data, error: e2 } = await supabase
      .from('users')
      .select('id, username, email, full_name, phone, created_at')
      .in('id', ids);
    if (e2) throw e2;
    users = data;
  }
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  return drivers
    .map((d) => ({ ...d, user: byId[d.user_id] ?? null }))
    .sort((a, b) => new Date(b.user?.created_at ?? 0) - new Date(a.user?.created_at ?? 0));
}

export async function setVerification(driverId, status, line) {
  const patch = { verification_status: status };
  if (line !== undefined) patch.line = line;
  const { error } = await supabase.from('drivers').update(patch).eq('id', driverId);
  if (error) throw error;
}

export async function setLine(driverId, line) {
  const { error } = await supabase.from('drivers').update({ line }).eq('id', driverId);
  if (error) throw error;
}
export async function listFares() {
  const { data, error } = await supabase.from('fares').select('id, shed_a, shed_b, regular');
  if (error) throw error;
  return data;
}

// Ang umiiral na row ay ina-update ayon sa id, at hindi nababago ang pagkakaayos ng shed_a at shed_b
export async function saveFares({ updates, inserts }) {
  if (updates.length) {
    const { error } = await supabase.from('fares').upsert(updates);
    if (error) throw error;
  }
  if (inserts.length) {
    const { error } = await supabase.from('fares').insert(inserts);
    if (error) throw error;
  }
}

export async function getSettings() {
  const { data, error } = await supabase.from('app_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries(data.map((r) => [r.key, r.value]));
}

export async function saveSettings(obj) {
  const rows = Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
  const { error } = await supabase.from('app_settings').upsert(rows, { onConflict: 'key' });
  if (error) throw error;
}