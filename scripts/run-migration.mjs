/**
 * Applies a SQL migration to the Supabase Postgres database.
 * Credentials are passed via env vars (never committed):
 *   SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 * Usage: node scripts/run-migration.mjs <path-to.sql>
 */
import fs from 'node:fs';
import postgres from 'postgres';

const host = process.env.SUPABASE_DB_HOST;
const port = Number(process.env.SUPABASE_DB_PORT ?? '5432');
const username = process.env.SUPABASE_DB_USER ?? 'postgres';
const password = process.env.SUPABASE_DB_PASSWORD;
const file = process.argv[2];

if (!host || !password || !file) {
  console.error('Missing SUPABASE_DB_HOST / SUPABASE_DB_PASSWORD / file argument.');
  process.exit(1);
}

const sql = postgres({ host, port, database: 'postgres', username, password, ssl: 'require', connect_timeout: 20 });

try {
  const content = fs.readFileSync(file, 'utf8');
  await sql.unsafe(content);
  console.log('MIGRATION_OK');
} catch (error) {
  console.error('MIGRATION_ERR:', error.message);
  process.exitCode = 2;
} finally {
  await sql.end({ timeout: 5 });
}
