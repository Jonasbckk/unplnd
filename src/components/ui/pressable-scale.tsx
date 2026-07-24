import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export interface PressableScaleProps {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  /** Which haptic fires on press. 'selection' for choices, 'light' for navigation. */
  feedback?: 'selection' | 'light' | 'none';
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'radio' | 'checkbox';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
  hitSlop?: number;
  /**
   * Guarantee a 44×44pt target by growing the INNER pressable (icon stays centred).
   * Use for bare icons: hitSlop alone dies at the wrapper's bounds — the content-sized
   * Animated.View clips hit-testing on both platforms under Fabric, so a slop ring
   * around a 24px glyph is unreachable. Padding inside the wrapper is not.
   */
  hitTarget?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The one press feel for everything tappable that isn't a Button or Card: scale to 0.97 over the
 * tap duration, back over release (09_ANIMATIONS), plus a haptic. Before this primitive existed,
 * half the app's touches gave no response at all — the audit's biggest systemic finding.
 */
export function PressableScale({
  children,
  onPress,
  onLongPress,
  disabled = false,
  feedback = 'light',
  accessibilityLabel,
  accessibilityRole = 'button',
  accessibilityState,
  hitSlop,
  hitTarget = false,
  style,
}: PressableScaleProps) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to: number, duration: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration,
      easing: t.motion.easing.standard,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        disabled={disabled}
        hitSlop={hitSlop}
        style={hitTarget ? { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' } : undefined}
        onPressIn={() => animate(t.motion.scalePressed, t.motion.duration.tap)}
        onPressOut={() => animate(1, t.motion.duration.release)}
        onPress={() => {
          if (feedback === 'selection') haptics.selection();
          else if (feedback === 'light') haptics.light();
          onPress?.();
        }}
        onLongPress={onLongPress}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
