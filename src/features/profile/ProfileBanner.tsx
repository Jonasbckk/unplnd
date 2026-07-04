import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';
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
import type { ProfileStyle } from './profile-styles';

/** A gradient cover banner behind the profile header. Premium styles add a slow light sweep. */
export function ProfileBanner({ style, children }: { style: ProfileStyle; children: ReactNode }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const progress = useSharedValue(0);
  const animate = style.animated && !reduced;

  useEffect(() => {
    if (animate) {
      progress.value = withRepeat(
        withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      progress.value = 0;
    }
  }, [animate, style.id, progress]);

  const sheenStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-width * 0.55, width * 0.55]) }],
  }));

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{
        borderRadius: t.radius.card,
        overflow: 'hidden',
        padding: t.spacing.lg,
      }}
    >
      <LinearGradient
        colors={style.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {animate && width > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, bottom: 0, width: width * 0.5 }, sheenStyle]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
      {children}
    </View>
  );
}
