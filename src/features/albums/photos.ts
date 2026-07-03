import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

export interface AlbumPhoto {
  id: string;
  /** Short-lived signed URL — the bucket is private (Memory Album Spec: photos never public). */
  url: string;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Users choose which photos to include — never auto-upload (Memory Album Spec). */
export async function pickPhotos(): Promise<ImagePicker.ImagePickerAsset[]> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 10,
    quality: 0.8,
  });
  return result.canceled ? [] : result.assets;
}

/** Uploads picked photos to the private bucket and records them in album_photos. Returns the new photo count. */
export async function uploadAlbumPhotos(
  albumId: string,
  assets: ImagePicker.ImagePickerAsset[],
  currentCount: number,
): Promise<number> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || assets.length === 0) return currentCount;

  let uploaded = 0;
  for (const [index, asset] of assets.entries()) {
    try {
      const response = await fetch(asset.uri);
      const body = await response.arrayBuffer();
      const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
      const path = `${userId}/${albumId}/${Date.now()}-${index}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg' });
      if (uploadError) continue;

      const { error: rowError } = await supabase
        .from('album_photos')
        .insert({ album_id: albumId, storage_path: path, sort_order: currentCount + uploaded });
      if (rowError) continue;

      uploaded += 1;
    } catch {
      // skip this asset; the rest still upload — never lose the user's action silently en masse
    }
  }

  const newCount = currentCount + uploaded;
  if (uploaded > 0) {
    await supabase.from('albums').update({ photo_count: newCount }).eq('id', albumId);
  }
  return newCount;
}

/** Loads an album's photos as signed URLs (owner-only via RLS + private bucket). */
export async function getAlbumPhotos(albumId: string): Promise<AlbumPhoto[]> {
  const { data, error } = await supabase
    .from('album_photos')
    .select('id, storage_path')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: true });
  if (error || !data || data.length === 0) return [];

  const paths = data.map((row) => row.storage_path as string);
  const { data: signed, error: signError } = await supabase.storage
    .from('photos')
    .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);
  if (signError || !signed) return [];

  return data
    .map((row, i) => ({ id: row.id as string, url: signed[i]?.signedUrl ?? '' }))
    .filter((photo) => photo.url.length > 0);
}
