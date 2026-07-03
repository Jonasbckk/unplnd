import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { haptics } from '@/lib/haptics';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

function mostCommon(items: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item) continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

function Stat({ value, label }: { value: string | number; label: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Text variant="h1" color="textHeading">
        {value}
      </Text>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/** Profile — a personal story, not an account page (22_PROFILE). */
export default function ProfileScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const albums = useAlbumsStore((s) => s.albums);
  const loadAlbums = useAlbumsStore((s) => s.loadAlbums);
  const user = useAuthStore((s) => s.user);
  const favorites = useFavoritesStore((s) => s.places);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);

  useEffect(() => {
    void loadAlbums();
    void loadFavorites();
  }, [loadAlbums, loadFavorites]);

  const meta = user?.user_metadata as { display_name?: string } | undefined;
  const name = meta?.display_name ?? user?.email?.split('@')[0] ?? 'You';
  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const memories = albums.length;
  const cities = new Set(albums.map((a) => a.city).filter(Boolean)).size;
  const favoriteMoodValue = mostCommon(albums.map((a) => a.mood));
  const favoriteMood = favoriteMoodValue ? optionLabel(favoriteMoodValue) : '—';

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="h1" color="onPrimary">
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="h1">{name}</Text>
          <Text variant="small" color="textSecondary">
            {tr('profile.memberSince', { year: memberSince })}
          </Text>
        </View>
        <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={24} color={t.colors.textSecondary} />
        </Pressable>
      </View>

      <Card style={{ backgroundColor: t.colors.surfaceSecondary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
          <Stat value={memories} label={tr('profile.memories')} />
          <Stat value={cities} label={tr('profile.cities')} />
          <Stat value={favoriteMood} label={tr('profile.topMood')} />
        </View>
      </Card>

      {albums.length > 0 ? (
        <View style={{ gap: t.spacing.md }}>
          <Text variant="h3">{tr('profile.recentMemories')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.base }}>
            {albums.slice(0, 5).map((album) => (
              <Pressable
                key={album.id}
                onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
                style={{ width: 160 }}
              >
                <View
                  style={{
                    height: 104,
                    borderRadius: t.radius.md,
                    backgroundColor: album.coverColor,
                    justifyContent: 'flex-end',
                    padding: t.spacing.sm,
                  }}
                >
                  <Text variant="small" color="onPrimary" style={{ fontWeight: '600' }} numberOfLines={2}>
                    {album.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text variant="body" color="textSecondary">
          {tr('profile.emptyStory')}
        </Text>
      )}

      {favorites.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          <Text variant="h3">{tr('profile.savedPlaces')}</Text>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.base }}>
            {favorites.map((place, i) => (
              <View
                key={place}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                }}
              >
                <Ionicons name="location-outline" size={18} color={t.colors.primary} />
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {place}
                </Text>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    haptics.light();
                    void toggleFavorite(place);
                  }}
                >
                  <Ionicons name="heart" size={18} color={t.colors.primary} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View style={{ gap: t.spacing.md, marginTop: t.spacing.sm }}>
        {albums.length > 0 && (
          <Button
            title={tr('profile.statistics')}
            variant="secondary"
            /* '/stats' is a real route; cast only because the dev server's typed-route file
               regenerates on next `expo start`. */
            onPress={() => router.push('/stats' as Href)}
          />
        )}
        <Button title={tr('profile.settings')} variant="secondary" onPress={() => router.push('/settings')} />
      </View>
    </Screen>
  );
}
