/**
 * Early-access signups → Supabase REST (same project as the app).
 * The anon key is public by design; RLS only allows INSERT into waitlist.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export type WaitlistResult = 'ok' | 'duplicate';

export async function joinWaitlist(name: string, email: string): Promise<WaitlistResult> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('waitlist-not-configured');

  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      source: 'website',
    }),
  });

  if (res.status === 201) return 'ok';
  if (res.status === 409) return 'duplicate'; // unique index on lower(email)
  throw new Error(`waitlist-failed-${res.status}`);
}

/**
 * Signup count via the security-definer RPC (migration 0016) — the table
 * itself stays unreadable. Returns null when unavailable so the progress
 * bar can hide instead of showing made-up numbers.
 */
export async function fetchWaitlistCount(): Promise<number | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/waitlist_count`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
    if (!res.ok) return null;
    const n = await res.json();
    return typeof n === 'number' ? n : null;
  } catch {
    return null;
  }
}
