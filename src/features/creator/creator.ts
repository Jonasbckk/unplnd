import { useAuthStore } from '@/features/auth/auth-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * The Creator programme (42_ROADMAP_V2: "Creator Partnerships — Selected local creators curate
 * experiences. No influencer feed. Quality first."). Anyone may apply with one short pitch;
 * founders review in-app; approval flips profiles.is_creator, which renders as the sparkles
 * badge everywhere the CEO ribbon does (migration 0040).
 */

export type ApplicationStatus = 'pending' | 'approved' | 'declined';

export interface CreatorApplication {
  message: string;
  status: ApplicationStatus;
}

/** A pending application as the founder review list sees it (get_creator_applications RPC). */
export interface PendingApplication {
  userId: string;
  displayName: string | null;
  photoUrl: string | null;
  message: string;
  createdAt: string;
}

/** Your own application (RLS: select own only) — null when you never applied OR on error,
 * so a deployed DB that predates migration 0040 degrades to the plain apply form. */
export async function getMyApplication(): Promise<CreatorApplication | null> {
  const userId = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !userId) return null;
  try {
    const { data, error } = await supabase
      .from('creator_applications')
      .select('message, status')
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return { message: data.message as string, status: data.status as ApplicationStatus };
  } catch {
    return null;
  }
}

/**
 * Send (or resend) your pitch. The table keeps ONE row per user, so a fresh apply inserts and a
 * re-apply after a decline hits the unique key (23505) → update back to pending instead (the RLS
 * update policy only permits this while the row is declined).
 */
export async function applyAsCreator(message: string): Promise<boolean> {
  const userId = useAuthStore.getState().user?.id;
  if (!isSupabaseConfigured || !userId) return false;
  try {
    const { error } = await supabase.from('creator_applications').insert({ user_id: userId, message });
    if (!error) return true;
    if (error.code !== '23505') return false;
    const { error: updateError } = await supabase
      .from('creator_applications')
      .update({ message, status: 'pending', reviewed_at: null })
      .eq('user_id', userId);
    return !updateError;
  } catch {
    return false;
  }
}

/** Pending applications for the founder review list — the RPC itself returns empty for non-founders. */
export async function getPendingApplications(): Promise<PendingApplication[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase.rpc('get_creator_applications');
    if (error || !Array.isArray(data)) return [];
    return (data as Record<string, unknown>[]).map((r) => ({
      userId: r.user_id as string,
      displayName: (r.display_name as string | null) ?? null,
      photoUrl: (r.photo_url as string | null) ?? null,
      message: r.message as string,
      createdAt: r.created_at as string,
    }));
  } catch {
    return [];
  }
}

/** Approve or decline an application (founder-only RPC; approval sets profiles.is_creator). */
export async function reviewApplication(applicant: string, approve: boolean): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const { data, error } = await supabase.rpc('review_creator_application', { applicant, approve });
    return !error && data === true;
  } catch {
    return false;
  }
}
