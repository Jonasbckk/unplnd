import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTheme } from '@/theme';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}

/** Shimmering placeholder for loading content — premium alternative to a spinner. Reduce-Motion safe. */
export function Skeleton({ width = '100%', height = 16, radius, style }: SkeletonProps) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [measured, setMeasured] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [reduced, progress]);

  const sheen = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-measured, measured]) }],
  }));

  return (
    <View
      onLayout={(e) => setMeasured(e.nativeEvent.layout.width)}
      style={[
        { width, height, borderRadius: radius ?? t.radius.sm, backgroundColor: t.colors.skeleton, overflow: 'hidden' },
        style,
      ]}
    >
      {!reduced && measured > 0 && (
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: measured }, sheen]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}
