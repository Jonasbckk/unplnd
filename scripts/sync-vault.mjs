/**
 * Sync real UNPLND numbers from Supabase into the Obsidian vault.
 *
 * Setup (once):
 *   1. Run migration supabase/migrations/0028_ops_metrics.sql in Supabase.
 *   2. Add to .env (gitignored):  OPS_EMAIL=...  OPS_PASSWORD=...  (your founder login)
 *      Optional:  VAULT_PATH=C:\Users\...\UNPLND-Vault  (defaults to Desktop/UNPLND-Vault)
 * Run:  node scripts/sync-vault.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { createClient } from '@supabase/supabase-js';

function loadEnv(file) {
  const env = {};
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return env;
}

const env = { ...loadEnv(join(process.cwd(), '.env')), ...process.env };
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anon = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const email = env.OPS_EMAIL;
const password = env.OPS_PASSWORD;
const vault = env.VAULT_PATH || join(homedir(), 'Desktop', 'UNPLND-Vault');

if (!url || !anon) {
  console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}
if (!email || !password) {
  console.error('✗ Add OPS_EMAIL and OPS_PASSWORD (your founder login) to .env — it is gitignored.');
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
if (authErr) {
  console.error('✗ Login failed:', authErr.message);
  process.exit(1);
}

const { data: m, error } = await supabase.rpc('ops_metrics');
if (error) {
  console.error('✗ ops_metrics failed:', error.message, '(is your account is_founder? did migration 0028 run?)');
  process.exit(1);
}

const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const md = `---
zuletzt_aktualisiert: ${now}
---

> ⚙️ Automatisch erzeugt von \`scripts/sync-vault.mjs\` — nicht von Hand bearbeiten (wird überschrieben).

| Kennzahl | Wert |
| --- | --- |
| Waitlist-Anmeldungen | ${m.waitlist} |
| Registrierte Nutzer | ${m.users} |
| Premium-Nutzer | ${m.premium} |
| Veröffentlichte Pläne | ${m.published_plans} |
| Erlebte Abende | ${m.evenings} |
| Verbindungen | ${m.connections} |

*Stand: ${now}*
`;

const dir = join(vault, 'Kennzahlen');
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'Live-Zahlen.md'), md, 'utf8');
console.log(`✓ Kennzahlen aktualisiert → ${join(dir, 'Live-Zahlen.md')}`);
console.log(m);
process.exit(0);
