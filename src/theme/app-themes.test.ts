import { shade } from '@/utils/color';

import { applyAppTheme, APP_THEMES, DEFAULT_THEME_ID } from './app-themes';
import { lightColors } from './colors';

describe('applyAppTheme', () => {
  it('returns the base palette unchanged for the default theme', () => {
    expect(applyAppTheme(lightColors, DEFAULT_THEME_ID)).toBe(lightColors);
  });

  it('overrides primary + primaryPressed for a non-default theme, keeping surfaces', () => {
    const ocean = APP_THEMES.find((t) => t.id === 'ocean')!;
    const out = applyAppTheme(lightColors, ocean.id);
    expect(out.primary).toBe(ocean.primary);
    expect(out.primaryPressed).toBe(shade(ocean.primary, -0.12));
    expect(out.background).toBe(lightColors.background);
  });

  it('falls back to the base palette for an unknown id', () => {
    expect(applyAppTheme(lightColors, 'does-not-exist')).toBe(lightColors);
  });

  it('has a default theme flagged as tier "default"', () => {
    const def = APP_THEMES.find((t) => t.id === DEFAULT_THEME_ID);
    expect(def?.tier).toBe('default');
  });
});
