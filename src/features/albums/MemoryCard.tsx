import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import { dateLocale, i18n } from '@/lib/i18n';
import { useTheme } from '@/theme';
import type { Album } from './types';

export function formatAlbumDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

/** A memory as a card — cover band + title + date. Tap to open the album. */
export function MemoryCard({ album, onPress }: { album: Album; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{ borderRadius: t.radius.card, overflow: 'hidden', backgroundColor: t.colors.card, ...t.shadows.sm }}
    >
      <View style={{ height: 128, backgroundColor: album.coverColor, justifyContent: 'space-between', padding: t.spacing.base }}>
        <View style={{ alignItems: 'flex-end' }}>
          {album.favorite && <Ionicons name="heart" size={18} color="#FFFFFF" />}
        </View>
        <Text variant="h2" color="onPrimary">
          {album.title}
        </Text>
      </View>
      <View style={{ padding: t.spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" color="textSecondary">
          {formatAlbumDate(album.date)}
          {album.city ? ` · ${album.city}` : ''}
        </Text>
        <Text variant="small" color="textSecondary">
          {i18n.t('albums.photos', { count: album.photoCount })}
        </Text>
      </View>
    </Pressable>
  );
}
