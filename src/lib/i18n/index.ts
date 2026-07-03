import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';
import { useMemo } from 'react';

import { useAppStore, type LanguagePreference } from '@/store/app-store';
import { de } from './de';
import { en } from './en';

export const i18n = new I18n({ de, en });
i18n.enableFallback = true;
// German-first release (41_APP_STORE: soft launch DE/CH/AT) — English keys fill any gaps.
i18n.defaultLocale = 'de';
i18n.locale = 'de';

export type AppLocale = 'de' | 'en';

function systemLocale(): AppLocale {
  const code = getLocales()[0]?.languageCode;
  return code === 'en' ? 'en' : 'de';
}

export function resolveLocale(preference: LanguagePreference): AppLocale {
  if (preference === 'de' || preference === 'en') return preference;
  return systemLocale();
}

/** Current locale + bound translate function; re-renders when the language setting changes. */
export function useT() {
  const preference = useAppStore((s) => s.languagePreference);
  return useMemo(() => {
    const locale = resolveLocale(preference);
    i18n.locale = locale;
    const t = i18n.t.bind(i18n) as typeof i18n.t;
    return { t, locale };
  }, [preference]);
}

/** Localized label for a canonical planner/category value (stored values stay English). */
export function optionLabel(value: string): string {
  return i18n.t(`planner.options.${value}`, { defaultValue: value });
}

/** Date-format locale for the active language. */
export function dateLocale(): string {
  return i18n.locale === 'de' ? 'de-DE' : 'en-US';
}
