import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { Card, Text } from '@/components/ui';
import type { Album } from '@/features/albums/types';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { computeBadges, computeDNA } from './evening-dna';

/** Each mood gets its own colour, so the DNA reads at a glance and feels alive. */
const MOOD_TINT: Record<string, string> = {
  Romantic: '#C97B63',
  Relaxed: '#5EA97E',
  Party: '#9B7BE8',
  Cozy: '#E5A93C',
  Adventure: '#4C9BE8',
  Luxury: '#B08D57',
};

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
function DnaBar({ pct, color }: { pct: number; color: string }) {
  const t = useTheme();
  const reduced = useReducedMotion();
  const w = useSharedValue(reduced ? pct : 0);
  useEffect(() => {
    if (!reduced) w.value = withDelay(150, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [pct, reduced, w]);
  const style = useAnimatedStyle(() => ({ width: `${w.value}%` }));
  return (
    <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, style]} />
    </View>
  );
}

/** Evening DNA (mood affinity, from real evenings) + earned badges. Own profile only (private albums). */
export function EveningDNA({ albums, accent }: { albums: Album[]; accent: string }) {
  const t = useTheme();
  const { t: tr } = useT();
  const dna = computeDNA(albums);
  const badges = computeBadges(albums);
  if (dna.length === 0) return null;

  const tint = (mood: string) => MOOD_TINT[mood] ?? accent;

  return (
    <View style={{ gap: t.spacing.lg }}>
      <View style={{ gap: t.spacing.md }}>
        <Heading title={tr('dna.title')} accent={accent} />
        <Card style={{ gap: t.spacing.md }}>
          {dna.map((trait) => {
            const color = tint(trait.mood);
            return (
              <View key={trait.mood} style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: t.radius.pill,
                        backgroundColor: color + '26',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={trait.icon} size={15} color={color} />
                    </View>
                    <Text variant="small" style={{ fontWeight: '600' }}>
                      {tr(`dna.${trait.mood.toLowerCase()}`)}
                    </Text>
                  </View>
                  <Text variant="small" style={{ color, fontWeight: '700' }}>
                    {`${trait.pct}%`}
                  </Text>
                </View>
                <DnaBar pct={trait.pct} color={color} />
              </View>
            );
          })}
        </Card>
      </View>

      {badges.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          <Heading title={tr('dna.badges')} accent={accent} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {badges.map((b) => (
              <View
                key={b.key}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: t.colors.surfaceSecondary,
                  paddingHorizontal: t.spacing.base,
                  paddingVertical: t.spacing.sm,
                  borderRadius: t.radius.pill,
                }}
              >
                <Ionicons name={b.icon} size={15} color={accent} />
                <Text variant="small" style={{ fontWeight: '600' }}>
                  {tr(`badges.${b.key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
