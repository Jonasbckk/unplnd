import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { WorldMap } from './WorldMap';
import { cityCount, pinsFromAlbums } from './pins';

/**
 * The Memory Map on the profile — where your evenings actually happened
 * (22_PROFILE, between Statistics and Recent Albums).
 *
 * Kept deliberately quiet: 06_COLORS says "The map should never compete with the UI", so the world
 * sits barely above the card and only the pins carry the accent.
 */
export function MemoryMap({ accent, onOpen }: { accent: string; onOpen: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const albums = useAlbumsStore((s) => s.albums);
  const [width, setWidth] = useState(0);

  const pins = useMemo(() => pinsFromAlbums(albums), [albums]);

  // Nothing to tell yet — an empty world would just look broken.
  if (pins.length === 0) return null;

  const cities = cityCount(pins);

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
        <Text variant="h3">{tr('map.title')}</Text>
      </View>

      <Card
        padded={false}
        accessibilityLabel={`${tr('map.title')}. ${tr('map.summary', { cities, evenings: pins.length })}`}
        onPress={() => {
          haptics.light();
          onOpen();
        }}
        style={{ overflow: 'hidden' }}
      >
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {width > 0 ? (
            <WorldMap
              pins={pins}
              width={width}
              height={Math.round(width * 0.56)}
              fitToPins
              colors={{
                water: t.colors.surface,
                land: t.colors.surfaceSecondary,
                border: t.colors.border,
                pin: accent,
                pinText: '#1a120c',
                friend: t.colors.accentOcean,
              }}
            />
          ) : (
            <View style={{ height: 150 }} />
          )}
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: t.spacing.md,
            paddingHorizontal: t.spacing.base,
          }}
        >
          <Text variant="small" color="textSecondary">
            {tr('map.summary', { cities, evenings: pins.length })}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text variant="small" style={{ color: accent, fontWeight: '600' }}>
              {tr('map.open')}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={accent} />
          </View>
        </View>
      </Card>
    </View>
  );
}
