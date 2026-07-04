import { i18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface PlaceSuggestion {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Search cities / addresses → suggestions with coordinates, for the location-override picker.
 * The Google key stays server-side in the `place-search` Edge Function; failures return [].
 */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (query.trim().length < 2 || !isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.functions.invoke<{ suggestions?: PlaceSuggestion[] }>('place-search', {
      body: { query: query.trim(), language: i18n.locale },
    });
    if (error || !data?.suggestions) return [];
    return data.suggestions;
  } catch {
    return [];
  }
}
