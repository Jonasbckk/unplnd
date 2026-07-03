import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { getDiscoverPlaces, type DiscoverPlace } from '@/lib/discover';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { requestLocationPermission } from '@/lib/location';
import { openInMaps } from '@/lib/maps';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

const CATEGORIES: { key?: string; labelKey: string; icon: IoniconName }[] = [
  { key: undefined, labelKey: 'all', icon: 'sparkles-outline' },
  { key: 'food', labelKey: 'food', icon: 'restaurant-outline' },
  { key: 'cafes', labelKey: 'cafes', icon: 'cafe-outline' },
  { key: 'drinks', labelKey: 'drinks', icon: 'wine-outline' },
  { key: 'nature', labelKey: 'nature', icon: 'leaf-outline' },
  { key: 'culture', labelKey: 'culture', icon: 'color-palette-outline' },
  { key: 'nightlife', labelKey: 'nightlife', icon: 'moon-outline' },
  { key: 'activities', labelKey: 'activities', icon: 'basketball-outline' },
];

function DiscoverCard({ place }: { place: DiscoverPlace }) {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const favorites = useFavoritesStore((s) => s.places);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const saved = favorites.includes(place.name);

  const distance =
    place.distanceM < 1000
      ? `${place.distanceM} m`
      : `${(place.distanceM / 1000).toFixed(1).replace('.', locale === 'de' ? ',' : '.')} km`;

  return (
    <Card padded={false} onPress={() => openInMaps(place.name, place.id)} style={{ overflow: 'hidden' }}>
      {place.photoUrl ? (
        <Image source={{ uri: place.photoUrl }} style={{ width: '100%', height: 150 }} contentFit="cover" transition={220} />
      ) : (
        <View
          style={{
            width: '100%',
            height: 150,
            backgroundColor: t.colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="image-outline" size={28} color={t.colors.textSecondary} />
        </View>
      )}
      <View style={{ padding: t.spacing.base, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Text variant="h3" style={{ flex: 1 }} numberOfLines={1}>
            {place.name}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={() => {
              haptics.light();
              void toggleFavorite(place.name);
            }}
          >
            <Ionicons
              name={saved ? 'heart' : 'heart-outline'}
              size={20}
              color={saved ? t.colors.primary : t.colors.textSecondary}
            />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.spacing.md }}>
          {place.rating > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="star" size={13} color={t.colors.accentOrange} />
              <Text variant="small" style={{ fontWeight: '600' }}>
                {place.rating.toFixed(1)}
              </Text>
              <Text variant="small" color="textSecondary">
                ({place.ratingCount})
              </Text>
            </View>
          )}
          {place.priceLevel && (
            <Text variant="small" color="textSecondary">
              {place.priceLevel}
            </Text>
          )}
          <Text variant="small" color="textSecondary">
            {distance}
          </Text>
          {typeof place.openNow === 'boolean' && (
            <Text variant="small" style={{ color: place.openNow ? t.colors.success : t.colors.error, fontWeight: '600' }}>
              {place.openNow ? tr('route.openNow') : tr('route.closed')}
            </Text>
          )}
        </View>

        {place.type && (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {place.type}
          </Text>
        )}
      </View>
    </Card>
  );
}

/** Discover — inspire, don't entertain endlessly. Leave with ONE idea (21_DISCOVER). */
export default function DiscoverScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);

  const load = useCallback(async (cat?: string) => {
    setLoading(true);
    const result = await getDiscoverPlaces(cat);
    setPlaces(result.places);
    setNeedsLocation(result.needsLocation);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(category);
  }, [category, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await getDiscoverPlaces(category, true);
    setPlaces(result.places);
    setNeedsLocation(result.needsLocation);
    setRefreshing(false);
  }, [category]);

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }} onRefresh={onRefresh} refreshing={refreshing}>
      <View>
        <Text variant="displayMedium">{tr('discover.title')}</Text>
        <Text variant="bodyLarge" color="textSecondary" style={{ marginTop: t.spacing.xs }}>
          {tr('discover.sub')}
        </Text>
      </View>

      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: t.spacing.sm, paddingRight: t.spacing.lg }}
      >
        {CATEGORIES.map((c) => {
          const selected = c.key === category;
          return (
            <Pressable
              key={c.labelKey}
              onPress={() => {
                haptics.selection();
                setCategory(c.key);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: t.spacing.base,
                paddingVertical: t.spacing.sm,
                borderRadius: t.radius.pill,
                backgroundColor: selected ? t.colors.primary : t.colors.surfaceSecondary,
              }}
            >
              <Ionicons name={c.icon} size={15} color={selected ? '#FFFFFF' : t.colors.primary} />
              <Text variant="small" color={selected ? 'onPrimary' : 'textPrimary'} style={{ fontWeight: '500' }}>
                {tr(`discover.categories.${c.labelKey}`)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {needsLocation ? (
        <View style={{ alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.xxl }}>
          <Ionicons name="location-outline" size={32} color={t.colors.primary} />
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('discover.needLocation')}
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>
            <Button
              title={tr('location.allow')}
              onPress={async () => {
                await requestLocationPermission();
                void load(category);
              }}
            />
          </View>
        </View>
      ) : loading ? (
        <View style={{ alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.xxl }}>
          <ActivityIndicator color={t.colors.primary} />
          <Text variant="small" color="textSecondary">
            {tr('discover.loading')}
          </Text>
        </View>
      ) : places.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: t.spacing.xxl }}>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('discover.empty')}
          </Text>
        </View>
      ) : (
        <View style={{ gap: t.spacing.base }}>
          <Text variant="h3">{tr('discover.nearby')}</Text>
          {places.map((place) => (
            <DiscoverCard key={place.id} place={place} />
          ))}
        </View>
      )}
    </Screen>
  );
}
