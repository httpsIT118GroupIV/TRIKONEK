import { supabase } from './supabaseClient';

export async function getMyDriver(userId) {
  const { data, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateDriver(userId, fields) {
  const { data, error } = await supabase
    .from('drivers')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function uploadQr(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const path = `${userId}/qr.${ext}`;
  const { error } = await supabase.storage
    .from('qr-codes')
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('qr-codes').getPublicUrl(path);
  // ?v= para hindi ma-cache ang lumang larawan kapag nag-upload ulit
  return updateDriver(userId, { qr_code_url: `${data.publicUrl}?v=${Date.now()}` });
}