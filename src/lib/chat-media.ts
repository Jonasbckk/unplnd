import type * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export interface UploadResult {
  path: string | null;
  error?: string;
}

/** Uploads a picked image to the private chat-media bucket under {conversationId}/…. */
export async function uploadChatImage(
  conversationId: string,
  asset: ImagePicker.ImagePickerAsset,
): Promise<UploadResult> {
  try {
    const response = await fetch(asset.uri);
    const body = await response.arrayBuffer();
    if (body.byteLength === 0) return { path: null, error: 'empty file (0 bytes)' };
    const extension = asset.mimeType?.split('/')[1] ?? 'jpg';
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${conversationId}/${Date.now()}-${rand}.${extension}`;
    const { error } = await supabase.storage
      .from('chat-media')
      .upload(path, body, { contentType: asset.mimeType ?? 'image/jpeg' });
    if (error) return { path: null, error: error.message };
    return { path };
  } catch (e) {
    return { path: null, error: e instanceof Error ? e.message : 'unknown error' };
  }
}

/** Uploads a recorded audio clip (local file uri) to the private chat-media bucket. */
export async function uploadChatAudio(conversationId: string, uri: string): Promise<UploadResult> {
  try {
    const response = await fetch(uri);
    const body = await response.arrayBuffer();
    if (body.byteLength === 0) return { path: null, error: 'empty recording (0 bytes)' };
    const rand = Math.random().toString(36).slice(2, 10);
    const path = `${conversationId}/${Date.now()}-${rand}.m4a`;
    const { error } = await supabase.storage
      .from('chat-media')
      .upload(path, body, { contentType: 'audio/m4a' });
    if (error) return { path: null, error: error.message };
    return { path };
  } catch (e) {
    return { path: null, error: e instanceof Error ? e.message : 'unknown error' };
  }
}

// Reuse signed URLs for ~50 min — a fresh token per render changes the URL and defeats
// expo-image's disk cache, forcing chat photos to re-download on every screen visit.
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGNED_URL_REUSE_MS = (SIGNED_URL_TTL_SECONDS - 10 * 60) * 1000;

/** A short-lived signed URL for a private chat media file (image or audio). */
export async function getChatMediaUrl(path: string): Promise<string | null> {
  const hit = signedUrlCache.get(path);
  if (hit && hit.expiresAt > Date.now()) return hit.url;
  const { data } = await supabase.storage.from('chat-media').createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (data?.signedUrl) signedUrlCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_URL_REUSE_MS });
  return data?.signedUrl ?? null;
}
