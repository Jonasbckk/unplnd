import type * as ImagePicker from 'expo-image-picker';

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
  /** The highlight's own name, or the album's title when it hasn't been renamed. */
  title: string;
  city: string;
  date: string;
  mood: string;
  coverColor: string;
  /** Signed URL of the chosen cover, or the first photo when none was picked. */
  cover: string;
  /** Signed URLs of the evening's photos — the story itself. */
  photos: string[];
}

interface HighlightRow {
  album_id: string;
  title: string | null;
  city: string | null;
  taken_at: string | null;
  mood: string | null;
  cover_color: string | null;
  cover_path: string | null;
  photos: string[] | null;
}

/** Someone's highlighted evenings (works for your own id too). Empty if they share none. */
export async function getProfileHighlights(userId: string): Promise<Highlight[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('get_profile_highlights', { target: userId });
  if (error || !Array.isArray(data)) return [];

  const rows = data as HighlightRow[];
  // Sign every path (photos + covers) in ONE round trip; the per-row calls below then hit the cache.
  await signedPhotoUrls(rows.flatMap((row) => [...(row.photos ?? []), ...(row.cover_path ? [row.cover_path] : [])]));
  const resolved = await Promise.all(rows.map((row) => signedPhotoUrls(row.photos ?? [])));
  const covers = await Promise.all(rows.map((row) => (row.cover_path ? signedPhotoUrls([row.cover_path]) : [])));

  return rows
    .map((row, i) => ({
      albumId: row.album_id,
      title: row.title ?? '',
      city: row.city ?? '',
      date: row.taken_at ?? '',
      mood: row.mood ?? '',
      coverColor: row.cover_color ?? '#C97B63',
      cover: covers[i][0] ?? resolved[i][0] ?? '',
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

/** Rename a highlight and/or set its cover. An empty title falls back to the album's own. */
export async function updateHighlight(
  albumId: string,
  patch: { title?: string; coverPath?: string },
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const row: Record<string, string | null> = {};
  if (patch.title !== undefined) row.title = patch.title.trim() || null;
  if (patch.coverPath !== undefined) row.cover_path = patch.coverPath || null;
  if (Object.keys(row).length === 0) return true;
  const { error } = await supabase.from('album_highlights').update(row).eq('album_id', albumId);
  return !error;
}

/**
 * Upload a chosen cover into the album's OWN folder ({uid}/{albumId}/cover-*), so the storage rule
 * from 0034 governs it too: visible to others exactly while the album is highlighted. Returns the
 * storage path, or null if the upload failed.
 */
export async function uploadHighlightCover(
  albumId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string | null> {
  const uid = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !uid) return null;
  try {
    const response = await fetch(asset.uri);
    const body = await response.arrayBuffer();
    const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
    const path = `${uid}/${albumId}/cover-${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from('photos')
      .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg' });
    return error ? null : path;
  } catch {
    return null;
  }
}
