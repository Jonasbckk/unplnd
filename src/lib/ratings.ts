import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

/** The user's own rating for a plan (0 if none) — to show + edit it on the album. */
export async function getPlanRating(planRowId: string | null): Promise<number> {
  if (!planRowId) return 0;
  const { data } = await supabase.from('plans').select('user_rating').eq('id', planRowId).maybeSingle();
  return (data?.user_rating as number | null) ?? 0;
}

/** Save the overall rating for a finished evening (the plans row). No-op offline / signed out. */
export async function savePlanRating(planRowId: string | null, rating: number): Promise<void> {
  if (!planRowId || rating <= 0) return;
  try {
    await supabase.from('plans').update({ user_rating: rating }).eq('id', planRowId);
  } catch {
    // Best effort — a rating must never block finishing the evening.
  }
}

/** Upsert per-place ratings for the venues the user rated (one row per place, latest wins). */
export async function savePlaceRatings(
  ratings: { placeId: string; placeName?: string; rating: number }[],
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  const rows = ratings
    .filter((r) => r.placeId && r.rating > 0)
    .map((r) => ({ user_id: userId, place_id: r.placeId, place_name: r.placeName ?? null, rating: r.rating }));
  if (!userId || !rows.length) return;
  try {
    await supabase.from('place_ratings').upsert(rows, { onConflict: 'user_id,place_id' });
  } catch {
    // Best effort.
  }
}
