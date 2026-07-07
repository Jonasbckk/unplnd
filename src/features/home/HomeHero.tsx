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
  /** The ambient glow colour behind the headline. */
  glow: string;
  /** Second, smaller glow for depth. */
  glowSoft: string;
  stars: boolean;
}

// Time-of-day ambience — the living background behind the big headline (founder: keep it).
const PALETTES: Record<GreetingSegment, Palette> = {
  morning: { glow: '#FFC98A', glowSoft: '#FFE3B8', stars: false },
  afternoon: { glow: '#FFAE78', glowSoft: '#FFD3A8', stars: false },
  evening: { glow: '#FF9066', glowSoft: '#D96A8A', stars: false },
  night: { glow: '#8F7BD8', glowSoft: '#5A4E8C', stars: true },
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

/**
 * Home hero — brand row, a small accent greeting and one big statement headline
 * (last word in brand orange), over a living time-of-day glow with drifting light.
 */
export function HomeHero({ segment }: { segment: GreetingSegment }) {
  const t = useTheme();
  const { t: tr } = useT();
  const reduced = useReducedMotion();
  const p = PALETTES[segment];
  const dark = t.scheme === 'dark';

  // Last word carries the accent — "Schon Pläne für später?" / "Ein letztes Abenteuer?".
  const headline = tr(`home.greetings.${segment}.headline`);
  const words = headline.trim().split(' ');
  const accentWord = words.pop() ?? '';
  const leadWords = words.join(' ');

  const glowOpacity = dark ? 0.32 : 0.5;

  return (
    <View style={{ gap: t.spacing.lg }}>
      {/* Brand row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <Logo size={26} />
        <Text
          variant="small"
          style={{ letterSpacing: 2.5, fontWeight: '700', color: t.colors.textHeading }}
        >
          UNPLND
        </Text>
      </View>

      {/* Headline block over the living time-of-day ambience */}
      <View style={{ minHeight: 128, justifyContent: 'center' }}>
        <View pointerEvents="none" style={{ position: 'absolute', top: -40, right: -60 }}>
          <Svg width={280} height={280} viewBox="0 0 280 280">
            <Defs>
              <RadialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={p.glow} stopOpacity={glowOpacity} />
                <Stop offset="55%" stopColor={p.glow} stopOpacity={glowOpacity * 0.45} />
                <Stop offset="100%" stopColor={p.glow} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Circle cx={140} cy={140} r={140} fill="url(#heroGlow)" />
            {p.stars && (
              <>
                <Circle cx={70} cy={80} r={1.8} fill="#FFFFFF" opacity={0.85} />
                <Circle cx={200} cy={60} r={1.4} fill="#FFFFFF" opacity={0.75} />
                <Circle cx={170} cy={170} r={1.6} fill="#FFFFFF" opacity={0.8} />
              </>
            )}
          </Svg>
        </View>
        <Orb size={120} left={-46} top={40} color={p.glowSoft + (dark ? '14' : '2E')} duration={5200} drift={20} reduced={reduced} />
        <Orb size={80} left={230} top={-8} color={p.glow + (dark ? '12' : '26')} duration={6400} drift={-16} reduced={reduced} />

        <Text variant="small" style={{ color: t.colors.primary, fontWeight: '600', marginBottom: t.spacing.xs }}>
          {tr(`home.greetings.${segment}.hello`)}
        </Text>
        <Text variant="displayLarge" style={{ color: t.colors.textHeading }}>
          {leadWords ? `${leadWords} ` : ''}
          <Text variant="displayLarge" style={{ color: t.colors.primary }}>
            {accentWord}
          </Text>
        </Text>
      </View>
    </View>
  );
}
