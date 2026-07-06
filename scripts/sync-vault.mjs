/**
 * Sync real UNPLND numbers from Supabase into the Obsidian vault. No credentials needed —
 * reads the app's anon key from .env and calls the public ops_metrics() function.
 *
 * Setup (once): run migration supabase/migrations/0029_ops_metrics_public.sql in Supabase.
 * Run:  double-click scripts/sync-vault.bat  (or: node scripts/sync-vault.mjs)
 * Optional: set VAULT_PATH in .env if the vault is not at Desktop/UNPLND-Vault.
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
const vault = env.VAULT_PATH || join(homedir(), 'Desktop', 'UNPLND-Vault');

if (!url || !anon) {
  console.error('✗ Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, anon, { auth: { persistSession: false } });

const { data: m, error } = await supabase.rpc('ops_metrics');
if (error) {
  console.error('✗ ops_metrics failed:', error.message, '(did migration 0029 run?)');
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
