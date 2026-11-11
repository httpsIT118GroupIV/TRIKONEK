// Ginagawang translation key ang mga teknikal na mensahe ng Supabase
export function authErrorKey(message = '') {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'auth.err.invalid';
  if (m.includes('email not confirmed')) return 'auth.err.unconfirmed';
  if (m.includes('already registered') || m.includes('already been registered')) return 'auth.err.exists';
  if (m.includes('rate limit')) return 'auth.err.rate';
  if (m.includes('password')) return 'auth.err.password';
  if (m.includes('database error')) return 'auth.err.db';
  if (m.includes('failed to fetch') || m.includes('network')) return 'auth.err.network';
  return null;
}