import { supabase } from '@/lib/supabase';

/** Whether this album currently has a published version in the community feed. */
export async function isAlbumPublished(albumId: string): Promise<boolean> {
  const { data } = await supabase
    .from('published_plans')
    .select('id')
    .eq('source_album_id', albumId)
    .maybeSingle();
  return !!data;
}

export type PublishResult =
  | { ok: true; id: string; alreadyPublished: boolean }
  | { ok: false; reason: 'no_photos' | 'failed' };

interface PublishResponse {
  ok?: boolean;
  id?: string;
  already?: boolean;
  error?: { code: string };
}

/**
 * Publish an evening (album) to the community feed (Feature D). The user must have their OWN
 * photos of the evening — this is enforced server-side in the `publish-plan` Edge Function, which
 * copies the chosen photos into the public bucket and creates the published_plans row.
 */
export async function publishPlan(albumId: string): Promise<PublishResult> {
  try {
    const { data, error } = await supabase.functions.invoke<PublishResponse>('publish-plan', {
      body: { albumId },
    });
    if (error || !data) return { ok: false, reason: 'failed' };
    if (data.ok && data.id) return { ok: true, id: data.id, alreadyPublished: Boolean(data.already) };
    if (data.error?.code === 'NO_PHOTOS') return { ok: false, reason: 'no_photos' };
    return { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
