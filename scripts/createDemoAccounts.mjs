// Patakbuhin nang isang beses: node scripts/createDemoAccounts.mjs
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

try {
  const text = readFileSync('.env', 'utf8').replace(/^\uFEFF/, '');
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* walang .env */ }

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Kulang ang VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY sa .env');
  process.exit(1);
}
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const ACCOUNTS = [
  { email: 'demo.commuter@example.com', username: 'Demo Commuter', role: 'commuter' },
  { email: 'demo.driver@example.com', username: 'Demo Driver', role: 'driver', plate: 'DEMO-DRV' },
];

for (const a of ACCOUNTS) {
  const { error } = await sb.auth.admin.createUser({
    email: a.email,
    password: 'Demo12345!',
    email_confirm: true,
    user_metadata: { username: a.username, role: a.role, plate_number: a.plate },
  });
  if (error && !/already|registered|exists/i.test(error.message)) {
    console.error(`${a.email}: ${error.message}`);
    process.exit(1);
  }
  console.log(`${a.email}: OK (${a.role})`);
}