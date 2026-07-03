import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Logo, Text } from '@/components/ui';
import { EveningScene, type SceneName } from '@/features/onboarding/EveningScene';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

const PAGES: SceneName[] = ['sunset', 'decide', 'route'];

/** A slowly drifting warm glow — the "background slowly moves" from 16_ONBOARDING. */
function GlowBlob({
  size,
  color,
  top,
  left,
  duration,
  drift,
}: {
  size: number;
  color: string;
  top: number;
  left: number;
  duration: number;
  drift: number;
}) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    progress.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(progress.value, [0, 1], [0, drift]) },
      { translateY: interpolate(progress.value, [0, 1], [0, -drift * 0.7]) },
      { scale: interpolate(progress.value, [0, 1], [1, 1.18]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', top, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/** The brand mark, gently breathing. */
function BreathingLogo({ size }: { size: number }) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced) return;
    scale.value = withRepeat(withTiming(1.04, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Logo size={size} />
    </Animated.View>
  );
}

/** One onboarding page — scene scales/fades, text slides with the swipe (parallax). */
function OnboardingPage({
  scene,
  index,
  width,
  scrollX,
}: {
  scene: SceneName;
  index: number;
  width: number;
  scrollX: SharedValue<number>;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const reduced = useReducedMotion();
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const isFirst = index === 0;

  const sceneStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, inputRange, [0.25, 1, 0.25], Extrapolation.CLAMP);
    if (reduced) return { opacity };
    return {
      opacity,
      transform: [
        { scale: interpolate(scrollX.value, inputRange, [0.86, 1, 0.86], Extrapolation.CLAMP) },
        { translateY: interpolate(scrollX.value, inputRange, [14, 0, 14], Extrapolation.CLAMP) },
      ],
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP);
    if (reduced) return { opacity };
    return {
      opacity,
      transform: [
        { translateX: interpolate(scrollX.value, inputRange, [width * 0.18, 0, -width * 0.18], Extrapolation.CLAMP) },
      ],
    };
  });

  return (
    <View
      style={{
        width,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: t.spacing.lg,
        gap: t.spacing.lg,
      }}
    >
      <Animated.View entering={isFirst ? FadeInUp.duration(500).delay(80) : undefined}>
        <BreathingLogo size={56} />
      </Animated.View>
      <Animated.View style={sceneStyle} entering={isFirst ? FadeInUp.duration(500).delay(160) : undefined}>
        <EveningScene name={scene} width={Math.min(width - t.spacing.lg * 2, 340)} />
      </Animated.View>
      <Animated.View
        style={[{ gap: t.spacing.md, alignItems: 'center' }, textStyle]}
        entering={isFirst ? FadeInUp.duration(500).delay(240) : undefined}
      >
        <Text variant="displayMedium" center>
          {tr(`onboarding.pages.${scene}.headline`)}
        </Text>
        <Text variant="bodyLarge" color="textSecondary" center>
          {tr(`onboarding.pages.${scene}.body`)}
        </Text>
      </Animated.View>
    </View>
  );
}

/** One dot that morphs width/opacity continuously with the swipe. */
function MorphingDot({
  index,
  scrollX,
  pageWidth,
}: {
  index: number;
  scrollX: SharedValue<number>;
  pageWidth: number;
}) {
  const t = useTheme();
  const inputRange = [(index - 1) * pageWidth, index * pageWidth, (index + 1) * pageWidth];
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [8, 22, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, inputRange, [0.45, 1, 0.45], Extrapolation.CLAMP),
  }));
  return (
    <Animated.View style={[{ height: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.primary }, style]} />
  );
}

export default function OnboardingIntro() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const scrollX = useSharedValue(0);

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollX.value = event.contentOffset.x;
  });

  const glow = t.scheme === 'dark' ? 'rgba(232,140,90,0.10)' : 'rgba(232,140,90,0.16)';
  const glowSoft = t.scheme === 'dark' ? 'rgba(201,123,99,0.08)' : 'rgba(201,123,99,0.14)';

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <LinearGradient
        colors={[t.colors.background, t.scheme === 'dark' ? '#1D1815' : '#F3E7DC']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <GlowBlob size={340} color={glow} top={-90} left={width - 200} duration={9000} drift={26} />
      <GlowBlob size={280} color={glowSoft} top={420} left={-120} duration={12000} drift={34} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            paddingHorizontal: t.spacing.lg,
            height: 32,
            alignItems: 'center',
          }}
        >
          <Text variant="small" color="textSecondary" onPress={completeOnboarding}>
            {tr('common.skip')}
          </Text>
        </View>

        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {PAGES.map((scene, i) => (
            <OnboardingPage key={scene} scene={scene} index={i} width={width} scrollX={scrollX} />
          ))}
        </Animated.ScrollView>

        <Animated.View
          entering={FadeInUp.duration(500).delay(400)}
          style={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.base, gap: t.spacing.lg }}
        >
          <View style={{ flexDirection: 'row', gap: t.spacing.sm, justifyContent: 'center' }}>
            {PAGES.map((_, i) => (
              <MorphingDot key={i} index={i} scrollX={scrollX} pageWidth={width} />
            ))}
          </View>
          <Button title={tr('common.continue')} onPress={() => router.push('/onboarding/demo')} />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
