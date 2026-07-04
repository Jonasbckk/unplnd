import { create } from 'zustand';

import { getCurrentLocation, type AppLocation } from '@/lib/location';

interface LocationState {
  /** A place the user explicitly chose instead of their GPS (null = use GPS). Not a silent
   *  fallback — the user picks it deliberately (respects Constitution Rule 5). */
  override: AppLocation | null;
  setOverride: (loc: AppLocation) => void;
  clearOverride: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  override: null,
  setOverride: (override) => set({ override }),
  clearOverride: () => set({ override: null }),
}));

/** The location plans + discovery should use: the user's explicit override if set, else their GPS. */
export async function getPlanningLocation(): Promise<AppLocation | null> {
  const override = useLocationStore.getState().override;
  if (override) return override;
  return getCurrentLocation();
}
