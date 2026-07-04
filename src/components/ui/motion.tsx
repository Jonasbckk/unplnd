import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

interface FadeInUpProps {
  children: ReactNode;
  /** Stagger position — delay becomes index * step. */
  index?: number;
  /** Extra delay in ms on top of the index stagger. */
  delay?: number;
  /** Per-index stagger step (ms). */
  step?: number;
  /** How far it travels up while fading in (px). */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Entrance animation — content fades + rises into place on mount, with a staggered
 * rhythm via `index`. Respects Reduce Motion (renders instantly). The app's default
 * way to make screens feel alive without touching the locked brand (09_ANIMATIONS).
 */
export function FadeInUp({ children, index = 0, delay = 0, step = 55, distance = 14, style }: FadeInUpProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    // Cap the stagger so long lists don't leave the last items lagging in late.
    progress.value = withDelay(
      delay + Math.min(index, 8) * step,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }),
    );
  }, [reduced, delay, index, step, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
