import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/auth-store';
import { MONETIZATION_ENABLED } from '@/lib/monetization';
import { supabase } from '@/lib/supabase';
import { useRevenueCatStore } from '@/store/revenuecat-store';

/**
 * Whether the current user has UNPLND Premium. True if any of:
 * - the RevenueCat "premium" entitlement is active (instant after purchase),
 * - profiles.premium (server truth via the RevenueCat webhook — survives reinstall/cross-device),
 * - is_founder (Jonas & Flavio always have everything unlocked).
 */
/** One-shot premium check for imperative flows (e.g. upsell triggers) — same truth as usePremium. */
export async function fetchIsPremium(): Promise<boolean> {
  // Free launch: nothing is for sale, so everything is unlocked for everyone.
  if (!MONETIZATION_ENABLED) return true;
  if (useRevenueCatStore.getState().isPremium) return true;
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return false;
  const { data } = await supabase.from('profiles').select('premium, is_founder').eq('id', userId).single();
  return Boolean(data?.premium || data?.is_founder);
}

export function usePremium(): boolean {
  const userId = useAuthStore((s) => s.user?.id);
  const rcPremium = useRevenueCatStore((s) => s.isPremium);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPremium(false);
      return;
    }
    let active = true;
    void supabase
      .from('profiles')
      .select('premium, is_founder')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (active) setPremium(Boolean(data?.premium || data?.is_founder));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return !MONETIZATION_ENABLED || rcPremium || premium;
}
