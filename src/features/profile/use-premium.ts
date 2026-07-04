import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

/**
 * Whether the current user has UNPLND Premium.
 * Reads profiles.premium (set by the RevenueCat webhook once billing is live).
 * Until then it stays false for everyone — set your own row's `premium = true`
 * in Supabase to preview premium-only features.
 */
export function usePremium(): boolean {
  const userId = useAuthStore((s) => s.user?.id);
  const [premium, setPremium] = useState(false);

  useEffect(() => {
    if (!userId) {
      setPremium(false);
      return;
    }
    let active = true;
    void supabase
      .from('profiles')
      .select('premium')
      .eq('id', userId)
      .single()
      .then(({ data }) => {
        if (active) setPremium(Boolean(data?.premium));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return premium;
}
