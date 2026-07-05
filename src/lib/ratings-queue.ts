import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

interface PlanRatingJob {
  kind: 'plan';
  planRowId: string;
  rating: number;
}
interface PlaceRatingJob {
  kind: 'place';
  placeId: string;
  placeName: string | null;
  rating: number;
}
type RatingJob = PlanRatingJob | PlaceRatingJob;

interface RatingsQueueState {
  jobs: RatingJob[];
  hasHydrated: boolean;
  enqueuePlan: (planRowId: string, rating: number) => void;
  enqueuePlace: (placeId: string, placeName: string | null, rating: number) => void;
  flush: () => Promise<void>;
  setHasHydrated: (value: boolean) => void;
}

/**
 * Offline queue for ratings written while there's no connection. The latest rating per target
 * wins (deduped on enqueue), and the queue drains on reconnect / launch. Persisted so a rating
 * survives an app restart before it syncs.
 */
export const useRatingsQueue = create<RatingsQueueState>()(
  persist(
    (set, get) => ({
      jobs: [],
      hasHydrated: false,

      enqueuePlan: (planRowId, rating) =>
        set((s) => ({
          jobs: [...s.jobs.filter((j) => !(j.kind === 'plan' && j.planRowId === planRowId)), { kind: 'plan', planRowId, rating }],
        })),

      enqueuePlace: (placeId, placeName, rating) =>
        set((s) => ({
          jobs: [
            ...s.jobs.filter((j) => !(j.kind === 'place' && j.placeId === placeId)),
            { kind: 'place', placeId, placeName, rating },
          ],
        })),

      flush: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || get().jobs.length === 0) return;
        for (const job of get().jobs) {
          let ok = false;
          try {
            if (job.kind === 'plan') {
              const { error } = await supabase.from('plans').update({ user_rating: job.rating }).eq('id', job.planRowId);
              ok = !error;
            } else {
              const { error } = await supabase.from('place_ratings').upsert(
                { user_id: userId, place_id: job.placeId, place_name: job.placeName, rating: job.rating },
                { onConflict: 'user_id,place_id' },
              );
              ok = !error;
            }
          } catch {
            ok = false;
          }
          if (!ok) break; // still offline — keep the rest and retry next time
          set((s) => ({ jobs: s.jobs.filter((j) => j !== job) }));
        }
      },

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'unplnd-ratings-queue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ jobs: s.jobs }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
