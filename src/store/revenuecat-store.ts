import { create } from 'zustand';

import {
  checkPremium,
  getOffering,
  initRevenueCat,
  onCustomerInfo,
  rcLogIn,
  rcLogOut,
  type PurchasesOffering,
} from '@/lib/revenuecat';

interface RevenueCatState {
  /** Premium from the RevenueCat "premium" entitlement (instant after purchase). */
  isPremium: boolean;
  offering: PurchasesOffering | null;
  ready: boolean;
  /** Configure RC for the signed-in user, wire the live listener, load offering + entitlement. */
  start: (userId: string | null | undefined) => Promise<void>;
  refresh: () => Promise<void>;
  reset: () => Promise<void>;
}

let unsubscribe: (() => void) | null = null;

export const useRevenueCatStore = create<RevenueCatState>((set) => ({
  isPremium: false,
  offering: null,
  ready: false,
  start: async (userId) => {
    initRevenueCat(userId);
    if (!unsubscribe) {
      unsubscribe = onCustomerInfo((premium) => set({ isPremium: premium }));
    }
    if (userId) await rcLogIn(userId);
    const [isPremium, offering] = await Promise.all([checkPremium(), getOffering()]);
    set({ isPremium, offering, ready: true });
  },
  refresh: async () => {
    const [isPremium, offering] = await Promise.all([checkPremium(), getOffering()]);
    set({ isPremium, offering });
  },
  reset: async () => {
    await rcLogOut();
    set({ isPremium: false });
  },
}));
