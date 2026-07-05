import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Button, Chip, Screen, StarRating, Text } from '@/components/ui';
import { DEMO_META, DEMO_PLANS } from '@/features/onboarding/demo-plans';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { shade } from '@/utils/color';

const MOODS = ['Stay In', 'Romantic', 'Activities', 'Party'];

/** Fake "start navigation" button — the arrow drifts to hint movement (a teaser, not real nav). */
function NavButton({ accent, label, onPress }: { accent: string; label: string; onPress: () => void }) {
  const reduced = useReducedMotion();
  const nudge = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    nudge.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
  }, [reduced, nudge]);

  const arrowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: nudge.value * 4 }] }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <LinearGradient
        colors={[shade(accent, 0.14), accent, shade(accent, -0.16)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          paddingVertical: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          shadowColor: accent,
          shadowOpacity: 0.45,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        }}
      >
        <Animated.View style={arrowStyle}>
          <Ionicons name="navigate" size={20} color="#FFFFFF" />
        </Animated.View>
        <Text variant="button" style={{ color: '#FFFFFF' }}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}

/** Mini interactive demo — show the result, never the technology (16_ONBOARDING). */
export default function OnboardingDemo() {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);
  const [rating, setRating] = useState(0);

  const stops = mood ? DEMO_PLANS[mood] ?? [] : [];
  const meta = mood ? DEMO_META[mood] : undefined;
  const accent = meta?.accent ?? t.colors.primary;

  // This is a teaser: every control on the generated preview simply moves onboarding forward.
  const onContinue = () => router.push('/onboarding/permissions');

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.base }}>
      <Animated.View entering={FadeInUp.duration(400).delay(60)}>
        <Text variant="displayMedium">{tr('onboarding.demo.title')}</Text>
        <Text variant="bodyLarge" color="textSecondary" style={{ marginTop: t.spacing.sm }}>
          {tr('onboarding.demo.body')}
        </Text>
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(400).delay(160)}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm, marginTop: t.spacing.sm }}
      >
        {MOODS.map((m) => (
          <Chip
            key={m}
            label={optionLabel(m)}
            selected={mood === m}
            onPress={() => {
              setMood(m);
              setGenerated(false);
              setRating(0);
            }}
          />
        ))}
      </Animated.View>

      {!generated ? (
        <View style={{ marginTop: t.spacing.lg }}>
          <Button title={tr('onboarding.demo.create')} disabled={!mood} onPress={() => setGenerated(true)} />
        </View>
      ) : (
        <View style={{ gap: t.spacing.base, marginTop: t.spacing.sm }}>
          {/* Plan card: accent header (fake route + km) over an animated stop timeline. */}
          <Animated.View
            entering={FadeInDown.duration(380)}
            style={{ borderRadius: t.radius.card, overflow: 'hidden', backgroundColor: t.colors.card, ...t.shadows.md }}
          >
            <LinearGradient
              colors={[shade(accent, -0.1), accent, shade(accent, -0.26)]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                padding: t.spacing.base,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ gap: 2 }}>
                <Text variant="caption" style={{ color: 'rgba(255,255,255,0.82)', letterSpacing: 1 }}>
                  {tr('onboarding.demo.eyebrow').toUpperCase()}
                </Text>
                <Text variant="h3" style={{ color: '#FFFFFF' }}>
                  {mood ? optionLabel(mood) : ''}
                </Text>
                <Text variant="small" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  {tr('onboarding.demo.stopsCount', { count: stops.length })}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: t.radius.pill,
                }}
              >
                <Ionicons name="navigate" size={14} color="#FFFFFF" />
                <Text variant="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                  {meta?.distanceKm}
                </Text>
              </View>
            </LinearGradient>

            <View style={{ padding: t.spacing.base, paddingTop: t.spacing.md }}>
              {stops.map((stop, i) => {
                const isLast = i === stops.length - 1;
                return (
                  <Animated.View
                    key={stop.de}
                    entering={FadeInDown.duration(340).delay(140 + i * 110)}
                    style={{ flexDirection: 'row', gap: t.spacing.md }}
                  >
                    <View style={{ width: 58, alignItems: 'center' }}>
                      <View
                        style={{
                          width: 58,
                          height: 58,
                          borderRadius: 16,
                          overflow: 'hidden',
                          backgroundColor: t.colors.surfaceSecondary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {stop.image ? (
                          <Image source={stop.image} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                        ) : (
                          <Ionicons name={stop.icon} size={24} color={accent} />
                        )}
                      </View>
                      {!isLast && (
                        <View
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 16,
                            marginTop: 6,
                            borderRadius: 1,
                            backgroundColor: accent + '55',
                          }}
                        />
                      )}
                    </View>
                    <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20, justifyContent: 'center' }}>
                      <Text variant="small" style={{ color: accent, fontWeight: '700' }}>
                        {stop.time}
                      </Text>
                      <Text variant="body" style={{ marginTop: 2 }}>
                        {locale === 'de' ? stop.de : stop.en}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Fake "start navigation" — thematically leads into the location permission next. */}
          <Animated.View entering={FadeInDown.duration(360).delay(160 + stops.length * 110)}>
            <NavButton accent={accent} label={tr('onboarding.demo.route')} onPress={onContinue} />
          </Animated.View>

          {/* Teaser for the memory album: rate the evening or share it with friends. */}
          <Animated.View
            entering={FadeInDown.duration(360).delay(230 + stops.length * 110)}
            style={{
              backgroundColor: t.colors.card,
              borderRadius: t.radius.card,
              padding: t.spacing.base,
              gap: t.spacing.sm,
              ...t.shadows.sm,
            }}
          >
            <Text variant="small" color="textSecondary">
              {tr('onboarding.demo.afterwards')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ gap: 6 }}>
                <Text variant="body">{tr('onboarding.demo.rate')}</Text>
                <StarRating
                  value={rating}
                  onChange={(v) => {
                    setRating(v);
                    onContinue();
                  }}
                  size={26}
                />
              </View>
              <Pressable
                onPress={onContinue}
                accessibilityRole="button"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: t.colors.surfaceSecondary,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: t.radius.pill,
                }}
              >
                <Ionicons name="share-social-outline" size={16} color={t.colors.textHeading} />
                <Text variant="small" style={{ fontWeight: '600' }}>
                  {tr('onboarding.demo.share')}
                </Text>
              </Pressable>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(300 + stops.length * 110)} style={{ marginTop: t.spacing.xs }}>
            <Button title={tr('common.continue')} variant="secondary" onPress={onContinue} />
          </Animated.View>
        </View>
      )}
    </Screen>
  );
}
