import type { VerifyMetrics } from '@/features/verify/verification';

export type IconTier = 'free' | 'premium' | 'achievement';

export interface AppIconDef {
  /** Stable key used in code + i18n. Never derived from the artwork's file number. */
  key: string;
  /** The name registered with iOS — must match app.json's expo-alternate-app-icons entry exactly. */
  iosName: string;
  tier: IconTier;
  /** The bundled artwork (1024×1024, RGB, no alpha — iOS rounds the corners itself). */
  source: number;
  /**
   * What has to be true to use it, from REAL activity (no fakes).
   * - free: an easy first goal
   * - achievement: earned, never buyable — that's what makes it worth something
   * - premium: undefined here; the subscription IS the condition
   */
  requires?: { metric: keyof VerifyMetrics; target: number };
}

/**
 * The icons that ship with the app. iOS can only offer alternate icons that are baked into the
 * native build, so this list and the app.json plugin config must stay in sync — adding one later
 * always costs a new build.
 */
export const APP_ICONS: AppIconDef[] = [
  // Free — but still earned with a small first goal (founder: "unter der Voraussetzung, dass man 3 Abende plant").
  {
    key: 'classic',
    iosName: 'Classic',
    tier: 'free',
    source: require('../../../assets/images/app-icons/classic.png'),
    requires: { metric: 'eveningsCreated', target: 3 },
  },

  // Premium — pure taste. The subscription unlocks them, nothing to grind.
  { key: 'white',
    iosName: 'White', tier: 'premium', source: require('../../../assets/images/app-icons/white.png') },
  { key: 'marble',
    iosName: 'Marble', tier: 'premium', source: require('../../../assets/images/app-icons/marble.png') },
  { key: 'lavender',
    iosName: 'Lavender', tier: 'premium', source: require('../../../assets/images/app-icons/lavender.png') },
  { key: 'mint',
    iosName: 'Mint', tier: 'premium', source: require('../../../assets/images/app-icons/mint.png') },
  { key: 'lime',
    iosName: 'Lime', tier: 'premium', source: require('../../../assets/images/app-icons/lime.png') },

  // Achievement — earned only. Deliberately NOT buyable: if money could unlock these, they'd mean nothing.
  {
    key: 'holographic',
    iosName: 'Holographic',
    tier: 'achievement',
    source: require('../../../assets/images/app-icons/holographic.png'),
    requires: { metric: 'streakDays', target: 7 },
  },
  {
    key: 'gold',
    iosName: 'Gold',
    tier: 'achievement',
    source: require('../../../assets/images/app-icons/gold.png'),
    requires: { metric: 'published', target: 25 },
  },
];

/** No alternate icon set → iOS shows the app's built-in icon (app.json "icon"). */
export const DEFAULT_ICON_KEY = null;

export interface IconState {
  def: AppIconDef;
  unlocked: boolean;
  /** Progress toward `requires`, capped at the target. Absent for premium icons. */
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
  if (isFounder) return { def, unlocked: true, needsPremium: false };

  const earned = def.requires
    ? (metrics?.[def.requires.metric] ?? 0) >= def.requires.target
    : true;
  const paid = def.tier !== 'premium' || isPremium;

  return {
    def,
    unlocked: earned && paid,
    current: def.requires ? Math.min(metrics?.[def.requires.metric] ?? 0, def.requires.target) : undefined,
    target: def.requires?.target,
    needsPremium: earned && !paid,
  };
}
