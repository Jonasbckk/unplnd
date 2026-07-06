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
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Line, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { optionIcon } from '@/features/planner/optionIcons';
import { useTheme } from '@/theme';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface RadarTrait {
  mood: string;
  pct: number;
}

interface Axis {
  ux: number;
  uy: number;
  dataR: number;
  rimX: number;
  rimY: number;
  mood: string;
}

/** A data-vertex dot that rides the polygon's grow-in animation. */
function VertexDot({
  axis,
  cx,
  cy,
  progress,
  accent,
  halo,
}: {
  axis: Axis;
  cx: number;
  cy: number;
  progress: SharedValue<number>;
  accent: string;
  halo: string;
}) {
  const animatedProps = useAnimatedProps(() => ({
    cx: cx + axis.ux * axis.dataR * progress.value,
    cy: cy + axis.uy * axis.dataR * progress.value,
    opacity: progress.value,
  }));
  return <AnimatedCircle animatedProps={animatedProps} r={4.5} fill={accent} stroke={halo} strokeWidth={2} />;
}

/**
 * Your "Evening DNA" as a radar — one axis per mood, the shape drawn from real evenings.
 * The polygon grows out from the centre with its vertex dots riding along (Reduce Motion →
 * static). The dominant mood sits at the top; each vertex carries its mood icon. The canvas
 * height hugs the actual shape, so a 3-mood triangle doesn't leave dead space below.
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
      progress.value = 0;
      progress.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) });
    } else {
      progress.value = 1;
    }
  }, [reduced, progress, traits.length]);

  const n = traits.length;
  const chip = 30;
  const pad = 4;
  const cx = size / 2;
  const R = size / 2 - 34;
  const maxPct = Math.max(...traits.map((tr) => tr.pct), 1);

  // Unit vectors first — they define the shape's real bounding box, so the SVG height
  // can hug the polygon (an upward triangle only needs ~70% of the square).
  const units = traits.map((_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return { ux: Math.cos(angle), uy: Math.sin(angle) };
  });
  const minUy = Math.min(...units.map((u) => u.uy), 0);
  const maxUy = Math.max(...units.map((u) => u.uy), 0);
  const cy = chip / 2 + pad + R * Math.abs(minUy);
  const height = cy + R * maxUy + chip / 2 + pad;

  const axes: Axis[] = traits.map((trait, i) => ({
    ...units[i],
    dataR: R * (trait.pct / maxPct),
    rimX: cx + units[i].ux * R,
    rimY: cy + units[i].uy * R,
    mood: trait.mood,
  }));

  const animatedProps = useAnimatedProps(() => {
    const pts = axes
      .map((a) => `${cx + a.ux * a.dataR * progress.value},${cy + a.uy * a.dataR * progress.value}`)
      .join(' ');
    return { points: pts };
  });

  const grid = t.colors.textSecondary;
  const rings = [0.34, 0.67];

  return (
    <View style={{ width: size, height, alignSelf: 'center' }}>
      <Svg width={size} height={height}>
        <Defs>
          <LinearGradient id="dnaFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={accent} stopOpacity={0.42} />
            <Stop offset="1" stopColor={t.colors.accentOrange} stopOpacity={0.16} />
          </LinearGradient>
        </Defs>
        {rings.map((k, ri) => (
          <Polygon
            key={ri}
            points={axes.map((a) => `${cx + a.ux * R * k},${cy + a.uy * R * k}`).join(' ')}
            fill="none"
            stroke={grid}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
        ))}
        {/* Outer rim slightly stronger — anchors the shape. */}
        <Polygon
          points={axes.map((a) => `${a.rimX},${a.rimY}`).join(' ')}
          fill="none"
          stroke={grid}
          strokeOpacity={0.35}
          strokeWidth={1.4}
        />
        {axes.map((a, i) => (
          <Line
            key={i}
            x1={cx}
            y1={cy}
            x2={a.rimX}
            y2={a.rimY}
            stroke={grid}
            strokeOpacity={0.25}
            strokeWidth={1}
          />
        ))}
        <AnimatedPolygon
          animatedProps={animatedProps}
          fill="url(#dnaFill)"
          stroke={accent}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />
        {axes.map((a) => (
          <VertexDot
            key={a.mood}
            axis={a}
            cx={cx}
            cy={cy}
            progress={progress}
            accent={accent}
            halo={t.colors.card}
          />
        ))}
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
              ...t.shadows.sm,
            }}
          >
            <Ionicons name={optionIcon(a.mood)} size={16} color={dominant ? '#FFFFFF' : accent} />
          </Animated.View>
        );
      })}
    </View>
  );
}
