import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/features/auth/auth-store';
import type { GeneratedPlan, PlanStop } from '@/features/planner/types';
import { cancelEveningReminders, scheduleStopReminders } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/store/app-store';

export type StopStatus = 'upcoming' | 'current' | 'completed' | 'skipped';

export interface EveningStop extends PlanStop {
  status: StopStatus;
}

export interface ActiveEvening {
  plan: GeneratedPlan;
  mood?: string;
  /** Supabase plans row id — null while offline / signed out. The evening never blocks on it. */
  planRowId: string | null;
  startedAt: string;
  stops: EveningStop[];
}

interface EveningState {
  evening: ActiveEvening | null;
  hasHydrated: boolean;
  startEvening: (plan: GeneratedPlan, mood?: string) => void;
  completeCurrentStop: () => void;
  skipCurrentStop: () => void;
  /** Ends the evening (marks the Supabase plan completed) and clears local state. */
  finishEvening: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

function advance(stops: EveningStop[], status: 'completed' | 'skipped'): EveningStop[] {
  const idx = stops.findIndex((s) => s.status === 'current');
  if (idx === -1) return stops;
  const next = stops.map((s, i) => (i === idx ? { ...s, status } : s));
  const upcoming = next.findIndex((s) => s.status === 'upcoming');
  if (upcoming !== -1) {
    next[upcoming] = { ...next[upcoming], status: 'current' };
  }
  return next;
}

/** True when no stop is current or upcoming anymore. */
export function isEveningDone(evening: ActiveEvening): boolean {
  return !evening.stops.some((s) => s.status === 'current' || s.status === 'upcoming');
}

export const useEveningStore = create<EveningState>()(
  persist(
    (set, get) => ({
      evening: null,
      hasHydrated: false,

      startEvening: (plan, mood) => {
        const startedAt = new Date().toISOString();
        const stops: EveningStop[] = plan.stops.map((s, i) => ({
          ...s,
          status: i === 0 ? 'current' : 'upcoming',
        }));
        set({ evening: { plan, mood, planRowId: null, startedAt, stops } });

        // Gentle stop reminders — only if the user wants them (23_SETTINGS toggle).
        if (useAppStore.getState().notificationPrefs.eveningReminders) {
          void scheduleStopReminders(stops);
        }

        // Persist to Supabase in the background — the evening never waits for the network (32_OFFLINE).
        const userId = useAuthStore.getState().user?.id;
        if (!userId) return;
        void supabase
          .from('plans')
          .insert({
            owner_id: userId,
            status: 'active',
            mood: mood ?? null,
            summary: plan.title,
            estimated_cost: plan.estimatedCost,
            experience_score: plan.score,
            route: plan.stops,
          })
          .select('id')
          .single()
          .then(({ data }) => {
            if (!data) return;
            set((s) =>
              s.evening && s.evening.startedAt === startedAt
                ? { evening: { ...s.evening, planRowId: data.id as string } }
                : s,
            );
          });
      },

      completeCurrentStop: () =>
        set((s) => (s.evening ? { evening: { ...s.evening, stops: advance(s.evening.stops, 'completed') } } : s)),

      skipCurrentStop: () =>
        set((s) => (s.evening ? { evening: { ...s.evening, stops: advance(s.evening.stops, 'skipped') } } : s)),

      finishEvening: async () => {
        const evening = get().evening;
        set({ evening: null });
        void cancelEveningReminders();
        if (evening?.planRowId) {
          await supabase
            .from('plans')
            .update({ status: 'completed', completed_at: new Date().toISOString() })
            .eq('id', evening.planRowId);
        }
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'unplnd-evening',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ evening: state.evening }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
