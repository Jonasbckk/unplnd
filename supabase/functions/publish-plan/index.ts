// UNPLND — publish an evening (album) to the community feed (Feature D, Deno).
// Verifies the caller owns the album AND has their own photos, copies those photos from the
// private `photos` bucket to the public `published-photos` bucket, and inserts a published_plans
// row (author name/avatar, plan stops, city, coords, self-rating). Service-role only.
// Deploy: Dashboard → Edge Functions → new function "publish-plan" → paste this file.
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_PHOTOS = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401, headers: CORS });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Identify the caller from their own JWT — a user can only publish their own album.
  const asUser = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: userData, error: userErr } = await asUser.auth.getUser();
  if (userErr || !userData.user) {
    return Response.json({ error: { code: 'UNAUTHORIZED' } }, { status: 401, headers: CORS });
  }
  const userId = userData.user.id;

  let body: { albumId?: string };
  try {
    body = (await req.json()) as { albumId?: string };
  } catch {
    return Response.json({ error: { code: 'BAD_REQUEST' } }, { status: 400, headers: CORS });
  }
  const albumId = body.albumId;
  if (!albumId) return Response.json({ error: { code: 'BAD_REQUEST' } }, { status: 400, headers: CORS });

  const admin = createClient(url, serviceKey);

  // The album must exist and belong to the caller.
  const { data: album } = await admin
    .from('albums')
    .select('id, owner_id, title, city, timeline, plan_id')
    .eq('id', albumId)
    .single();
  if (!album || album.owner_id !== userId) {
    return Response.json({ error: { code: 'NOT_FOUND' } }, { status: 404, headers: CORS });
  }

  // Already published? Don't duplicate — just return the existing one.
  const { data: existing } = await admin
    .from('published_plans')
    .select('id')
    .eq('source_album_id', albumId)
    .maybeSingle();
  if (existing) return Response.json({ ok: true, id: existing.id, already: true }, { headers: CORS });

  // Photo gate (founder decision): you must have your OWN photos of the evening to publish.
  const { data: photoRows } = await admin
    .from('album_photos')
    .select('storage_path')
    .eq('album_id', albumId)
    .order('sort_order', { ascending: true });
  const paths = (photoRows ?? [])
    .map((p: { storage_path: string }) => p.storage_path)
    .filter(Boolean)
    .slice(0, MAX_PHOTOS);
  if (!paths.length) return Response.json({ error: { code: 'NO_PHOTOS' } }, { headers: CORS });

  // Author identity — denormalized so the feed never has to read another user's private profile.
  const { data: profile } = await admin.from('profiles').select('display_name, photo_url').eq('id', userId).single();
  const authorName =
    profile?.display_name ?? (userData.user.user_metadata?.display_name as string | undefined) ?? null;
  const authorAvatar = (profile?.photo_url as string | null) ?? null;

  // Self-rating + summary come from the source plan (Feature C), if the album has one.
  let selfRating: number | null = null;
  let summary: string | null = null;
  if (album.plan_id) {
    const { data: plan } = await admin.from('plans').select('user_rating, summary').eq('id', album.plan_id).single();
    selfRating = (plan?.user_rating as number | null) ?? null;
    summary = (plan?.summary as string | null) ?? null;
  }

  // Location from the first stop that carries coordinates (for the proximity feed).
  const stops: Array<{ lat?: number; lng?: number }> = Array.isArray(album.timeline) ? album.timeline : [];
  const geo = stops.find((s) => typeof s?.lat === 'number' && typeof s?.lng === 'number');

  // Copy the chosen photos into the PUBLIC bucket (the private album bucket stays untouched).
  const publishedId = crypto.randomUUID();
  const photoUrls: string[] = [];
  for (let i = 0; i < paths.length; i++) {
    const { data: blob } = await admin.storage.from('photos').download(paths[i]);
    if (!blob) continue;
    const ext = (paths[i].split('.').pop() || 'jpg').toLowerCase();
    const dest = `${userId}/${publishedId}/${i}.${ext}`;
    const { error: upErr } = await admin.storage
      .from('published-photos')
      .upload(dest, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
    if (upErr) continue;
    const { data: pub } = admin.storage.from('published-photos').getPublicUrl(dest);
    if (pub?.publicUrl) photoUrls.push(pub.publicUrl);
  }
  if (!photoUrls.length) return Response.json({ error: { code: 'NO_PHOTOS' } }, { headers: CORS });

  const { error: insErr } = await admin.from('published_plans').insert({
    id: publishedId,
    author_id: userId,
    source_album_id: albumId,
    author_name: authorName,
    author_avatar: authorAvatar,
    title: album.title,
    summary,
    city: album.city,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    route: stops,
    photos: photoUrls,
    self_rating: selfRating,
  });
  if (insErr) {
    console.error('publish_insert_error', insErr.message);
    return Response.json({ error: { code: 'PUBLISH_FAILED' } }, { status: 500, headers: CORS });
  }

  return Response.json({ ok: true, id: publishedId }, { headers: CORS });
});
