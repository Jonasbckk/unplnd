import type * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

/** Uploads a picked image to the private chat-media bucket under {conversationId}/…. Returns the path. */
export async function uploadChatImage(
  conversationId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<string | null> {
  try {
    const response = await fetch(asset.uri);
    const body = await response.arrayBuffer();
    const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${conversationId}/${Date.now()}-${rand}.${extension}`;
    const { error } = await supabase.storage
      .from('chat-media')
      .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg' });
    if (error) return null;
    return path;
  } catch {
    return null;
  }
}

/** A short-lived signed URL for a chat image (the bucket is private). */
export async function getChatImageUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from('chat-media').createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  return data?.signedUrl ?? null;
}
