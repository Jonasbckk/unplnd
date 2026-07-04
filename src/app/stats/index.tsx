import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, EmptyState, Text, useCountUp } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function mostCommon(values: (string | undefined)[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

function StatCard({ icon, value, label }: { icon: IoniconName; value: string | number; label: string }) {
  const t = useTheme();
  const counted = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <Card style={{ flex: 1, gap: 6 }}>
      <Ionicons name={icon} size={20} color={t.colors.primary} />
      <Text variant="h1">{typeof value === 'number' ? counted : value}</Text>
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </Card>
  );
}

/** "Your evenings in numbers" — emotional artifacts, never vanity metrics (Constitution). */
export default function StatsScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const albums = useAlbumsStore((s) => s.albums);
  const loadAlbums = useAlbumsStore((s) => s.loadAlbums);

  useEffect(() => {
    void loadAlbums();
  }, [loadAlbums]);

  const stats = useMemo(() => {
    const evenings = albums.length;
    const cities = new Set(albums.map((a) => a.city).filter(Boolean)).size;
    const stops = albums.reduce((sum, a) => sum + (a.timeline?.length ?? 0), 0);
    const photos = albums.reduce((sum, a) => sum + (a.photoCount ?? 0), 0);
    const topMood = mostCommon(albums.map((a) => a.mood));
    const moodCounts = new Map<string, number>();
    for (const a of albums) {
      if (a.mood) moodCounts.set(a.mood, (moodCounts.get(a.mood) ?? 0) + 1);
    }
    const moods = [...moodCounts.entries()].sort((a, b) => b[1] - a[1]);
    return { evenings, cities, stops, photos, topMood, moods };
  }, [albums]);

  const maxMood = stats.moods.length ? stats.moods[0][1] : 1;
  const heroCount = useCountUp(stats.evenings, 900);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, padding: t.spacing.lg }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name={'chevron-back' as IoniconName} size={26} color={t.colors.textHeading} />
          </Pressable>
          <Text variant="h1">{tr('stats.title')}</Text>
        </View>

        {albums.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <EmptyState icon="bar-chart-outline" title={tr('stats.emptyTitle')} body={tr('stats.empty')} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.lg }}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(360)}>
              <Card style={{ backgroundColor: t.colors.primary, alignItems: 'center', paddingVertical: t.spacing.xl }}>
                <Text style={{ color: '#FFFFFF', fontSize: 64, fontWeight: '800', lineHeight: 68 }}>
                  {heroCount}
                </Text>
                <Text variant="bodyLarge" color="onPrimary" style={{ opacity: 0.9 }}>
                  {tr('stats.heroLabel')}
                </Text>
              </Card>
            </Animated.View>

            {/* Stat grid */}
            <Animated.View entering={FadeInDown.duration(360).delay(80)} style={{ gap: t.spacing.base }}>
              <View style={{ flexDirection: 'row', gap: t.spacing.base }}>
                <StatCard icon="location-outline" value={stats.cities} label={tr('stats.cities')} />
                <StatCard icon="footsteps-outline" value={stats.stops} label={tr('stats.stops')} />
              </View>
              <View style={{ flexDirection: 'row', gap: t.spacing.base }}>
                <StatCard icon="image-outline" value={stats.photos} label={tr('stats.photos')} />
                <StatCard
                  icon="sparkles-outline"
                  value={stats.topMood ? optionLabel(stats.topMood) : '—'}
                  label={tr('stats.topMood')}
                />
              </View>
            </Animated.View>

            {/* Moods breakdown */}
            {stats.moods.length >= 2 && (
              <Animated.View entering={FadeInDown.duration(360).delay(160)} style={{ gap: t.spacing.md }}>
                <Text variant="h3">{tr('stats.moods')}</Text>
                <Card style={{ gap: t.spacing.md }}>
                  {stats.moods.map(([mood, count]) => (
                    <View key={mood} style={{ gap: 6 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text variant="small" style={{ fontWeight: '600' }}>
                          {optionLabel(mood)}
                        </Text>
                        <Text variant="small" color="textSecondary">
                          {count}
                        </Text>
                      </View>
                      <View style={{ height: 8, borderRadius: 4, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' }}>
                        <View
                          style={{
                            width: `${Math.max((count / maxMood) * 100, 6)}%`,
                            height: '100%',
                            borderRadius: 4,
                            backgroundColor: t.colors.accentOrange,
                          }}
                        />
                      </View>
                    </View>
                  ))}
                </Card>
              </Animated.View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
