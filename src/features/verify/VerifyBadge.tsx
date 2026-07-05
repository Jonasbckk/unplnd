import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { shade } from '@/utils/color';

interface VerifyBadgeProps {
  color: string;
  size?: number;
  /** Loop a soft glow behind the seal (the "krasseste" touch). Off for locked/lower tiers. */
  animated?: boolean;
  locked?: boolean;
}

const BUMPS = 12;

/** A scalloped verification seal (react-native-svg) with a checkmark and an optional glow loop. */
export function VerifyBadge({ color, size = 120, animated = true, locked = false }: VerifyBadgeProps) {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (!animated || reduced || locked) return;
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [animated, reduced, locked, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.14 + pulse.value * 0.3,
    transform: [{ scale: 1 + pulse.value * 0.12 }],
  }));

  const c = size / 2;
  const mainR = size * 0.33;
  const bumpR = size * 0.095;
  const fill = locked ? '#8C8C8C' : color;
  const gradId = `seal${(locked ? 'lock' : color).replace(/[^a-zA-Z0-9]/g, '')}`;
  const bumps = Array.from({ length: BUMPS }, (_, i) => {
    const a = (i / BUMPS) * Math.PI * 2;
    return { x: c + Math.cos(a) * mainR, y: c + Math.sin(a) * mainR };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {!locked && animated ? (
        <Animated.View
          style={[
            { position: 'absolute', width: size * 0.92, height: size * 0.92, borderRadius: size, backgroundColor: color },
            glowStyle,
          ]}
        />
      ) : null}

      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={shade(fill, 0.18)} />
            <Stop offset="1" stopColor={shade(fill, -0.22)} />
          </LinearGradient>
        </Defs>
        {bumps.map((b, i) => (
          <Circle key={i} cx={b.x} cy={b.y} r={bumpR} fill={`url(#${gradId})`} />
        ))}
        <Circle cx={c} cy={c} r={mainR + bumpR * 0.25} fill={`url(#${gradId})`} />
      </Svg>

      <View style={{ position: 'absolute' }}>
        <Ionicons name={locked ? 'lock-closed' : 'checkmark'} size={size * 0.4} color="#FFFFFF" />
      </View>
    </View>
  );
}
