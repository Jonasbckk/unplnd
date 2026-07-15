import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { weeklyChallenge } from './challenges';

/**
 * This week's invitation — one idea for a real evening, and a quiet "done" once you've lived it.
 * No points, no rank, no countdown (22_PROFILE lists Challenges; docs: no XP/level system).
 * Tapping an open invitation takes you to the Planner — the point is to go out, not to tap.
 */
export function WeeklyChallenge({ onAccept }: { onAccept: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const albums = useAlbumsStore((s) => s.albums);
  const { challenge, done } = useMemo(() => weeklyChallenge(albums, new Date()), [albums]);

  const title = tr(`challenges.${challenge.key}.title`);
  const body = done ? tr('challenges.done') : tr(`challenges.${challenge.key}.body`);

  return (
    <Card
      padded={false}
      onPress={done ? undefined : onAccept}
      accessibilityLabel={`${tr('challenges.thisWeek')}: ${title}. ${body}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        paddingVertical: t.spacing.md,
        paddingHorizontal: t.spacing.base,
        backgroundColor: done ? t.colors.primary + '14' : t.colors.surface,
        borderWidth: 1,
        borderColor: done ? t.colors.primary + '40' : t.colors.border,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: t.radius.pill,
          backgroundColor: t.colors.primary + '1A',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={done ? 'checkmark' : challenge.icon} size={17} color={t.colors.primary} />
      </View>

      <View style={{ flex: 1, gap: 1 }}>
        <Text variant="caption" color="textSecondary">
          {tr('challenges.thisWeek')}
        </Text>
        <Text variant="small" style={{ fontWeight: '600' }} numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" color="textSecondary" numberOfLines={1}>
          {body}
        </Text>
      </View>

      {done ? null : <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />}
    </Card>
  );
}
