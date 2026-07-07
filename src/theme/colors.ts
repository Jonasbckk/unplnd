/**
 * UNPLND color system — warm, premium, never harsh.
 * Source of truth: docs/06_COLORS.md (+ docs/_synthesis/01_brand_design_dna.md).
 * Rule: never pure black, warm-tinted shadows, dark mode is a custom warm palette (not inverted).
 */

export const lightColors = {
  // Brand
  primary: '#C97B63', // Terracotta — main CTAs, active states, selected tabs
  primaryPressed: '#B96A52',
  onPrimary: '#FFFFFF',

  // Surfaces
  background: '#F9F4EF', // Warm Cream — primary background
  surface: '#FFFDFC', // Warm White — floating cards, sheets, dialogs
  surfaceSecondary: '#E7D3C8', // Soft Beige — sections, empty states
  card: '#FFFFFF',

  // Text
  textPrimary: '#3A2F2A', // body text (never pure black)
  textSecondary: '#766C65',
  textHeading: '#6D4C41', // Coffee Brown — headings & nav labels
  textOnPrimary: '#FFFFFF',

  // Lines
  border: '#ECE5DE',
  divider: '#ECE5DE',

  // Accents (limited use)
  accentOrange: '#E88C5A', // Sunset Orange — highlights, popular
  accentOlive: '#7A8F63', // nature, parks, outdoor
  accentOcean: '#6D9DC5', // water, beach, travel

  // Semantic
  success: '#6FAE75',
  warning: '#F2B84B',
  error: '#D96C6C', // never aggressive red
  info: '#7AAEDB',

  // Utility
  overlay: 'rgba(45, 32, 26, 0.45)', // warm scrim
  skeleton: '#ECE5DE',
  tabBar: '#FFFDFC',
  tabBarBorder: '#ECE5DE',
} as const;

export type ColorTokens = { [K in keyof typeof lightColors]: string };
export type ColorToken = keyof typeof lightColors;

/**
 * Dark = the star (founder redesign 2026-07-07): deep neutral-warm gray, elevated gray
 * cards, and a more vivid brand orange that glows on the dark ground. Still warm-tinted,
 * never pure black.
 */
export const darkColors: ColorTokens = {
  primary: '#E0794E',
  primaryPressed: '#C9663F',
  onPrimary: '#FFFFFF',

  background: '#131110',
  surface: '#1C1917',
  surfaceSecondary: '#292420',
  card: '#211D1A',

  textPrimary: '#F8F3EF',
  textSecondary: '#B8ADA5',
  textHeading: '#F8F3EF',
  textOnPrimary: '#FFFFFF',

  border: '#38322D',
  divider: '#38322D',

  accentOrange: '#F09B60',
  accentOlive: '#8FA678',
  accentOcean: '#7FABD0',

  success: '#6FAE75',
  warning: '#F2B84B',
  error: '#D96C6C',
  info: '#7AAEDB',

  overlay: 'rgba(0, 0, 0, 0.6)',
  skeleton: '#292420',
  tabBar: '#191614',
  tabBarBorder: '#2C2723',
};
