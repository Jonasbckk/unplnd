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
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { NetworkBanner, Toast } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { useAppStore } from '@/store/app-store';
import { useConnectivityStore } from '@/store/connectivity-store';
import { ThemeProvider } from '@/theme';

SplashScreen.preventAutoHideAsync();

// Gate: onboarding → auth → app.
function RootNavigator() {
  const hasOnboarded = useAppStore((s) => s.hasOnboarded);
  const session = useAuthStore((s) => s.session);

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
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
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootNavigator />
          <NetworkBanner />
          <Toast />
          <StatusBar style="auto" />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
