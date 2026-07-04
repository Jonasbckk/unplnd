import { useRef, type ReactNode } from 'react';
import { Animated, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padded?: boolean;
  /** Hero cards sit higher — a deeper, warmer shadow for more premium depth. */
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Warm surface card — radius 28, padding 24, soft warm shadow (08_COMPONENTS). */
export function Card({ children, onPress, padded = true, elevated = false, style }: CardProps) {
  const t = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const cardStyle: StyleProp<ViewStyle> = [
    {
      backgroundColor: t.colors.card,
      borderRadius: t.radius.card,
      padding: padded ? t.spacing.lg : 0,
    },
    elevated ? t.shadows.md : t.shadows.sm,
    style,
  ];

  if (!onPress) {
    return <View style={cardStyle}>{children}</View>;
  }

  const animate = (to: number, duration: number) =>
    Animated.timing(scale, {
      toValue: to,
      duration,
      easing: t.motion.easing.standard,
      useNativeDriver: true,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPressIn={() => animate(t.motion.scalePressed, t.motion.duration.tap)}
        onPressOut={() => animate(1, t.motion.duration.release)}
        onPress={onPress}
        style={cardStyle}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
