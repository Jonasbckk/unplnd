import { create } from 'zustand';

import type { SharedPlan } from '@/lib/messaging';

/** Holds a plan the user is about to share into a chat (picked on the Messages screen). */
interface ShareState {
  plan: SharedPlan | null;
  setPlan: (plan: SharedPlan | null) => void;
}

export const useShareStore = create<ShareState>((set) => ({
  plan: null,
  setPlan: (plan) => set({ plan }),
}));
