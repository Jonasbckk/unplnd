import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import type { Album } from '@/features/albums/types';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { computeDNA, type DnaTrait } from './evening-dna';

function Heading({ title, accent }: { title: string; accent: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text variant="h3">{title}</Text>
    </View>
  );
}

/** A mood affinity bar that fills in from 0 on appear (Reduce Motion → static). */
function DnaBar({ pct, color, delay }: { pct: number; color: string; delay: number }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? pct : 0);
  useEffect(() => {
    if (!reduced) w.value = withDelay(delay, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct, reduced, w, delay]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, style]} />
    </View>
  );
}

/** Evening DNA — your mood mix from real evenings, as clean percent bars. Own profile only. */
export function EveningDNA({
  albums,
  dna: dnaProp,
  accent,
  title: titleProp,
}: {
  albums?: Album[];
  /** Pre-computed DNA (e.g. another user's, from server aggregates). Falls back to `albums`. */
  dna?: DnaTrait[];
  accent: string;
  /** Override the heading (e.g. "Abend-DNA" on someone else's profile, not "Deine Abend-DNA"). */
  title?: string;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const reduced = useReducedMotion();
  const dna = dnaProp ?? computeDNA(albums ?? []);
  if (dna.length === 0) return null;

  return (
    <View style={{ gap: t.spacing.md }}>
      <Heading title={titleProp ?? tr('dna.title')} accent={accent} />
      <Card style={{ gap: t.spacing.base }}>
        {dna.map((trait, i) => (
          <Animated.View
            key={trait.mood}
            entering={reduced ? undefined : FadeInDown.duration(320).delay(i * 70)}
            style={{ gap: 6 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: t.radius.pill,
                    backgroundColor: accent + '26',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={trait.icon} size={15} color={accent} />
                </View>
                <Text variant="small" style={{ fontWeight: '600' }}>
                  {optionLabel(trait.mood)}
                </Text>
              </View>
              <Text variant="small" style={{ color: accent, fontWeight: '700' }}>
                {`${trait.pct}%`}
              </Text>
            </View>
            <DnaBar pct={trait.pct} color={accent} delay={150 + i * 70} />
          </Animated.View>
        ))}
      </Card>
    </View>
  );
}
