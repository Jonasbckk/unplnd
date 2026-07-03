/**
 * UNPLND ThemeProvider — resolves the user's theme preference (light/dark/system)
 * into a single theme object. Every screen supports dark mode (Constitution Rule 8).
 */
import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { useAppStore } from '@/store/app-store';
import { darkColors, lightColors, type ColorTokens } from './colors';
import { motion, radius, shadows, spacing, typography } from './tokens';

export interface Theme {
  scheme: 'light' | 'dark';
  colors: ColorTokens;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
  shadows: typeof shadows;
}

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const preference = useAppStore((s) => s.themePreference);
  const scheme: 'light' | 'dark' =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  const theme = useMemo<Theme>(
    () => ({
      scheme,
      colors: scheme === 'dark' ? darkColors : lightColors,
      spacing,
      radius,
      typography,
      motion,
      shadows,
    }),
    [scheme],
  );

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return theme;
}
