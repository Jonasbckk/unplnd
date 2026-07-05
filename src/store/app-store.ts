import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'de' | 'en' | 'system';

export interface NotificationPrefs {
  eveningReminders: boolean;
  albumReady: boolean;
  weatherChanges: boolean;
  streakReminders: boolean;
}

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
  /** Local date (YYYY-M-D) the streak was last celebrated — so we celebrate once per day. Persisted. */
  lastStreakCelebrationDate: string | null;
  /** Highest verification tier the user has already been congratulated for. Persisted. */
  lastSeenTier: number;
  /** Notification preferences. Persisted. */
  notificationPrefs: NotificationPrefs;
  /** True once the persisted state has been read from storage. */
  hasHydrated: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  setLanguagePreference: (preference: LanguagePreference) => void;
  setAppThemeId: (id: string) => void;
  setShowVerifyBadge: (value: boolean) => void;
  setLastStreakCelebrationDate: (date: string) => void;
  setLastSeenTier: (level: number) => void;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hasOnboarded: false,
      themePreference: 'system',
      languagePreference: 'system',
      appThemeId: 'terracotta',
      showVerifyBadge: true,
      lastStreakCelebrationDate: null,
      lastSeenTier: 0,
      notificationPrefs: { eveningReminders: true, albumReady: true, weatherChanges: true, streakReminders: true },
      hasHydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      resetOnboarding: () => set({ hasOnboarded: false }),
      setThemePreference: (preference) => set({ themePreference: preference }),
      setLanguagePreference: (preference) => set({ languagePreference: preference }),
      setAppThemeId: (id) => set({ appThemeId: id }),
      setShowVerifyBadge: (value) => set({ showVerifyBadge: value }),
      setLastStreakCelebrationDate: (date) => set({ lastStreakCelebrationDate: date }),
      setLastSeenTier: (level) => set({ lastSeenTier: level }),
      setNotificationPref: (key, value) =>
        set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),
      setHasHydrated: (value) => set({ hasHydrated: value }),
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
        lastStreakCelebrationDate: state.lastStreakCelebrationDate,
        lastSeenTier: state.lastSeenTier,
        notificationPrefs: state.notificationPrefs,
      }),
      // Deep-merge persisted prefs onto current defaults, so newly-added keys (e.g. a new
      // notification pref) get their default instead of being dropped by the flat overwrite.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<AppState>;
        return {
          ...current,
          ...p,
          notificationPrefs: { ...current.notificationPrefs, ...(p.notificationPrefs ?? {}) },
        };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
