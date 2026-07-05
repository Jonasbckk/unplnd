import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

/** Record that the user opened the app today (updates their daily-use streak). No-op if signed out. */
export async function recordActivity(): Promise<void> {
  if (!useAuthStore.getState().session) return;
  try {
    await supabase.rpc('record_activity');
  } catch {
    // Streak is best-effort — never block the app or surface an error over it.
  }
}
