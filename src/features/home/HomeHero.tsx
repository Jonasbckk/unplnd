import { LinearGradient } from 'expo-linear-gradient';
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
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { Logo, Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import type { GreetingSegment } from './greeting';

interface Palette {
  gradient: readonly [string, string, ...string[]];
  on: string;
  glow: string;
  stars: boolean;
}

// Time-of-day palettes — warm, on-brand (never the generic rose/blue). Evening = the signature sunset.
const PALETTES: Record<GreetingSegment, Palette> = {
  morning: { gradient: ['#FBD9B8', '#F1B183', '#E79A6E'], on: '#4A2E22', glow: '#FFF1D8', stars: false },
  afternoon: { gradient: ['#F0B58C', '#D98A66', '#C97B63'], on: '#3E2419', glow: '#FFE9CC', stars: false },
  evening: { gradient: ['#E8865A', '#C25E6B', '#7A4A5C'], on: '#FDF1E9', glow: '#FFD9A8', stars: false },
  night: { gradient: ['#4A3B58', '#2E2740', '#1D1830'], on: '#F1ECFB', glow: '#D8D4FF', stars: true },
};

/** A softly drifting light orb — ambient motion that loops forever (Reduce-Motion → still). */
function Orb({
  size,
  left,
  top,
  color,
  duration,
  drift,
  reduced,
}: {
  size: number;
  left: number;
  top: number;
  color: string;
  duration: number;
  drift: number;
  reduced: boolean;
}) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduced, duration, progress]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: progress.value * drift }, { translateX: progress.value * (drift * 0.6) }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left, top, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** Home hero — a living, time-of-day gradient banner with drifting light + a sun/moon motif. */
export function HomeHero({ segment }: { segment: GreetingSegment }) {
  const t = useTheme();
  const { t: tr } = useT();
  const reduced = useReducedMotion();
  const p = PALETTES[segment];

  return (
    <View
      style={{
        borderRadius: t.radius.sheet,
        overflow: 'hidden',
        minHeight: 196,
        marginBottom: t.spacing.lg,
        justifyContent: 'flex-end',
        padding: t.spacing.lg,
        ...t.shadows.md,
      }}
    >
      <LinearGradient
        colors={p.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      {/* Ambient drifting light — the loop. */}
      <Orb size={130} left={-30} top={-20} color="rgba(255,255,255,0.12)" duration={5200} drift={22} reduced={reduced} />
      <Orb size={90} left={210} top={90} color="rgba(255,255,255,0.10)" duration={6400} drift={-18} reduced={reduced} />

      {/* Sun / moon motif, top-right. */}
      <View style={{ position: 'absolute', top: 18, right: 22 }}>
        <Svg width={116} height={116} viewBox="0 0 116 116">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={p.glow} stopOpacity={0.95} />
              <Stop offset="45%" stopColor={p.glow} stopOpacity={0.45} />
              <Stop offset="100%" stopColor={p.glow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={58} cy={58} r={58} fill="url(#glow)" />
          {p.stars && (
            <>
              <Circle cx={20} cy={26} r={1.7} fill="#FFFFFF" opacity={0.9} />
              <Circle cx={96} cy={94} r={1.4} fill="#FFFFFF" opacity={0.8} />
              <Circle cx={30} cy={92} r={1.5} fill="#FFFFFF" opacity={0.85} />
            </>
          )}
        </Svg>
      </View>

      {/* Content */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginBottom: t.spacing.md }}>
        <Logo size={22} />
        <Text variant="small" style={{ color: p.on, letterSpacing: 1.5, fontWeight: '700', opacity: 0.9 }}>
          UNPLND
        </Text>
      </View>
      <Text variant="small" style={{ color: p.on, opacity: 0.85 }}>
        {tr(`home.greetings.${segment}.hello`)}
      </Text>
      <Text variant="displayMedium" style={{ color: p.on, marginTop: 2 }}>
        {tr(`home.greetings.${segment}.headline`)}
      </Text>
    </View>
  );
}
