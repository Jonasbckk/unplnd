import { useAuthStore } from '@/features/auth/auth-store';
import { scheduleStreakReminder } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';

/**
 * Record that the user opened the app today (updates their daily-use streak), return the current
 * streak, and (re)arm the gentle "don't lose your streak" reminder. No-op / 0 if signed out.
 */
export async function recordActivity(): Promise<number> {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) return 0;
  try {
    await supabase.rpc('record_activity');
    const { data } = await supabase.from('profiles').select('streak_days').eq('id', uid).maybeSingle();
    const streak = (data?.streak_days as number | undefined) ?? 0;
    if (useAppStore.getState().notificationPrefs.streakReminders) {
      void scheduleStreakReminder(streak);
    }
    return streak;
  } catch {
    return 0;
  }
}
