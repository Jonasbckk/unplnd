import { isRevenueCatConfigured } from '@/lib/revenuecat';

/**
 * Whether this build sells UNPLND Premium at all.
 *
 * Launch decision (2026-11-04): version 1.0 ships 100% free. Monetization switches on
 * automatically once a RevenueCat public key is in the build (EXPO_PUBLIC_REVENUECAT_IOS_KEY /
 * _ANDROID_KEY). Without a key there is no way to buy, so nothing may be locked either:
 * every premium feature is unlocked, the paywall never opens and no upsell is shown.
 *
 * Server side, the voice concierge follows the matching Supabase secret
 * UNPLND_PREMIUM_ENABLED=true — set it in the same release that adds the RevenueCat key.
 */
export const MONETIZATION_ENABLED = isRevenueCatConfigured();
