import { useAuthStore } from '@/features/auth/auth-store';

/**
 * Profile styles — a personal look for your profile (accent color + gradient banner).
 * Free styles are always available; premium styles unlock with UNPLND Premium.
 * Persisted in auth user_metadata.profile_style (reactive app-wide, no DB migration needed).
 */
export interface ProfileStyle {
  id: string;
  /** Recolors avatar, stat icons, badges, hearts. */
  accent: string;
  /** Banner background gradient (top → bottom). At least two stops. */
  gradient: readonly [string, string, ...string[]];
  /** Readable text/icon color on top of the banner. */
  onGradient: string;
  premium: boolean;
  /** Subtle light sweep across the banner (respects Reduce Motion). */
  animated: boolean;
}

export const PROFILE_STYLES: readonly ProfileStyle[] = [
  {
    id: 'terracotta',
    accent: '#C97B63',
    gradient: ['#F5E7DF', '#E9C9B9'],
    onGradient: '#5A3E32',
    premium: false,
    animated: false,
  },
  {
    id: 'espresso',
    accent: '#8A6A5B',
    gradient: ['#5A423A', '#31231D'],
    onGradient: '#F3E9E2',
    premium: false,
    animated: false,
  },
  {
    id: 'ocean',
    accent: '#6D9DC5',
    gradient: ['#8FB8D9', '#4F7BAE'],
    onGradient: '#FFFFFF',
    premium: true,
    animated: true,
  },
  {
    id: 'olive',
    accent: '#7A8F63',
    gradient: ['#9DB183', '#5E7049'],
    onGradient: '#FFFFFF',
    premium: true,
    animated: false,
  },
  {
    id: 'sunset',
    accent: '#E88C5A',
    gradient: ['#F6B27A', '#E86A8C'],
    onGradient: '#FFFFFF',
    premium: true,
    animated: true,
  },
  {
    id: 'midnight',
    accent: '#9B8CF0',
    gradient: ['#3A3170', '#1C1838'],
    onGradient: '#EDE9FF',
    premium: true,
    animated: true,
  },
];

export const DEFAULT_PROFILE_STYLE = PROFILE_STYLES[0];

export function getProfileStyle(id: string | undefined | null): ProfileStyle {
  return PROFILE_STYLES.find((s) => s.id === id) ?? DEFAULT_PROFILE_STYLE;
}

/** The current user's chosen profile style — reactive via the auth store's user_metadata. */
export function useProfileStyle(): ProfileStyle {
  const styleId = useAuthStore(
    (s) => (s.user?.user_metadata as { profile_style?: string } | undefined)?.profile_style,
  );
  return getProfileStyle(styleId);
}
