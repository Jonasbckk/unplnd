import { create } from 'zustand';

import { useAppStore } from '@/store/app-store';

interface CelebrateState {
  /** When set, show the streak celebration with this day count. */
  streak: number | null;
  /** When set, show the tier-unlock celebration for this level. */
  tierLevel: number | null;
  showStreak: (n: number) => void;
  showTier: (level: number) => void;
  clearStreak: () => void;
  clearTier: () => void;
}

export const useCelebrateStore = create<CelebrateState>((set) => ({
  streak: null,
  tierLevel: null,
  showStreak: (n) => set({ streak: n }),
  showTier: (level) => set({ tierLevel: level }),
  clearStreak: () => set({ streak: null }),
  clearTier: () => set({ tierLevel: null }),
}));

/**
 * Congratulate the user the first time they reach a new verification tier. Guarded by
 * `lastSeenTier` so it fires exactly once per tier. Call wherever a fresh tier level is known.
 */
export function maybeCelebrateTier(level: number): void {
  const { lastSeenTier, setLastSeenTier } = useAppStore.getState();
  if (level > lastSeenTier) {
    setLastSeenTier(level);
    if (level > 0) useCelebrateStore.getState().showTier(level);
  }
}
