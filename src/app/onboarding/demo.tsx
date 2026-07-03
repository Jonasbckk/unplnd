import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

const MOODS = ['Stay In', 'Romantic', 'Activities', 'Party'];

const SAMPLE_TIMES = ['19:00', '21:00', '22:30'];

/** Mini interactive demo — show the result, never the technology (16_ONBOARDING). */
export default function OnboardingDemo() {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const router = useRouter();
  const [mood, setMood] = useState<string | null>(null);
  const [generated, setGenerated] = useState(false);

  const sampleStops =
    locale === 'de'
      ? ['Abendessen in einer gemütlichen Trattoria', 'Sonnenuntergangs-Spaziergang am Fluss', 'Cocktails in der Rooftop-Bar']
      : ['Dinner at a cozy trattoria', 'Sunset walk along the river', 'Cocktails at a rooftop bar'];

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
            <Card style={{ gap: t.spacing.md }}>
              <Text variant="h3">{tr('onboarding.demo.yourEvening', { mood: mood ? optionLabel(mood) : '' })}</Text>
              {sampleStops.map((title, i) => (
                <View key={title} style={{ flexDirection: 'row', gap: t.spacing.md }}>
                  <Text variant="body" color="primary" style={{ width: 52 }}>
                    {SAMPLE_TIMES[i]}
                  </Text>
                  <Text variant="body" style={{ flex: 1 }}>
                    {title}
                  </Text>
                </View>
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
