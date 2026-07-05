import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

const COLORS = ['#C97B63', '#E8B24C', '#4C9BE8', '#6FA07C', '#C56B9E', '#48C4D3'];

function Piece({ x, color, delay, drift, height }: { x: number; color: string; delay: number; drift: number; height: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 1700, easing: Easing.out(Easing.quad) }));
  }, [p, delay]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value > 0.82 ? 1 - (p.value - 0.82) * 5.5 : 1,
    transform: [
      { translateX: x + drift * p.value },
      { translateY: -20 + p.value * (height + 40) },
      { rotate: `${p.value * 720}deg` },
    ],
  }));
  return (
    <Animated.View
      style={[{ position: 'absolute', top: 0, left: 0, width: 8, height: 13, borderRadius: 2, backgroundColor: color }, style]}
    />
  );
}

/** A quick one-shot confetti burst (falls once, then fades). Sits behind celebration cards. */
export function Confetti({ count = 28 }: { count?: number }) {
  const { width, height } = useWindowDimensions();
  const pieces = Array.from({ length: count }, (_, i) => ({
    x: Math.random() * width,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 320,
    drift: (Math.random() - 0.5) * 130,
  }));
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
      {pieces.map((pc, i) => (
        <Piece key={i} x={pc.x} color={pc.color} delay={pc.delay} drift={pc.drift} height={height} />
      ))}
    </View>
  );
}
