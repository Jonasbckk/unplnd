import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

/** Pick a single square photo for the avatar (with crop). Returns null if cancelled/denied. */
export async function pickAvatar(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

/** Update the display name — on the auth user (what the app shows) + the profiles row (community). */
export async function updateProfileName(name: string): Promise<boolean> {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const { error } = await supabase.auth.updateUser({ data: { display_name: trimmed } });
  if (error) return false;
  const userId = useAuthStore.getState().user?.id;
  if (userId) await supabase.from('profiles').update({ display_name: trimmed }).eq('id', userId);
  return true;
}

/** Set the profile style (accent + banner). Stored on the auth user → reactive app-wide. */
export async function updateProfileStyle(styleId: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ data: { profile_style: styleId } });
  return !error;
}

/** Upload a new avatar → public URL, stored on the auth user + the profiles row. Returns the URL. */
export async function updateProfileAvatar(asset: ImagePicker.ImagePickerAsset): Promise<string | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return null;
  try {
    const response = await fetch(asset.uri);
    const body = await response.arrayBuffer();
    const ext = asset.mimeType?.split('/')[1] ?? 'jpg';
    const path = `${userId}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
    if (upErr) return null;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    // Cache-bust: same path (upsert) would otherwise show the stale cached image.
    const url = `${data.publicUrl}?v=${Date.now()}`;
    await supabase.auth.updateUser({ data: { avatar_url: url } });
    await supabase.from('profiles').update({ photo_url: url }).eq('id', userId);
    return url;
  } catch {
    return null;
  }
}
