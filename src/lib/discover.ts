import { i18n } from '@/lib/i18n';
import { getPlanningLocation } from '@/store/location-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface DiscoverPlace {
  id: string;
  name: string;
  type?: string;
  rating: number;
  ratingCount: number;
  priceLevel?: string;
  openNow?: boolean;
  hours?: string;
  address?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  distanceM: number;
}

export interface DiscoverResult {
  places: DiscoverPlace[];
  /** True when the user's location wasn't available — Discover needs it (no city fallback). */
  needsLocation: boolean;
}

// Short in-memory cache so switching tabs / categories doesn't re-hit Places every time.
const cache = new Map<string, { at: number; result: DiscoverResult }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Real, well-rated venues near the user for a category (21_DISCOVER).
 * The Google key stays server-side in the `discover` Edge Function; on any failure we return
 * an empty list so Discover degrades gracefully.
 */
export async function getDiscoverPlaces(category?: string, force = false, query?: string): Promise<DiscoverResult> {
  const q = query?.trim();
  const location = await getPlanningLocation();
  if (!location) return { places: [], needsLocation: true };
  // Cache key includes the location so switching to another city never shows stale results.
  const key = `${q ? 'q:' + q.toLowerCase() : (category ?? 'all')}@${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}`;
  const cached = cache.get(key);
  if (!force && cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.result;
  if (!isSupabaseConfigured) return { places: [], needsLocation: false };

  try {
    const { data, error } = await supabase.functions.invoke<{ places?: DiscoverPlace[] }>('discover', {
      body: {
        latitude: location.latitude,
        longitude: location.longitude,
        category: q ? undefined : category,
        query: q || undefined,
        language: i18n.locale,
      },
    });
    if (error || !data?.places) return { places: [], needsLocation: false };
    const result: DiscoverResult = { places: data.places, needsLocation: false };
    // Only cache real results — never cache an empty/needs-location state (so retry works).
    if (result.places.length > 0) cache.set(key, { at: Date.now(), result });
    return result;
  } catch {
    return { places: [], needsLocation: false };
  }
}
