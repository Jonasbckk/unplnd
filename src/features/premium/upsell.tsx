import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuthStore } from '@/features/auth/auth-store';
import { fetchIsPremium } from '@/features/profile/use-premium';
import { useAppStore, type UpsellKind } from '@/store/app-store';

const PAYWALL = '/paywall' as Href;

/**
 * Premium upsell moments (founder decision 2026-07-07):
 * every 2nd app open · every 3rd settings visit · after every 3rd profile-style change.
 * Premium users (incl. founders) never see it; a cooldown keeps triggers from stacking.
 */
export async function maybeShowUpsell(
  kind: UpsellKind,
  router: { push: (href: Href) => void },
  delayMs = 650,
): Promise<void> {
  if (await fetchIsPremium()) return;
  if (!useAppStore.getState().registerUpsellEvent(kind)) return;
  // Small delay so the current screen settles before the sheet slides up.
  setTimeout(() => router.push(PAYWALL), delayMs);
}

/** Mount once in the root layout — counts a cold start as one "app open". */
export function UpsellOnAppOpen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || !session || !hasOnboarded) return;
    fired.current = true;
    // Let launch settle (splash, streak moment, home hero) before any sales pitch.
    const timer = setTimeout(() => void maybeShowUpsell('appOpen', router, 0), 2500);
    return () => clearTimeout(timer);
  }, [session, hasOnboarded, router]);

  return null;
}
