import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { DEMO_PLANS } from '@/features/onboarding/demo-plans';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

const MOODS = ['Stay In', 'Romantic', 'Activities', 'Party'];

/** Mini interactive demo — show the result, never the technology (16_ONBOARDING). */
export default function OnboardingDemo() {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const stops = mood ? DEMO_PLANS[mood] ?? [] : [];

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
            }}
          />
        ))}
      </Animated.View>

      {!generated ? (
        <View style={{ marginTop: t.spacing.lg }}>
          <Button title={tr('onboarding.demo.create')} disabled={!mood} onPress={() => setGenerated(true)} />
        </View>
      ) : (
        <View style={{ gap: t.spacing.lg, marginTop: t.spacing.base }}>
          <Animated.View entering={FadeInDown.duration(350)}>
            <Card style={{ gap: t.spacing.lg }}>
              <Text variant="h3">
                {tr('onboarding.demo.yourEvening', { mood: mood ? optionLabel(mood) : '' })}
              </Text>
              {stops.map((stop, i) => (
                <Animated.View
                  key={stop.de}
                  entering={FadeInDown.duration(340).delay(80 + i * 90)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}
                >
                  <View
                    style={{
                      width: 60,
                      height: 60,
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
                      <Ionicons name={stop.icon} size={26} color={t.colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="small" color="primary">
                      {stop.time}
                    </Text>
                    <Text variant="body">{locale === 'de' ? stop.de : stop.en}</Text>
                  </View>
                </Animated.View>
              ))}
            </Card>
          </Animated.View>
          <Animated.View entering={FadeInDown.duration(350).delay(120)}>
            <Button title={tr('common.continue')} onPress={() => router.push('/onboarding/permissions')} />
          </Animated.View>
        </View>
      )}
    </Screen>
  );
}
