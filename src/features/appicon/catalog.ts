import type { VerifyMetrics } from '@/features/verify/verification';

export type IconTier = 'default' | 'premium' | 'achievement';

export interface AppIconDef {
  /** Stable key — used in code + i18n. Never derived from the artwork's file number. */
  key: string;
  /**
   * The name registered with iOS, matching app.json's expo-alternate-app-icons entry.
   * null = the app's built-in icon (the white UNPLND logo) — selecting it resets to default.
   */
  iosName: string | null;
  tier: IconTier;
  /** The bundled artwork (1024×1024, RGB, no alpha — iOS rounds the corners itself). */
  source: number;
  /**
   * What has to be true to use it, from REAL activity (no fakes).
   * - achievement: earned, never buyable — that's what makes it worth something
   * - premium: undefined here; the subscription IS the condition
   * - default: always yours
   */
  requires?: { metric: keyof VerifyMetrics; target: number };
}

/**
 * The icons that ship with the app. iOS can only offer alternate icons that are baked into the
 * native build, so this list and the app.json plugin config must stay in sync — adding one later
 * always costs a new build.
 */
export const APP_ICONS: AppIconDef[] = [
  // The app's own logo. Always available — you can't lock someone out of the default icon.
  {
    key: 'standard',
    iosName: null,
    tier: 'default',
    source: require('../../../assets/images/icon.png'),
  },

  // Premium — pure taste. The subscription unlocks them, nothing to grind.
  { key: 'lavender', iosName: 'Lavender', tier: 'premium', source: require('../../../assets/images/app-icons/lavender.png') },
  { key: 'mint', iosName: 'Mint', tier: 'premium', source: require('../../../assets/images/app-icons/mint.png') },
  { key: 'lime', iosName: 'Lime', tier: 'premium', source: require('../../../assets/images/app-icons/lime.png') },

  // Earned only. Deliberately NOT buyable: if money unlocked these, they'd mean nothing.
  {
    key: 'holographic',
    iosName: 'Holographic',
    tier: 'achievement',
    source: require('../../../assets/images/app-icons/holographic.png'),
    requires: { metric: 'streakDays', target: 14 },
  },
];

export interface IconState {
  def: AppIconDef;
  unlocked: boolean;
  /** Progress toward `requires`, capped at the target. Absent when there's nothing to earn. */
  current?: number;
  target?: number;
  /** Locked only because there's no subscription (as opposed to not earned yet). */
  needsPremium: boolean;
}

/**
 * Can this icon be used? Founders get everything — that's how we test the real thing without
 * faking data (`is_founder`, the same flag behind the CEO badge and the ops metrics).
 */
export function iconState(
  def: AppIconDef,
  metrics: VerifyMetrics | null,
  isPremium: boolean,
  isFounder: boolean,
): IconState {
  const current = def.requires ? Math.min(metrics?.[def.requires.metric] ?? 0, def.requires.target) : undefined;

  if (isFounder) return { def, unlocked: true, current, target: def.requires?.target, needsPremium: false };

  const earned = def.requires ? (metrics?.[def.requires.metric] ?? 0) >= def.requires.target : true;
  const paid = def.tier !== 'premium' || isPremium;

  return {
    def,
    unlocked: earned && paid,
    current,
    target: def.requires?.target,
    needsPremium: earned && !paid,
  };
}
