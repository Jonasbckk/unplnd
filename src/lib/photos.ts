import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Resolve Google Place photo names → displayable URLs on demand — called when a stop's gallery
 * opens, so we only pay Google for photos the user actually looks at (19_ROUTE). The key stays
 * server-side in the `resolve-photos` Edge Function; on any failure we return [].
 */
export async function resolveStopPhotos(names: string[]): Promise<string[]> {
  if (!names.length || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.functions.invoke<{ urls?: string[] }>('resolve-photos', {
      body: { names },
    });
    if (error || !data?.urls) return [];
    return data.urls;
  } catch {
    return [];
  }
}
