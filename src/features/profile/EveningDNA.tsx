import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import type { Album } from '@/features/albums/types';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { computeBadges, computeDNA } from './evening-dna';

function Heading({ title, accent }: { title: string; accent: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text variant="h3">{title}</Text>
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

  return (
    <View style={{ gap: t.spacing.lg }}>
      <View style={{ gap: t.spacing.md }}>
        <Heading title={tr('dna.title')} accent={accent} />
        <Card style={{ gap: t.spacing.md }}>
          {dna.map((trait) => (
            <View key={trait.mood} style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: t.radius.pill,
                      backgroundColor: accent + '24',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={trait.icon} size={15} color={accent} />
                  </View>
                  <Text variant="small" style={{ fontWeight: '600' }}>
                    {tr(`dna.${trait.mood.toLowerCase()}`)}
                  </Text>
                </View>
                <Text variant="small" color="textSecondary">
                  {`${trait.pct}%`}
                </Text>
              </View>
              <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' }}>
                <View style={{ width: `${trait.pct}%`, height: '100%', borderRadius: 4, backgroundColor: accent }} />
              </View>
            </View>
          ))}
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
