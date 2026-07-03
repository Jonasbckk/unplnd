import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/lib/i18n';
import { useConnectivityStore } from '@/store/connectivity-store';
import { useTheme } from '@/theme';
import { Text } from './text';

/** Global, gentle "you're offline" banner (12_IA global overlays; DoD offline behavior). */
export function NetworkBanner() {
  const t = useTheme();
  const { t: tr } = useT();
  const insets = useSafeAreaInsets();
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const reduced = useReducedMotion();

  if (isOnline) return null;

  return (
    <Animated.View
      entering={reduced ? undefined : FadeInUp.duration(260)}
      exiting={reduced ? undefined : FadeOutUp.duration(220)}
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        paddingTop: insets.top + 6,
        paddingBottom: 10,
        paddingHorizontal: t.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: t.colors.textHeading,
      }}
    >
      <Ionicons name="cloud-offline-outline" size={15} color="#FFFFFF" />
      <Text variant="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
        {tr('common.offline')}
      </Text>
    </Animated.View>
  );
}
