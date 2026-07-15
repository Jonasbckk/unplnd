import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Screen, Text } from '@/components/ui';
import { MemoryCard } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { WeeklyChallenge } from '@/features/challenges/WeeklyChallenge';
import { useEveningStore } from '@/features/evening/evening-store';
import { getGreetingSegment } from '@/features/home/greeting';
import { HomeHero } from '@/features/home/HomeHero';
import { QUICK_CATEGORIES, startPlannerWithMood } from '@/features/planner/presets';
import { haptics } from '@/lib/haptics';
import { getCommunityPlans, type CommunityPlan } from '@/lib/community';
import { getDiscoverPlaces, type DiscoverPlace } from '@/lib/discover';
import { optionLabel, useT } from '@/lib/i18n';
import { getCurrentLocation } from '@/lib/location';
import { openInMaps } from '@/lib/maps';
import { getWeather, type Weather } from '@/lib/weather';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Home — the emotional center. One question: "What do I want to do today?" (17_HOME) */
export default function HomeScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const segment = getGreetingSegment();
  const albums = useAlbumsStore((s) => s.albums);
  const loadAlbums = useAlbumsStore((s) => s.loadAlbums);
  const evening = useEveningStore((s) => s.evening);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [nearby, setNearby] = useState<DiscoverPlace[]>([]);
  const [community, setCommunity] = useState<CommunityPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(
    async (force = false) => {
      await Promise.all([
        loadAlbums(),
        // Weather for the real position; no location → no card (never a wrong-city forecast).
        getCurrentLocation()
          .then((loc) => (loc ? getWeather(loc.latitude, loc.longitude) : null))
          .then(setWeather),
        // Real recommended places nearby; loads independently, hidden until ready (17_HOME).
        getDiscoverPlaces(undefined, force).then((r) => setNearby(r.places.slice(0, 6))),
        // Community evenings people published near you (Feature D) — surfaces the feed on Home.
        getCommunityPlans().then((r) => setCommunity(r.plans.slice(0, 6))),
      ]);
    },
    [loadAlbums],
  );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }, [loadData]);

  const currentStop = evening?.stops.find((s) => s.status === 'current');
  // Warm brand accents cycled across the idea tiles for a lively, colorful grid.
  const IDEA_COLORS = [t.colors.primary, t.colors.accentOrange, t.colors.accentOlive, t.colors.accentOcean];

  return (
    <Screen scroll onRefresh={onRefresh} refreshing={refreshing}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <HomeHero segment={segment} />
      </Animated.View>

      {/* Real weather via Open-Meteo; hidden until loaded, never an error state (17_HOME). */}
      {weather && (
        <Animated.View entering={FadeInDown.duration(350).delay(110)}>
          <Card
            onPress={() => startPlannerWithMood(weather.mood)}
            padded={false}
            style={{
              marginTop: t.spacing.md,
              backgroundColor: t.colors.surface,
              paddingVertical: t.spacing.md,
              paddingHorizontal: t.spacing.base,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
              <Ionicons name={weather.icon as IoniconName} size={30} color={t.colors.accentOrange} />
              <View style={{ minWidth: 78 }}>
                <Text variant="h2" style={{ color: t.colors.textHeading }}>
                  {weather.temperature}°C
                </Text>
                <Text variant="small" style={{ color: t.colors.primary, fontWeight: '600' }} numberOfLines={1}>
                  {tr(`weather.conditions.${weather.key}`)}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="small" color="textSecondary" numberOfLines={2}>
                  {tr(`weather.suggestions.${weather.key}`)}
                </Text>
                {weather.sunset ? (
                  <Text variant="caption" color="textSecondary">
                    {tr('home.sunset', { time: weather.sunset })}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={t.colors.textSecondary} />
            </View>
          </Card>
        </Animated.View>
      )}

      {/* One primary action: continue the active evening, or plan a new one. */}
      <Animated.View entering={FadeInDown.duration(350).delay(180)} style={{ marginTop: t.spacing.lg }}>
        {evening ? (
          <Card onPress={() => router.push('/evening')} style={{ backgroundColor: t.colors.primary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="small" color="onPrimary" style={{ opacity: 0.85 }}>
                  {tr('home.eveningLive')}
                </Text>
                <Text variant="h3" color="onPrimary">
                  {currentStop ? tr('home.next', { title: currentStop.title }) : evening.plan.title}
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
            </View>
          </Card>
        ) : (
          <Button
            title={tr('home.planMyEvening')}
            gradient
            iconRight="arrow-forward"
            onPress={() => router.navigate('/planner')}
          />
        )}
      </Animated.View>

      {/* This week's invitation — one idea for a real evening, fulfilled by living it (not by tapping). */}
      <Animated.View entering={FadeInDown.duration(350).delay(215)} style={{ marginTop: t.spacing.md }}>
        <WeeklyChallenge onAccept={() => router.navigate('/planner')} />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(350).delay(250)}>
        <Text variant="h3" style={{ marginTop: t.spacing.xl, marginBottom: t.spacing.md }}>
          {tr('home.quickIdeas')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}>
          {QUICK_CATEGORIES.map((category, i) => {
            const color = IDEA_COLORS[i % IDEA_COLORS.length];
            return (
              <Pressable
                key={category.label}
                onPress={() => {
                  haptics.selection();
                  startPlannerWithMood(category.mood);
                }}
                style={{ width: '23%', alignItems: 'center', gap: 6 }}
              >
                <View
                  style={{
                    width: '100%',
                    aspectRatio: 1,
                    borderRadius: t.radius.md,
                    backgroundColor: t.colors.card,
                    borderWidth: 1,
                    borderColor: t.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={category.icon} size={26} color={color} />
                </View>
                <Text variant="caption" numberOfLines={1}>
                  {optionLabel(category.label)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Animated.View>

      {nearby.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350).delay(300)} style={{ marginTop: t.spacing.xl, gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="h3">{tr('discover.nearby')}</Text>
            <Text
              variant="small"
              style={{ color: t.colors.primary, fontWeight: '600' }}
              onPress={() => router.navigate('/discover')}
            >
              {tr('common.seeAll')}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.base }}>
            {nearby.map((place) => (
              <Pressable key={place.id} onPress={() => openInMaps(place.name, place.id)} style={{ width: 160 }}>
                <View style={{ borderRadius: t.radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceSecondary }}>
                  {place.photoUrl ? (
                    <Image source={{ uri: place.photoUrl }} style={{ width: '100%', height: 96 }} contentFit="cover" transition={200} />
                  ) : (
                    <View style={{ width: '100%', height: 96, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={22} color={t.colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ padding: t.spacing.sm, gap: 3 }}>
                    <Text variant="small" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {place.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="star" size={11} color={t.colors.accentOrange} />
                      <Text variant="caption" color="textSecondary">
                        {place.rating.toFixed(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {community.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350).delay(340)} style={{ marginTop: t.spacing.xl, gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="h3">{tr('discover.communityTitle')}</Text>
            <Text
              variant="small"
              style={{ color: t.colors.primary, fontWeight: '600' }}
              onPress={() => router.push('/community' as Href)}
            >
              {tr('common.seeAll')}
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.base }}>
            {community.map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => router.push({ pathname: '/community/[id]', params: { id: plan.id } })}
                style={{ width: 200 }}
              >
                <View style={{ borderRadius: t.radius.md, overflow: 'hidden', backgroundColor: t.colors.surfaceSecondary }}>
                  {plan.photos[0] ? (
                    <Image source={{ uri: plan.photos[0] }} style={{ width: '100%', height: 110 }} contentFit="cover" transition={200} />
                  ) : (
                    <View style={{ width: '100%', height: 110, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={22} color={t.colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ padding: t.spacing.sm, gap: 3 }}>
                    <Text variant="small" style={{ fontWeight: '600' }} numberOfLines={1}>
                      {plan.title}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
                        {tr('community.by', { name: plan.authorName ?? tr('community.someone') })}
                      </Text>
                      {plan.starCount > 0 && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Ionicons name="star" size={11} color={t.colors.accentOrange} />
                          <Text variant="caption" color="textSecondary">
                            {plan.starCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {albums.length > 0 && (
        <Animated.View entering={FadeInDown.duration(350).delay(380)} style={{ marginTop: t.spacing.xl, gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="h3">{tr('home.recentMemories')}</Text>
            <Text
              variant="small"
              style={{ color: t.colors.primary, fontWeight: '600' }}
              onPress={() => router.navigate('/albums')}
            >
              {tr('common.seeAll')}
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: t.spacing.base }}
          >
            {albums.slice(0, 5).map((album) => (
              <MemoryCard
                key={album.id}
                album={album}
                compact
                width={150}
                onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Screen>
  );
}
