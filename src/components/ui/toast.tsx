import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useToastStore } from '@/store/toast-store';
import { useTheme } from '@/theme';
import { Text } from './text';

/** Global toast — a brief confirmation near the bottom, auto-dismissing (12_IA global overlays). */
export function Toast() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const message = useToastStore((s) => s.message);
  const reduced = useReducedMotion();

  if (!message) return null;

  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.duration(240)}
      exiting={reduced ? undefined : FadeOutDown.duration(220)}
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: insets.bottom + 28,
        alignItems: 'center',
        paddingHorizontal: t.spacing.lg,
        zIndex: 1000,
      }}
    >
      <View
        style={[
          {
            // Fixed warm-dark pill so it stays readable (white text) in BOTH light and dark mode.
            backgroundColor: '#2E241E',
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
            borderRadius: t.radius.pill,
            maxWidth: '100%',
          },
          t.shadows.md,
        ]}
      >
        <Text variant="small" style={{ color: '#FFFFFF', fontWeight: '600' }} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
