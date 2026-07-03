import { useRef } from 'react';
import { ActivityIndicator, Animated, Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { Text } from './text';

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Primary / secondary button. One primary per screen (Component Library rule).
 * Press = scale 0.97 over 120ms, release 180ms (09_ANIMATIONS).
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';

  const animate = (to: number, duration: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration,
      easing: t.motion.easing.standard,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={[{ transform: [{ scale }] }, fullWidth && { alignSelf: 'stretch' }]}>
      <Pressable
        onPressIn={() => animate(t.motion.scalePressed, t.motion.duration.tap)}
        onPressOut={() => animate(1, t.motion.duration.release)}
        onPress={
          disabled || loading
            ? undefined
            : () => {
                if (isPrimary) haptics.primary();
                else haptics.light();
                onPress?.();
              }
        }
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={[
          {
            height: isPrimary ? 56 : 52,
            borderRadius: isPrimary ? t.radius.button : t.radius.buttonSecondary,
            backgroundColor: isPrimary ? t.colors.primary : 'transparent',
            borderWidth: isPrimary ? 0 : 1.5,
            borderColor: isPrimary ? 'transparent' : t.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.lg,
            opacity: disabled ? 0.5 : 1,
          },
          isPrimary && t.shadows.sm,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={isPrimary ? t.colors.onPrimary : t.colors.primary} />
        ) : (
          <Text variant="button" color={isPrimary ? 'onPrimary' : 'textPrimary'}>
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}
