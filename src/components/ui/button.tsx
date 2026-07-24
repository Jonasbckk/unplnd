import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, type ComponentProps } from 'react';
import { ActivityIndicator, Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { Text } from './text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface ButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
  /** Brand gradient fill (accentOrange → primary) — the hero CTA look. Primary only. */
  gradient?: boolean;
  /** Optional icon on the right of the label (e.g. "arrow-forward"). */
  iconRight?: IoniconName;
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
  gradient = false,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
}: ButtonProps) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isPrimary = variant === 'primary';
  const useGradient = gradient && isPrimary;

  const animate = (to: number, duration: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration,
      easing: t.motion.easing.standard,
      useNativeDriver: true,
    }).start();

  return (
    // Shadow lives OUT here: iOS suppresses layer shadows under overflow:'hidden', so putting it on
    // the clipping Pressable rendered every primary CTA flat on the one mandatory platform. The
    // wrapper needs its own radius + an opaque background for the iOS shadow path.
    <Animated.View
      style={[
        { transform: [{ scale }] },
        fullWidth && { alignSelf: 'stretch' },
        isPrimary && {
          borderRadius: t.radius.button,
          backgroundColor: t.colors.primary,
        },
        isPrimary && !disabled && t.shadows.sm,
      ]}
    >
      <Pressable
        disabled={disabled || loading}
        onPressIn={() => animate(t.motion.scalePressed, t.motion.duration.tap)}
        onPressOut={() => animate(1, t.motion.duration.release)}
        onPress={() => {
          if (isPrimary) haptics.primary();
          else haptics.light();
          onPress?.();
        }}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
        style={({ pressed }) => [
          {
            height: isPrimary ? 56 : 52,
            borderRadius: isPrimary ? t.radius.button : t.radius.buttonSecondary,
            backgroundColor: useGradient
              ? 'transparent'
              : isPrimary
                ? pressed
                  ? t.colors.primaryPressed
                  : t.colors.primary
                : pressed
                  ? t.colors.surfaceSecondary
                  : 'transparent',
            borderWidth: isPrimary ? 0 : 1.5,
            borderColor: isPrimary ? 'transparent' : t.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: t.spacing.lg,
            opacity: disabled ? 0.5 : 1,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        {({ pressed }) => (
          <>
        {useGradient && (
          <LinearGradient
            colors={[t.colors.accentOrange, t.colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />
        )}
        {useGradient && pressed && (
          // The gradient can't swap to primaryPressed — darken it instead.
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.08)' }} />
        )}
        {loading ? (
          <ActivityIndicator color={isPrimary ? t.colors.onPrimary : t.colors.primary} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <Text variant="button" color={isPrimary ? 'onPrimary' : 'textPrimary'}>
              {title}
            </Text>
            {iconRight ? (
              <Ionicons name={iconRight} size={19} color={isPrimary ? t.colors.onPrimary : t.colors.textPrimary} />
            ) : null}
          </View>
        )}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}
