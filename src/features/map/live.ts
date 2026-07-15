import { useAuthStore } from '@/features/auth/auth-store';
import { getCurrentLocation } from '@/lib/location';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Live location for connections (Memory Map phase 2) — Snap-Map-like, but privacy-first:
 * opt-in (default OFF), coordinates rounded to ~1 km BEFORE upload, one overwritten row (no
 * movement history), visible only to accepted connections and only while fresh. Updates happen in
 * the FOREGROUND only — deliberately no background location, so there's no always-on tracking (and
 * no background-location entitlement in the App Review).
 */

export interface LiveConnection {
  userId: string;
  name: string;
  lat: number;
  lng: number;
  city: string;
  /** Minutes since their last update (0 = just now). */
  minutesAgo: number;
}

/** ~1 km grid — the "reduced precision" rule: enough to see who's around, never the exact address. */
export function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Fresh = updated within the last hour; anything older silently drops off the map. */
export function isFresh(updatedAt: string, now: Date): boolean {
  const t = new Date(updatedAt).getTime();
  return Number.isFinite(t) && now.getTime() - t < 60 * 60 * 1000;
}

export function minutesSince(updatedAt: string, now: Date): number {
  const t = new Date(updatedAt).getTime();
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, Math.round((now.getTime() - t) / 60000));
}

/** Push the current (rounded) position. No-op when logged out or location is unavailable. */
export async function publishLiveLocation(): Promise<boolean> {
  const uid = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !uid) return false;
  const loc = await getCurrentLocation();
  if (!loc) return false;
  const { error } = await supabase.from('live_locations').upsert({
    user_id: uid,
    lat: roundCoord(loc.latitude),
    lng: roundCoord(loc.longitude),
    city: loc.city ?? null,
    updated_at: new Date().toISOString(),
  });
  return !error;
}

/** Leaving the map is immediate: the row is deleted, not just left to expire. */
export async function clearLiveLocation(): Promise<void> {
  const uid = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !uid) return;
  await supabase.from('live_locations').delete().eq('user_id', uid);
}

/** Connections currently sharing (fresh only, RLS + RPC enforce the connection check server-side). */
export async function getLiveConnections(): Promise<LiveConnection[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_live_connections');
  if (error || !Array.isArray(data)) return [];
  const now = new Date();
  return (data as {
    user_id: string;
    lat: number;
    lng: number;
    city: string | null;
    updated_at: string;
    display_name: string | null;
  }[])
    .filter((row) => isFresh(row.updated_at, now))
    .map((row) => ({
      userId: row.user_id,
      name: row.display_name ?? '',
      lat: row.lat,
      lng: row.lng,
      city: row.city ?? '',
      minutesAgo: minutesSince(row.updated_at, now),
    }));
}
