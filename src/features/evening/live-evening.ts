import type { PlanStop } from '@/features/planner/types';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { StopStatus } from './evening-store';

/**
 * A friend's evening, live (0038). Read-only: you see where they are RIGHT NOW so you can join
 * them in the real world — Constitution Rule 14, taken literally.
 */
export interface LiveEvening {
  planId: string;
  title: string;
  mood: string | null;
  startedAt: string;
  stops: (PlanStop & { status: StopStatus })[];
}

/** Push the stop-by-stop progress to the server row (best effort — the evening never waits). */
export async function publishEveningProgress(planRowId: string, statuses: StopStatus[]): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from('plans').update({ progress: statuses }).eq('id', planRowId);
}

/** A connection's live evening, or null when none is running (or you're not connected). */
export async function getLiveEveningOf(userId: string): Promise<LiveEvening | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('get_live_evening', { target: userId });
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;

  const route = (row.route as PlanStop[] | null) ?? [];
  const progress = (row.progress as StopStatus[] | null) ?? [];
  return {
    planId: row.plan_id as string,
    title: (row.summary as string | null) ?? '',
    mood: (row.mood as string | null) ?? null,
    startedAt: (row.started_at as string | null) ?? '',
    stops: route.map((s, i) => ({
      ...s,
      // Older rows have no progress yet — show everything as upcoming rather than guessing.
      status: progress[i] ?? (i === 0 ? 'current' : 'upcoming'),
    })),
  };
}
