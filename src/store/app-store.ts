import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemePreference = 'light' | 'dark' | 'system';
export type LanguagePreference = 'de' | 'en' | 'system';

export interface NotificationPrefs {
  eveningReminders: boolean;
  albumReady: boolean;
  weatherChanges: boolean;
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
      notificationPrefs: { eveningReminders: true, albumReady: true, weatherChanges: true },
      hasHydrated: false,
      completeOnboarding: () => set({ hasOnboarded: true }),
      resetOnboarding: () => set({ hasOnboarded: false }),
      setThemePreference: (preference) => set({ themePreference: preference }),
      setLanguagePreference: (preference) => set({ languagePreference: preference }),
      setAppThemeId: (id) => set({ appThemeId: id }),
      setShowVerifyBadge: (value) => set({ showVerifyBadge: value }),
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
        notificationPrefs: state.notificationPrefs,
      }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
);
