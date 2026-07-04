import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import { Button, Logo, Text } from '@/components/ui';
import { generateEvening } from '@/features/planner/generate-service';
import { usePlannerStore } from '@/features/planner/planner-store';
import { useT } from '@/lib/i18n';
import { getCurrentLocation, openLocationSettings, requestLocationPermission } from '@/lib/location';
import { useTheme } from '@/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const ROUTE_PATH = 'M24 128 C 78 118 86 62 138 58 S 228 84 262 34';
const PATH_LENGTH = 320;
// Where each stop pops in, as a fraction of the loop.
const STOPS = [
  { cx: 24, cy: 128, at: 0.08 },
  { cx: 138, cy: 58, at: 0.34 },
  { cx: 262, cy: 34, at: 0.6 },
];

/** The evening route drawing itself — a signature moment (09_ANIMATIONS). */
function RouteDraw({ width }: { width: number }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      progress.value = 0.62; // static, fully drawn
      return;
    }
    progress.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.cubic) }), -1, false);
  }, [reduced, progress]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(progress.value, [0, 0.62, 1], [PATH_LENGTH, 0, 0]),
    opacity: interpolate(progress.value, [0, 0.02, 0.92, 1], [0.4, 1, 1, 0]),
  }));

  const dot0 = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [STOPS[0].at - 0.04, STOPS[0].at, 0.92, 1], [0, 1, 1, 0]),
  }));
  const dot1 = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [STOPS[1].at - 0.04, STOPS[1].at, 0.92, 1], [0, 1, 1, 0]),
  }));
  const dot2 = useAnimatedProps(() => ({
    opacity: interpolate(progress.value, [STOPS[2].at - 0.04, STOPS[2].at, 0.92, 1], [0, 1, 1, 0]),
  }));
  const dots = [dot0, dot1, dot2];

  return (
    <Svg width={width} height={width * 0.55} viewBox="0 0 290 160">
      <AnimatedPath
        d={ROUTE_PATH}
        stroke={t.colors.primary}
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${PATH_LENGTH}`}
        animatedProps={pathProps}
      />
      {STOPS.map((stop, i) => (
        <AnimatedCircle
          key={i}
          cx={stop.cx}
          cy={stop.cy}
          r={9}
          fill={i === 1 ? t.colors.accentOrange : t.colors.primary}
          animatedProps={dots[i]}
        />
      ))}
      {STOPS.map((stop, i) => (
        <AnimatedCircle key={`c${i}`} cx={stop.cx} cy={stop.cy} r={3.5} fill="#FFFFFF" animatedProps={dots[i]} />
      ))}
    </Svg>
  );
}

type Phase = 'generating' | 'locationNeeded' | 'noOptions' | 'failed';

export default function GeneratingScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const answers = usePlannerStore((s) => s.answers);
  const setPlan = usePlannerStore((s) => s.setPlan);
  const [phase, setPhase] = useState<Phase>('generating');
  const [messageIndex, setMessageIndex] = useState(0);
  const [askedAgain, setAskedAgain] = useState(false);
  const cancelled = useRef(false);

  const run = useCallback(async () => {
    setPhase('generating');
    setMessageIndex(0);

    // No location → no plan. Never fall back to a default city (Constitution Rule 5: trust).
    const location = await getCurrentLocation();
    if (cancelled.current) return;
    if (!location) {
      setPhase('locationNeeded');
      return;
    }

    const minDelay = new Promise((resolve) => setTimeout(resolve, 3200));
    const [result] = await Promise.all([generateEvening(answers, location), minDelay]);
    if (cancelled.current) return;
    if (!result.ok) {
      // Never a mock: show an honest state (nothing open vs. something went wrong).
      setPhase(result.kind === 'no_options' ? 'noOptions' : 'failed');
      return;
    }
    setPlan(result.plan);
    router.replace('/plan/route');
    // Answers are stable for this screen's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    cancelled.current = false;
    const messageCount = (tr('generating.messages') as unknown as string[]).length;
    const ticker = setInterval(() => setMessageIndex((m) => Math.min(m + 1, messageCount - 1)), 620);
    void run();
    return () => {
      cancelled.current = true;
      clearInterval(ticker);
    };
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onAllowLocation = async () => {
    if (askedAgain) {
      openLocationSettings();
      return;
    }
    setAskedAgain(true);
    const granted = await requestLocationPermission();
    if (granted) {
      void run();
    }
  };

  if (phase === 'locationNeeded') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.lg,
          padding: t.spacing.lg,
        }}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={{ alignItems: 'center', gap: t.spacing.lg }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location-outline" size={32} color={t.colors.primary} />
          </View>
          <Text variant="h1" center>
            {tr('location.neededTitle')}
          </Text>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('location.neededBody')}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={{ alignSelf: 'stretch', gap: t.spacing.md }}>
          <Button title={askedAgain ? tr('location.openSettings') : tr('location.allow')} onPress={onAllowLocation} />
          <Button title={tr('location.back')} variant="secondary" onPress={() => router.back()} />
        </Animated.View>
      </View>
    );
  }

  if (phase === 'noOptions' || phase === 'failed') {
    const noOptions = phase === 'noOptions';
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: t.colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          gap: t.spacing.lg,
          padding: t.spacing.lg,
        }}
      >
        <Animated.View entering={FadeInDown.duration(350)} style={{ alignItems: 'center', gap: t.spacing.lg }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: t.radius.pill,
              backgroundColor: t.colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={noOptions ? 'moon-outline' : 'sad-outline'} size={32} color={t.colors.primary} />
          </View>
          <Text variant="h1" center>
            {tr(noOptions ? 'generating.noOptionsTitle' : 'generating.failedTitle')}
          </Text>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr(noOptions ? 'generating.noOptionsBody' : 'generating.failedBody')}
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.duration(350).delay(120)} style={{ alignSelf: 'stretch', gap: t.spacing.md }}>
          <Button title={tr('generating.retry')} onPress={() => void run()} />
          <Button title={tr('generating.back')} variant="secondary" onPress={() => router.back()} />
        </Animated.View>
      </View>
    );
  }

  const messages = tr('generating.messages') as unknown as string[];

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: t.spacing.xl,
        padding: t.spacing.lg,
      }}
    >
      <Logo size={44} />
      <RouteDraw width={280} />
      <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
        <Text variant="h2" center>
          {tr('generating.title')}
        </Text>
        <Animated.View key={messageIndex} entering={FadeIn.duration(260)}>
          <Text variant="bodyLarge" color="textSecondary" center>
            {messages[messageIndex]}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}
