import { useEffect, useState } from 'react';

import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

/**
 * Whether the current user has UNPLND Premium.
 * Reads profiles.premium (set by the RevenueCat webhook once billing is live). Founders
 * (is_founder) always count as premium — they get everything unlocked. Otherwise it's false for
 * everyone until billing is live — set your own row's `premium = true` to preview.
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

  return premium;
}
