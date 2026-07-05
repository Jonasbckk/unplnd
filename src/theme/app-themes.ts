import { shade } from '@/utils/color';
import type { ColorTokens } from './colors';

/**
 * App colour themes — recolour the brand `primary` (CTAs, active tabs, selected states, links)
 * app-wide, like the profile-style system but for the whole app. Warm surfaces/headings stay, so
 * the app always feels like UNPLND. Gating (founder decision 2026-07-05):
 *   • `default`  — always available
 *   • `unlock`   — free, unlocks once you've published UNLOCK_PUBLISHED_REQUIRED evenings
 *   • `premium`  — UNPLND Premium only (enforced once the subscription system is live)
 */
export type AppThemeTier = 'default' | 'unlock' | 'premium';

export interface AppTheme {
  id: string;
  /** Brand colour that replaces `primary` everywhere. `primaryPressed` is derived from it. */
  primary: string;
  tier: AppThemeTier;
}

export const DEFAULT_THEME_ID = 'terracotta';
export const UNLOCK_PUBLISHED_REQUIRED = 3;

export const APP_THEMES: readonly AppTheme[] = [
  { id: 'terracotta', primary: '#C97B63', tier: 'default' },
  { id: 'ocean', primary: '#6D9DC5', tier: 'unlock' },
  { id: 'forest', primary: '#7A8F63', tier: 'unlock' },
  { id: 'sunset', primary: '#E88C5A', tier: 'unlock' },
  { id: 'plum', primary: '#9265C4', tier: 'premium' },
  { id: 'rose', primary: '#C56B87', tier: 'premium' },
  { id: 'gold', primary: '#B08D57', tier: 'premium' },
];

/** Apply the chosen theme's brand colour onto a base (light/dark) palette. */
export function applyAppTheme(base: ColorTokens, appThemeId: string): ColorTokens {
  const theme = APP_THEMES.find((a) => a.id === appThemeId);
  if (!theme || theme.id === DEFAULT_THEME_ID) return base;
  return { ...base, primary: theme.primary, primaryPressed: shade(theme.primary, -0.12) };
}
