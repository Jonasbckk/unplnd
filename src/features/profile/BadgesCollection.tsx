import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

import { Button, Card, Text } from '@/components/ui';
import type { Album } from '@/features/albums/types';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { computeAllBadges, type BadgeProgress } from './evening-dna';

/** Flat-top hexagon of the given width; height ≈ 0.866·width. */
function Hexagon({ width, fill }: { width: number; fill: string }) {
  const h = width * 0.866;
  const pts = `${width * 0.25},0 ${width * 0.75},0 ${width},${h * 0.5} ${width * 0.75},${h} ${width * 0.25},${h} 0,${h * 0.5}`;
  return (
    <Svg width={width} height={h}>
      <Polygon points={pts} fill={fill} />
    </Svg>
  );
}

function BadgeHex({
  badge,
  accent,
  size,
  iconSize,
}: {
  badge: BadgeProgress;
  accent: string;
  size: number;
  iconSize: number;
}) {
  const t = useTheme();
  const fill = badge.earned ? accent : t.colors.surfaceSecondary;
  const iconColor = badge.earned ? '#FFFFFF' : t.colors.textSecondary;
  return (
    <View style={{ width: size, height: size * 0.866, alignItems: 'center', justifyContent: 'center' }}>
      <Hexagon width={size} fill={fill} />
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={badge.icon} size={iconSize} color={iconColor} />
      </View>
    </View>
  );
}

/**
 * The full badge collection — every badge as a hexagon, earned ones in the profile accent,
 * still-locked ones muted with their progress (e.g. "2/3"). Tap any for how to earn it.
 * Own profile only (computed from private album data).
 */
export function BadgesCollection({
  albums,
  badges: badgesProp,
  accent,
}: {
  albums?: Album[];
  /** Pre-computed badges (e.g. another user's, from server aggregates). Falls back to `albums`. */
  badges?: BadgeProgress[];
  accent: string;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const badges = badgesProp ?? computeAllBadges(albums ?? []);
  const [selected, setSelected] = useState<BadgeProgress | null>(null);
  const earnedCount = badges.filter((b) => b.earned).length;

  const open = (b: BadgeProgress) => {
    haptics.light();
    setSelected(b);
  };

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
        <Text variant="h3">{tr('dna.badges')}</Text>
        <Text variant="small" color="textSecondary" style={{ marginLeft: 'auto' }}>
          {`${earnedCount}/${badges.length} ${tr('badgeSheet.unlockedCount')}`}
        </Text>
      </View>

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}
      >
        {badges.map((b) => (
          <Pressable key={b.key} onPress={() => open(b)} style={{ width: '31%', alignItems: 'center', gap: 6 }}>
            <BadgeHex badge={b} accent={accent} size={74} iconSize={26} />
            <Text
              variant="caption"
              center
              numberOfLines={2}
              style={{ fontWeight: '600', minHeight: 30, opacity: b.earned ? 1 : 0.6 }}
            >
              {tr(`badges.${b.key}`)}
            </Text>
            {b.earned ? (
              <Ionicons name="checkmark-circle" size={14} color={accent} />
            ) : (
              <Text variant="caption" color="textSecondary">{`${b.current}/${b.target}`}</Text>
            )}
          </Pressable>
        ))}
      </View>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable
          onPress={() => setSelected(null)}
          style={{
            flex: 1,
            backgroundColor: t.colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            padding: t.spacing.lg,
          }}
        >
          {selected && (
            <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 360 }}>
              <Card style={{ gap: t.spacing.md, alignItems: 'center' }}>
                <BadgeHex badge={selected} accent={accent} size={96} iconSize={38} />
                <Text variant="h2" center>
                  {tr(`badges.${selected.key}`)}
                </Text>
                <Text variant="body" color="textSecondary" center>
                  {tr(`badgeDesc.${selected.key}`)}
                </Text>

                {selected.earned ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={18} color={accent} />
                    <Text variant="small" style={{ color: accent, fontWeight: '700' }}>
                      {tr('badgeSheet.unlocked')}
                    </Text>
                  </View>
                ) : (
                  <View style={{ alignSelf: 'stretch', gap: 6 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: t.colors.surfaceSecondary,
                        overflow: 'hidden',
                      }}
                    >
                      <View style={{ flex: selected.current, backgroundColor: accent }} />
                      <View style={{ flex: Math.max(selected.target - selected.current, 0) }} />
                    </View>
                    <Text variant="caption" color="textSecondary" center>
                      {`${selected.current}/${selected.target}`}
                    </Text>
                  </View>
                )}

                <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>
                  <Button title={tr('badgeSheet.close')} onPress={() => setSelected(null)} />
                </View>
              </Card>
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
