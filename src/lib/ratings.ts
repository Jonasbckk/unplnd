import { useAuthStore } from '@/features/auth/auth-store';
import { useRatingsQueue } from '@/lib/ratings-queue';
import { supabase } from '@/lib/supabase';

/** The user's own rating for a plan (0 if none) — to show + edit it on the album. */
export async function getPlanRating(planRowId: string | null): Promise<number> {
  if (!planRowId) return 0;
  const { data } = await supabase.from('plans').select('user_rating').eq('id', planRowId).maybeSingle();
  return (data?.user_rating as number | null) ?? 0;
}

/** Save the overall rating for a finished evening (the plans row). Queues offline, never lost. */
export async function savePlanRating(planRowId: string | null, rating: number): Promise<void> {
  if (!planRowId || rating <= 0) return;
  try {
    const { error } = await supabase.from('plans').update({ user_rating: rating }).eq('id', planRowId);
    if (error) useRatingsQueue.getState().enqueuePlan(planRowId, rating);
  } catch {
    // Offline / transient — hold it in the queue and sync on reconnect.
    useRatingsQueue.getState().enqueuePlan(planRowId, rating);
  }
}

/** Upsert per-place ratings for the venues the user rated (one row per place, latest wins). */
export async function savePlaceRatings(
  ratings: { placeId: string; placeName?: string; rating: number }[],
): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  const valid = ratings.filter((r) => r.placeId && r.rating > 0);
  if (!userId || !valid.length) return;
  const rows = valid.map((r) => ({ user_id: userId, place_id: r.placeId, place_name: r.placeName ?? null, rating: r.rating }));
  try {
    const { error } = await supabase.from('place_ratings').upsert(rows, { onConflict: 'user_id,place_id' });
    if (error) valid.forEach((r) => useRatingsQueue.getState().enqueuePlace(r.placeId, r.placeName ?? null, r.rating));
  } catch {
    valid.forEach((r) => useRatingsQueue.getState().enqueuePlace(r.placeId, r.placeName ?? null, r.rating));
  }
}
