import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';
import { useRevenueCatStore } from '@/store/revenuecat-store';

/**
 * Whether the current user has UNPLND Premium. True if any of:
 * - the RevenueCat "premium" entitlement is active (instant after purchase),
 * - profiles.premium (server truth via the RevenueCat webhook — survives reinstall/cross-device),
 * - is_founder (Jonas & Flavio always have everything unlocked).
 */
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

  return rcPremium || premium;
}
