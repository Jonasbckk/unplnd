import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button, Text } from '@/components/ui';
import { VerifyBadge } from '@/features/verify/VerifyBadge';
import { tierByLevel } from '@/features/verify/verification';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { Confetti } from './Confetti';
import { useCelebrateStore } from './celebrate-store';

/** A flickering flame for the streak — two offset flames flicker to feel alive (Reduce Motion → still). */
function Flame() {
  const reduced = useReducedMotion();
  const f = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    f.value = withRepeat(withTiming(1, { duration: 620, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduced, f]);

  const flame = useAnimatedStyle(() => ({ transform: [{ scale: 1 + f.value * 0.09 }, { translateY: -f.value * 2 }] }));
  const glow = useAnimatedStyle(() => ({ opacity: 0.25 + f.value * 0.3, transform: [{ scale: 1.28 + f.value * 0.14 }] }));

  return (
    <View style={{ width: 128, height: 128, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute' }, glow]}>
        <Ionicons name="flame" size={94} color="#F2A24B" />
      </Animated.View>
      <Animated.View style={flame}>
        <Ionicons name="flame" size={100} color="#E8663B" />
      </Animated.View>
    </View>
  );
}

function Scrim({ children }: { children: ReactNode }) {
  const t = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(20,14,10,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: t.spacing.xl,
      }}
    >
      {children}
    </Animated.View>
  );
}

/** Global celebration layer — mounted once in AppShell. Streak takes priority over a tier-up. */
export function CelebrationOverlay() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const reduced = useReducedMotion();
  const streak = useCelebrateStore((s) => s.streak);
  const tierLevel = useCelebrateStore((s) => s.tierLevel);
  const clearStreak = useCelebrateStore((s) => s.clearStreak);
  const clearTier = useCelebrateStore((s) => s.clearTier);

  useEffect(() => {
    if (streak != null || tierLevel != null) haptics.success();
  }, [streak, tierLevel]);

  const card = {
    alignItems: 'center' as const,
    gap: t.spacing.base,
    alignSelf: 'stretch' as const,
    backgroundColor: t.colors.card,
    borderRadius: t.radius.sheet,
    padding: t.spacing.xl,
  };

  if (streak != null) {
    const dayLabel = streak === 1 ? tr('celebrate.day') : tr('celebrate.days');
    return (
      <Scrim>
        <View style={card}>
          <Flame />
          <Text variant="displayMedium" color="textHeading">{`${streak} ${dayLabel}`}</Text>
          <Text variant="small" color="textSecondary">{tr('celebrate.inARow')}</Text>
          <Text variant="body" color="textSecondary" center>
            {tr('celebrate.streakBody')}
          </Text>
          <View style={{ alignSelf: 'stretch', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
            <Button
              title={tr('celebrate.streakCta')}
              onPress={() => {
                clearStreak();
                router.push('/verify' as Href);
              }}
            />
            <Button title={tr('celebrate.dismiss')} variant="secondary" onPress={clearStreak} />
          </View>
        </View>
      </Scrim>
    );
  }

  if (tierLevel != null) {
    const tier = tierByLevel(tierLevel);
    return (
      <Scrim>
        {reduced ? null : <Confetti />}
        <View style={card}>
          <VerifyBadge color={tier?.color ?? t.colors.primary} size={120} animated />
          <Text variant="small" color="textSecondary">{tr('celebrate.tierEyebrow')}</Text>
          <Text variant="displayMedium" color="textHeading" center>
            {tier ? tr(`verify.tier.${tier.id}.name`) : ''}
          </Text>
          <Text variant="body" color="textSecondary" center>
            {tier ? tr(`verify.tier.${tier.id}.tag`) : ''}
          </Text>
          <View style={{ alignSelf: 'stretch', gap: t.spacing.sm, marginTop: t.spacing.sm }}>
            <Button
              title={tr('celebrate.tierCta')}
              onPress={() => {
                clearTier();
                router.push('/verify' as Href);
              }}
            />
            <Button title={tr('celebrate.dismiss')} variant="secondary" onPress={clearTier} />
          </View>
        </View>
      </Scrim>
    );
  }

  return null;
}
