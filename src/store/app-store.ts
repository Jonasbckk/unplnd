import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { track } from '@/lib/analytics';

export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'de' | 'en' | 'system';

export interface NotificationPrefs {
  eveningReminders: boolean;
  albumReady: boolean;
  weatherChanges: boolean;
  streakReminders: boolean;
}

export type UpsellKind = 'appOpen' | 'settingsOpen' | 'styleChange';

interface UpsellState {
  appOpen: number;
  settingsOpen: number;
  styleChange: number;
  /** Last time the paywall auto-opened — cooldown so two triggers never stack. */
  lastShownAt: number;
}

/** Cadence per trigger: every Nth event opens the paywall (founder decision 2026-07-07). */
const UPSELL_EVERY: Record<UpsellKind, number> = { appOpen: 2, settingsOpen: 3, styleChange: 3 };
const UPSELL_COOLDOWN_MS = 3 * 60 * 1000;

interface AppState {
  /** Whether the user has finished onboarding. Persisted. */
  hasOnboarded: boolean;
  /** Light / dark / follow-system. Persisted. */
  themePreference: ThemePreference;
  /** App language (23_SETTINGS: System / Deutsch / English). Persisted. */
  languagePreference: LanguagePreference;
  /** App colour theme id (recolours the brand `primary`). See theme/app-themes. Persisted. */
  appThemeId: string;
  /** Whether to show the verification badge on your profile. Persisted. */
  showVerifyBadge: boolean;
  /** Share live location with connections (Memory Map). OPT-IN — defaults to off. Persisted. */
  shareLiveLocation: boolean;
  /** Local date (YYYY-M-D) the streak was last celebrated — so we celebrate once per day. Persisted. */
  lastStreakCelebrationDate: string | null;
  /** Highest verification tier the user has already been congratulated for. Persisted. */
  lastSeenTier: number;
  /** Notification preferences. Persisted. */
  notificationPrefs: NotificationPrefs;
  /** Premium upsell counters + cooldown. Persisted. */
  upsell: UpsellState;
  /**
   * The one-time disclosure that plans and concierge replies are AI-generated has been
   * acknowledged (EU AI Act Art. 50 — legal duty, overrides the docs' "never mention AI"). Persisted.
   */
  aiNoticeSeen: boolean;
  /**
   * Counts an upsell event and answers "show the paywall now?" — true on every Nth
   * occurrence of that trigger, unless another upsell fired within the cooldown.
   * Premium users must be filtered by the CALLER (this store knows nothing about purchases).
   */
  registerUpsellEvent: (kind: UpsellKind) => boolean;
  /** True once the persisted state has been read from storage. */
  hasHydrated: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
  setAppThemeId: (id: string) => void;
  setShowVerifyBadge: (value: boolean) => void;
  setShareLiveLocation: (value: boolean) => void;
  setLastStreakCelebrationDate: (date: string) => void;
  setLastSeenTier: (level: number) => void;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
  acknowledgeAiNotice: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      themePreference: 'system',
      languagePreference: 'system',
      appThemeId: 'terracotta',
      showVerifyBadge: true,
      shareLiveLocation: false,
      lastStreakCelebrationDate: null,
      lastSeenTier: 0,
      notificationPrefs: { eveningReminders: true, albumReady: true, weatherChanges: true, streakReminders: true },
      upsell: { appOpen: 0, settingsOpen: 0, styleChange: 0, lastShownAt: 0 },
      aiNoticeSeen: false,
      registerUpsellEvent: (kind) => {
        let show = false;
        set((s) => {
          const count = s.upsell[kind] + 1;
          const due = count % UPSELL_EVERY[kind] === 0;
          const coolDown = Date.now() - s.upsell.lastShownAt < UPSELL_COOLDOWN_MS;
          show = due && !coolDown;
          return {
            upsell: { ...s.upsell, [kind]: count, lastShownAt: show ? Date.now() : s.upsell.lastShownAt },
          };
        });
        if (show) track('paywall_auto_shown', { trigger: kind });
        return show;
      },
      hasHydrated: false,
      completeOnboarding: () => {
        set({ hasOnboarded: true });
        track('onboarding_completed');
      },
      resetOnboarding: () => set({ hasOnboarded: false }),
      setThemePreference: (preference) => set({ themePreference: preference }),
      setLanguagePreference: (preference) => set({ languagePreference: preference }),
      setAppThemeId: (id) => set({ appThemeId: id }),
      setShowVerifyBadge: (value) => set({ showVerifyBadge: value }),
      setShareLiveLocation: (value) => set({ shareLiveLocation: value }),
      setLastStreakCelebrationDate: (date) => set({ lastStreakCelebrationDate: date }),
      setLastSeenTier: (level) => set({ lastSeenTier: level }),
      setNotificationPref: (key, value) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      acknowledgeAiNotice: () => {
        set({ aiNoticeSeen: true });
        track('ai_notice_acknowledged');
      },
    }),
    {
      name: 'unplnd-app',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasOnboarded: state.hasOnboarded,
        themePreference: state.themePreference,
        languagePreference: state.languagePreference,
        appThemeId: state.appThemeId,
        showVerifyBadge: state.showVerifyBadge,
        shareLiveLocation: state.shareLiveLocation,
        lastStreakCelebrationDate: state.lastStreakCelebrationDate,
        lastSeenTier: state.lastSeenTier,
        notificationPrefs: state.notificationPrefs,
        upsell: state.upsell,
        aiNoticeSeen: state.aiNoticeSeen,
      }),
      // Deep-merge persisted prefs onto current defaults, so newly-added keys (e.g. a new
      // notification pref) get their default instead of being dropped by the flat overwrite.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          notificationPrefs: { ...current.notificationPrefs, ...(p.notificationPrefs ?? {}) },
          upsell: { ...current.upsell, ...(p.upsell ?? {}) },
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
