import '@/global.css';

import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NetworkBanner, Toast } from '@/components/ui';
import { CelebrationOverlay } from '@/features/celebrate/CelebrationOverlay';
import { useCelebrateStore } from '@/features/celebrate/celebrate-store';
import { recordActivity } from '@/lib/activity';
import { useAuthStore } from '@/features/auth/auth-store';
import { useAppStore } from '@/store/app-store';
import { useConnectivityStore } from '@/store/connectivity-store';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Gate: onboarding → auth → app.
function RootNavigator() {
  const t = useTheme();
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const session = useAuthStore((s) => s.session);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        // Match the theme so screen transitions never flash a white default background.
        contentStyle: { backgroundColor: t.colors.background },
      }}
    >
      <Stack.Protected guard={!hasOnboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded && !session}>
        <Stack.Screen name="auth" />
      </Stack.Protected>
      <Stack.Protected guard={hasOnboarded && !!session}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const hasHydrated = useAppStore((s) => s.hasHydrated);
  const authInitialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    const unsubscribe = useAuthStore.getState().init();
    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = useConnectivityStore.getState().init();
    return unsubscribe;
  }, []);

  const ready = (fontsLoaded || !!fontError) && hasHydrated && authInitialized;

  useEffect(() => {
    if (!ready) return;
    SplashScreen.hideAsync();
    // Count today's visit toward the daily-use streak, then celebrate it once per day.
    void (async () => {
      const streak = await recordActivity();
      if (streak <= 0) return;
      const now = new Date();
      const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
      const { lastStreakCelebrationDate, setLastStreakCelebrationDate } = useAppStore.getState();
      if (lastStreakCelebrationDate !== today) {
        setLastStreakCelebrationDate(today);
        useCelebrateStore.getState().showStreak(streak);
      }
    })();
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/** A themed background wraps everything, so screen transitions never flash the window color. */
function AppShell() {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <RootNavigator />
      <NetworkBanner />
      <Toast />
      <CelebrationOverlay />
      <StatusBar style="auto" />
    </View>
  );
}
