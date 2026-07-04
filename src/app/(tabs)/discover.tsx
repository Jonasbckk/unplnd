import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { Button, Card, EmptyState, FadeInUp, Input, Screen, Skeleton, Text } from '@/components/ui';
import { LocationChip } from '@/features/location/LocationChip';
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

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: IoniconName;
  active: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: t.spacing.base,
        paddingVertical: t.spacing.sm,
        borderRadius: t.radius.pill,
        borderWidth: 1,
        borderColor: active ? t.colors.primary : t.colors.border,
        backgroundColor: active ? t.colors.primary : 'transparent',
      }}
    >
      {icon && <Ionicons name={icon} size={14} color={active ? '#FFFFFF' : t.colors.textSecondary} />}
      <Text variant="small" color={active ? 'onPrimary' : 'textSecondary'} style={{ fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Discover — inspire, don't entertain endlessly. Leave with ONE idea (21_DISCOVER). */
export default function DiscoverScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState<string | undefined>(undefined);
  const [places, setPlaces] = useState<DiscoverPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [prices, setPrices] = useState<Set<string>>(new Set());
  const [maxKm, setMaxKm] = useState<number | null>(null);

  const load = useCallback(async (cat?: string, q?: string) => {
    setLoading(true);
    const result = await getDiscoverPlaces(cat, false, q);
    setPlaces(result.places);
    setNeedsLocation(result.needsLocation);
    setLoading(false);
  }, []);

  // Load by category on mount + category change — but not while a text search is active.
  useEffect(() => {
    if (activeQuery) return;
    void load(category);
  }, [category, activeQuery, load]);

  const runSearch = useCallback(() => {
    const q = query.trim();
    if (!q) return;
    haptics.selection();
    setActiveQuery(q);
    setCategory(undefined);
    void load(undefined, q);
  }, [query, load]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setActiveQuery(undefined); // the effect reloads the current category once this clears
  }, []);

  const selectCategory = useCallback((key?: string) => {
    haptics.selection();
    setQuery('');
    setActiveQuery(undefined);
    setCategory(key);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const result = await getDiscoverPlaces(category, true, activeQuery);
    setPlaces(result.places);
    setNeedsLocation(result.needsLocation);
    setRefreshing(false);
  }, [category, activeQuery]);

  const togglePrice = (p: string) =>
    setPrices((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });

  // Filters applied client-side on the fetched places (open-now · price · distance).
  const shown = places.filter(
    (p) =>
      (!onlyOpen || p.openNow === true) &&
      (prices.size === 0 || (p.priceLevel != null && prices.has(p.priceLevel))) &&
      (maxKm == null || p.distanceM <= maxKm * 1000),
  );

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }} onRefresh={onRefresh} refreshing={refreshing}>
      <View>
        <Text variant="displayMedium">{tr('discover.title')}</Text>
        <Text variant="bodyLarge" color="textSecondary" style={{ marginTop: t.spacing.xs }}>
          {tr('discover.sub')}
        </Text>
      </View>

      <LocationChip />

      {/* Community feed entry (Feature D). */}
      <Card
        onPress={() => router.push('/community' as Href)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, backgroundColor: t.colors.surfaceSecondary }}
      >
        <Ionicons name="people-outline" size={22} color={t.colors.primary} />
        <View style={{ flex: 1 }}>
          <Text variant="body" style={{ fontWeight: '600' }}>
            {tr('discover.communityTitle')}
          </Text>
          <Text variant="small" color="textSecondary">
            {tr('discover.communitySub')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={t.colors.textSecondary} />
      </Card>

      {/* Free-text search — "I want a great sushi place" (21_DISCOVER). */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Input
            value={query}
            onChangeText={setQuery}
            placeholder={tr('discover.searchPlaceholder')}
            returnKeyType="search"
            onSubmitEditing={runSearch}
          />
        </View>
        <Pressable
          onPress={activeQuery ? clearSearch : runSearch}
          hitSlop={8}
          style={{ padding: t.spacing.sm }}
        >
          <Ionicons
            name={activeQuery ? 'close-circle' : 'search'}
            size={activeQuery ? 22 : 20}
            color={activeQuery ? t.colors.textSecondary : t.colors.primary}
          />
        </Pressable>
      </View>

      {/* Category selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: t.spacing.sm, paddingRight: t.spacing.lg }}
      >
        {CATEGORIES.map((c) => {
          const selected = !activeQuery && c.key === category;
          return (
            <Pressable
              key={c.labelKey}
              onPress={() => selectCategory(c.key)}
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

      {/* Filters: open-now · price · distance (client-side on the fetched places). */}
      {!needsLocation && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: t.spacing.sm, paddingRight: t.spacing.lg }}
        >
          <FilterChip
            label={tr('discover.filterOpen')}
            icon="time-outline"
            active={onlyOpen}
            onPress={() => {
              haptics.selection();
              setOnlyOpen((v) => !v);
            }}
          />
          {(['€', '€€', '€€€', '€€€€'] as const).map((p) => (
            <FilterChip
              key={p}
              label={p}
              active={prices.has(p)}
              onPress={() => {
                haptics.selection();
                togglePrice(p);
              }}
            />
          ))}
          {([1, 3, 5] as const).map((km) => (
            <FilterChip
              key={km}
              label={`≤ ${km} km`}
              active={maxKm === km}
              onPress={() => {
                haptics.selection();
                setMaxKm((v) => (v === km ? null : km));
              }}
            />
          ))}
        </ScrollView>
      )}

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
        <View style={{ gap: t.spacing.base }}>
          <Skeleton height={22} width="45%" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} height={240} radius={t.radius.card} />
          ))}
        </View>
      ) : places.length === 0 ? (
        <EmptyState
          icon={activeQuery ? 'search-outline' : 'compass-outline'}
          title={activeQuery ? tr('discover.searchEmptyTitle') : tr('discover.emptyTitle')}
          body={activeQuery ? tr('discover.searchEmpty') : tr('discover.empty')}
        />
      ) : shown.length === 0 ? (
        <EmptyState icon="filter-outline" title={tr('discover.filterEmptyTitle')} body={tr('discover.filterEmpty')} />
      ) : (
        <View style={{ gap: t.spacing.base }}>
          <Text variant="h3">{activeQuery ? `„${activeQuery}"` : tr('discover.nearby')}</Text>
          {shown.map((place, i) => (
            <FadeInUp key={place.id} index={i}>
              <DiscoverCard place={place} />
            </FadeInUp>
          ))}
        </View>
      )}
    </Screen>
  );
}
