import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, FadeInUp, Screen, Skeleton, Text } from '@/components/ui';
import { MemoryCard } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** Albums — emotional artifacts, not a photo gallery (Constitution Rule 13). Backed by Supabase. */
export default function AlbumsScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const albums = useAlbumsStore((s) => s.albums);
  const loading = useAlbumsStore((s) => s.loading);
  const loaded = useAlbumsStore((s) => s.loaded);
  const loadAlbums = useAlbumsStore((s) => s.loadAlbums);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void loadAlbums();
  }, [loadAlbums]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlbums();
    setRefreshing(false);
  }, [loadAlbums]);

  if (loading && !loaded) {
    return (
      <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
        <Text variant="displayMedium">{tr('albums.title')}</Text>
        <View style={{ gap: t.spacing.base }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={198} radius={t.radius.card} />
          ))}
        </View>
      </Screen>
    );
  }

  if (albums.length === 0) {
    return (
      <Screen contentStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: t.spacing.md }}>
        <Text variant="displayMedium" center>
          {tr('albums.emptyTitle')}
        </Text>
        <Text variant="bodyLarge" color="textSecondary" center>
          {tr('albums.emptyBody')}
        </Text>
        <View style={{ marginTop: t.spacing.base, alignSelf: 'stretch' }}>
          <Button title={tr('albums.planTonight')} onPress={() => router.navigate('/planner')} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }} onRefresh={onRefresh} refreshing={refreshing}>
      <Text variant="displayMedium">{tr('albums.title')}</Text>
      <View style={{ gap: t.spacing.base }}>
        {albums.map((album, i) => (
          <FadeInUp key={album.id} index={i}>
            <MemoryCard
              album={album}
              onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
            />
          </FadeInUp>
        ))}
      </View>
    </Screen>
  );
}
