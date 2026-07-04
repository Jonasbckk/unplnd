import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/features/auth/auth-store';
import { MAX_INTERESTS } from '@/features/profile/profile-extras';
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

/** Set the profile style (accent + banner). Stored on the auth user (reactive) + profiles (public). */
export async function updateProfileStyle(styleId: string): Promise<boolean> {
  const { error } = await supabase.auth.updateUser({ data: { profile_style: styleId } });
  if (error) return false;
  const userId = useAuthStore.getState().user?.id;
  if (userId) await supabase.from('profiles').update({ profile_style: styleId }).eq('id', userId);
  return true;
}

/** Update the bio/tagline — on the auth user (reactive) + the profiles row (shown on your public profile). */
export async function updateProfileBio(bio: string): Promise<boolean> {
  const trimmed = bio.trim().slice(0, 160);
  const { error } = await supabase.auth.updateUser({ data: { bio: trimmed } });
  if (error) return false;
  const userId = useAuthStore.getState().user?.id;
  if (userId) await supabase.from('profiles').update({ bio: trimmed || null }).eq('id', userId);
  return true;
}

/** Update the home city ("aus Gießen") — on the auth user (reactive) + the profiles row (public). */
export async function updateProfileHomeCity(city: string): Promise<boolean> {
  const trimmed = city.trim().slice(0, 60);
  const { error } = await supabase.auth.updateUser({ data: { home_city: trimmed } });
  if (error) return false;
  const userId = useAuthStore.getState().user?.id;
  if (userId) await supabase.from('profiles').update({ home_city: trimmed || null }).eq('id', userId);
  return true;
}

/** Update interests + prompt answers — on the auth user (reactive) + the profiles row (public). */
export async function updateProfileExtras(
  interests: string[],
  prompts: Record<string, string>,
): Promise<boolean> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return false;
  const cleanInterests = interests.slice(0, MAX_INTERESTS);
  const cleanPrompts: Record<string, string> = {};
  for (const [k, v] of Object.entries(prompts)) {
    const val = v.trim().slice(0, 140);
    if (val) cleanPrompts[k] = val;
  }
  const { error } = await supabase.auth.updateUser({ data: { interests: cleanInterests, prompts: cleanPrompts } });
  if (error) return false;
  await supabase.from('profiles').update({ interests: cleanInterests, prompts: cleanPrompts }).eq('id', userId);
  return true;
}

/** Set the publicly pinned favorite places (shown on your public profile). Canonical list wins. */
export async function setPinnedPlaces(names: string[]): Promise<void> {
  const next = names.slice(0, 6);
  await supabase.auth.updateUser({ data: { pinned_places: next } });
  const userId = useAuthStore.getState().user?.id;
  if (userId) await supabase.from('profiles').update({ pinned_places: next }).eq('id', userId);
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
