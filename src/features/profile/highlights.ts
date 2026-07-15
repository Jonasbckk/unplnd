import { signedPhotoUrls } from '@/features/albums/photos';
import { useAuthStore } from '@/features/auth/auth-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * A highlighted evening — one album the owner explicitly chose to show on their profile
 * (27_SOCIAL_VISION: "Recent Albums (if shared)"). Highlighting IS the act of sharing; albums are
 * private by default and removing the highlight makes them private again immediately.
 *
 * Note there is no timeline, address or coordinates here on purpose: a shared evening is only ever
 * as precise as its city (Memory Album Spec: "Location precision reduced when shared publicly").
 */
export interface Highlight {
  albumId: string;
  title: string;
  city: string;
  date: string;
  mood: string;
  coverColor: string;
  /** Signed URLs, already resolved. The first one is the cover. */
  photos: string[];
}

interface HighlightRow {
  album_id: string;
  title: string | null;
  city: string | null;
  taken_at: string | null;
  mood: string | null;
  cover_color: string | null;
  photos: string[] | null;
}

/** Someone's highlighted evenings (works for your own id too). Empty if they share none. */
export async function getProfileHighlights(userId: string): Promise<Highlight[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_profile_highlights', { target: userId });
  if (error || !Array.isArray(data)) return [];

  const rows = data as HighlightRow[];
  // Resolve every highlight's photos in one go — the cache dedupes across highlights.
  const resolved = await Promise.all(rows.map((row) => signedPhotoUrls(row.photos ?? [])));

  return rows
    .map((row, i) => ({
      albumId: row.album_id,
      title: row.title ?? '',
      city: row.city ?? '',
      date: row.taken_at ?? '',
      mood: row.mood ?? '',
      coverColor: row.cover_color ?? '#C97B63',
      photos: resolved[i],
    }))
    // A highlight with no readable photo has nothing to show.
    .filter((h) => h.photos.length > 0);
}

/** Album ids you currently share — for ticking the picker. */
export async function getHighlightedAlbumIds(): Promise<Set<string>> {
  const uid = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !uid) return new Set();
  const { data, error } = await supabase.from('album_highlights').select('album_id').eq('owner_id', uid);
  if (error || !data) return new Set();
  return new Set(data.map((r) => r.album_id as string));
}

/** Share this evening on your profile. */
export async function addHighlight(albumId: string, sortOrder: number): Promise<boolean> {
  const uid = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !uid) return false;
  const { error } = await supabase
    .from('album_highlights')
    .insert({ album_id: albumId, owner_id: uid, sort_order: sortOrder });
  return !error;
}

/** Stop sharing it — the album (and its photos) go private again straight away. */
export async function removeHighlight(albumId: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { error } = await supabase.from('album_highlights').delete().eq('album_id', albumId);
  return !error;
}
