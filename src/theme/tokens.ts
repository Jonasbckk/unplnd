/**
 * UNPLND design tokens — spacing, radius, typography, motion, shadows.
 * Sources: docs/07_TYPOGRAPHY.md, 08_COMPONENTS.md, 09_ANIMATIONS.md, 05/45 design systems.
 */
import { Easing, Platform, type TextStyle } from 'react-native';

/** 8-pt spacing scale (superset). Never use arbitrary values. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24, // standard screen padding
  xl: 32,
  xxl: 40,
  xxxl: 48,
  huge: 64,
  giant: 80,
  mega: 96,
} as const;

/** Corner radii — follows 08_COMPONENTS (build-ready). Everything soft, never sharp. */
export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  card: 28,
  sheet: 32,
  button: 20,
  buttonSecondary: 18,
  pill: 999,
} as const;

/**
 * Font strategy (07_TYPOGRAPHY): iOS uses SF Pro (system) with weights;
 * Android + Web use the loaded Inter family per weight. Never ExtraBold/Black.
 */
type Weight = '300' | '400' | '500' | '600' | '700';

const INTER_BY_WEIGHT: Record<Weight, string> = {
  '300': 'Inter_300Light',
  '400': 'Inter_400Regular',
  '500': 'Inter_500Medium',
  '600': 'Inter_600SemiBold',
  '700': 'Inter_700Bold',
};

function typ(fontSize: number, lineHeight: number, weight: Weight): TextStyle {
  // iOS → system SF Pro + weight; Android/Web → weight-specific Inter family (no synthesized weight).
  const family = Platform.select({ ios: undefined, default: INTER_BY_WEIGHT[weight] });
  return { fontSize, lineHeight, fontFamily: family, fontWeight: family ? undefined : weight };
}

/** Type scale (size / lineHeight / weight) from 07_TYPOGRAPHY. Sentence case, never uppercase. */
export const typography = {
  displayLarge: typ(40, 46, '700'),
  displayMedium: typ(34, 40, '700'),
  h1: typ(30, 36, '600'),
  h2: typ(24, 30, '600'),
  h3: typ(20, 26, '500'),
  bodyLarge: typ(17, 26, '400'),
  body: typ(16, 24, '400'),
  small: typ(14, 20, '400'),
  caption: typ(12, 16, '400'),
  button: typ(17, 22, '600'),
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;

/** Motion — durations (ms) and easings. Never exceed 600ms; standard UI target <=300ms. */
export const motion = {
  duration: {
    instant: 50,
    tap: 120,
    release: 180,
    cardExpand: 250,
    screen: 300,
    modal: 260,
    sheet: 300,
    toast: 220,
    success: 450,
    max: 600,
  },
  easing: {
    standard: Easing.out(Easing.cubic),
    entrance: Easing.out(Easing.cubic),
    exit: Easing.in(Easing.cubic),
  },
  scalePressed: 0.97,
} as const;

/** Warm-tinted shadows only. Opacity 6–12%, soft large blur. Never black. */
export const shadows = {
  sm: {
    shadowColor: '#6D4C41',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  md: {
    shadowColor: '#6D4C41',
    shadowOpacity: 0.09,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  lg: {
    shadowColor: '#6D4C41',
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;
