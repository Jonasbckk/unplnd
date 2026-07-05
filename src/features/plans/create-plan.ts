import * as Crypto from 'expo-crypto';
import * as ImagePicker from 'expo-image-picker';

import { useAuthStore } from '@/features/auth/auth-store';
import type { PlanStop } from '@/features/planner/types';
import { searchPlaces } from '@/lib/place-search';
import { supabase } from '@/lib/supabase';

export interface CustomStopInput {
  time: string;
  title: string;
  /** Shown as the stop description on the community detail (maps to PlanStop.reason). */
  reason: string;
  category: string;
  /** Local device URI of the user's own photo — uploaded on publish. */
  imageUri?: string;
}

export interface CustomPlanInput {
  title: string;
  city: string;
  note: string;
  stops: CustomStopInput[];
}

export type PublishCustomResult =
  | { ok: true; id: string }
  | { ok: false; reason: 'invalid' | 'no_photos' | 'failed' | 'unauthenticated' };

/** Pick a single photo for a stop. The user provides their own images — they hold the rights. */
export async function pickStopPhoto(): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 0.8,
  });
  return result.canceled ? null : (result.assets[0] ?? null);
}

function extFromUri(uri: string): string {
  const m = /\.(\w+)(?:\?|$)/.exec(uri);
  return (m?.[1] ?? 'jpg').toLowerCase();
}

/**
 * Publish a fully user-authored plan straight to the community feed (no album needed). The user
 * supplies their own photos and confirms in the UI that they hold the rights. RLS lets a signed-in
 * user insert their own published_plans row and upload to published-photos/<uid>/…, so this runs
 * client-side — mirroring the shape the publish-plan Edge Function produces for album-based plans.
 */
export async function publishCustomPlan(input: CustomPlanInput): Promise<PublishCustomResult> {
  const user = useAuthStore.getState().user;
  if (!user?.id) return { ok: false, reason: 'unauthenticated' };

  const title = input.title.trim();
  const stops = input.stops.filter((s) => s.title.trim().length > 0);
  if (!title || stops.length === 0) return { ok: false, reason: 'invalid' };

  // At least one photo overall — so the community card isn't blank and the rights notice has teeth.
  if (!stops.some((s) => s.imageUri)) return { ok: false, reason: 'no_photos' };

  const planId = Crypto.randomUUID();

  // Author identity — denormalized so the feed never reads another user's private profile row.
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, photo_url')
    .eq('id', user.id)
    .maybeSingle();
  const authorName =
    (profile?.display_name as string | undefined) ??
    (user.user_metadata?.display_name as string | undefined) ??
    null;
  const authorAvatar = (profile?.photo_url as string | null) ?? null;

  // Upload each stop's photo to the PUBLIC bucket and build the route + gallery.
  const route: PlanStop[] = [];
  const photos: string[] = [];
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    let photoUrl: string | undefined;
    if (s.imageUri) {
      try {
        const res = await fetch(s.imageUri);
        const body = await res.arrayBuffer();
        const ext = extFromUri(s.imageUri);
        const dest = `${user.id}/${planId}/${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('published-photos')
          .upload(dest, body, { contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`, upsert: true });
        if (!upErr) {
          const { data: pub } = supabase.storage.from('published-photos').getPublicUrl(dest);
          if (pub?.publicUrl) {
            photoUrl = pub.publicUrl;
            photos.push(pub.publicUrl);
          }
        }
      } catch {
        // Skip this photo but keep the stop — never lose the whole plan over one bad image.
      }
    }
    route.push({
      time: s.time.trim() || '—',
      category: s.category || 'custom',
      title: s.title.trim(),
      reason: s.reason.trim(),
      ...(photoUrl ? { photoUrl } : {}),
    });
  }

  if (photos.length === 0) return { ok: false, reason: 'no_photos' };

  // Geocode the city (via the existing place-search Edge Function — the Google key stays
  // server-side) so the plan can rank in the proximity feed. Best-effort: no match → no coords.
  const cityText = input.city.trim();
  let lat: number | null = null;
  let lng: number | null = null;
  if (cityText) {
    const match = (await searchPlaces(cityText))[0];
    if (match) {
      lat = match.lat;
      lng = match.lng;
    }
  }

  const { error: insErr } = await supabase.from('published_plans').insert({
    id: planId,
    author_id: user.id,
    source_album_id: null,
    is_custom: true,
    author_name: authorName,
    author_avatar: authorAvatar,
    title,
    summary: input.note.trim() || null,
    city: cityText || null,
    lat,
    lng,
    route,
    photos,
    self_rating: null,
  });
  if (insErr) return { ok: false, reason: 'failed' };

  return { ok: true, id: planId };
}
