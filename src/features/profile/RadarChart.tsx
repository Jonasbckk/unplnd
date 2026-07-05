import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Line, Polygon } from 'react-native-svg';

import { optionIcon } from '@/features/planner/optionIcons';
import { useTheme } from '@/theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

export interface RadarTrait {
  mood: string;
  pct: number;
}

/**
 * Your "Evening DNA" as a radar — one axis per mood, the shape drawn from real evenings.
 * The polygon grows out from the centre on appear (respects Reduce Motion). The dominant
 * mood sits at the top; each vertex carries its mood icon.
 */
export function RadarChart({
  traits,
  accent,
  size = 240,
}: {
  traits: RadarTrait[];
  accent: string;
  size?: number;
}) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (!reduced) {
      progress.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [reduced, progress, traits.length]);

  const n = traits.length;
  const cx = size / 2;
  const cy = size / 2;
  const R = size / 2 - 34;
  const maxPct = Math.max(...traits.map((tr) => tr.pct), 1);

  // Per-axis unit vector + target (data) radius + rim point — precomputed for the worklet.
  const axes = traits.map((trait, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    return {
      ux,
      uy,
      dataR: R * (trait.pct / maxPct),
      rimX: cx + ux * R,
      rimY: cy + uy * R,
      mood: trait.mood,
    };
  });

  const animatedProps = useAnimatedProps(() => {
    const pts = axes
      .map((a) => `${cx + a.ux * a.dataR * progress.value},${cy + a.uy * a.dataR * progress.value}`)
      .join(' ');
    return { points: pts };
  });

  const rings = [0.34, 0.67, 1];
  const chip = 30;

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        {rings.map((k, ri) => (
          <Polygon
            key={ri}
            points={axes.map((a) => `${cx + a.ux * R * k},${cy + a.uy * R * k}`).join(' ')}
            fill="none"
            stroke={t.colors.border}
            strokeWidth={1}
          />
        ))}
        {axes.map((a, i) => (
          <Line key={i} x1={cx} y1={cy} x2={a.rimX} y2={a.rimY} stroke={t.colors.border} strokeWidth={1} />
        ))}
        <AnimatedPolygon
          animatedProps={animatedProps}
          fill={accent + '2E'}
          stroke={accent}
          strokeWidth={2}
          strokeLinejoin="round"
        />
      </Svg>
      {axes.map((a, i) => {
        const dominant = i === 0;
        return (
          <Animated.View
            key={a.mood}
            entering={reduced ? undefined : FadeIn.duration(400).delay(220 + i * 60)}
            style={{
              position: 'absolute',
              left: a.rimX - chip / 2,
              top: a.rimY - chip / 2,
              width: chip,
              height: chip,
              borderRadius: chip / 2,
              backgroundColor: dominant ? accent : t.colors.surface,
              borderWidth: 1,
              borderColor: dominant ? accent : t.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={optionIcon(a.mood)} size={16} color={dominant ? '#FFFFFF' : accent} />
          </Animated.View>
        );
      })}
    </View>
  );
}
