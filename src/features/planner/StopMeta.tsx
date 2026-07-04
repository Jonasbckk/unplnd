import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import type { PlanStop } from './types';

/** Real-place facts for a stop — rating, price, open-now (only shown when Places powered the plan). */
export function StopMeta({ stop }: { stop: PlanStop }) {
  const t = useTheme();
  const { t: tr } = useT();
  const hasRating = typeof stop.rating === 'number' && stop.rating > 0;
  const hasPrice = Boolean(stop.priceLevel);
  const hasOpen = typeof stop.openNow === 'boolean';
  // Closed right now but we know today's hours → reassure with the opening time. A plan is for
  // later, so a bare "closed now" is misleading. Grabs the first HH:MM (24h) or "5:00 PM" token.
  const opensAt = hasOpen && !stop.openNow ? stop.hours?.match(/\d{1,2}:\d{2}(?:\s?[AP]M)?/i)?.[0] : undefined;
  if (!hasRating && !hasPrice && !hasOpen) return null;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.spacing.md, marginTop: 2 }}>
      {hasRating && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Ionicons name="star" size={13} color={t.colors.accentOrange} />
          <Text variant="small" style={{ fontWeight: '600' }}>
            {stop.rating!.toFixed(1)}
          </Text>
          {typeof stop.ratingCount === 'number' && stop.ratingCount > 0 && (
            <Text variant="small" color="textSecondary">
              ({stop.ratingCount})
            </Text>
          )}
        </View>
      )}
      {hasPrice && (
        <Text variant="small" color="textSecondary">
          {stop.priceLevel}
        </Text>
      )}
      {hasOpen &&
        (stop.openNow ? (
          <Text variant="small" style={{ color: t.colors.success, fontWeight: '600' }}>
            {tr('route.openNow')}
          </Text>
        ) : opensAt ? (
          <Text variant="small" color="textSecondary" style={{ fontWeight: '600' }}>
            {tr('route.opensAt', { time: opensAt })}
          </Text>
        ) : (
          <Text variant="small" style={{ color: t.colors.error, fontWeight: '600' }}>
            {tr('route.closed')}
          </Text>
        ))}
    </View>
  );
}
