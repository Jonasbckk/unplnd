import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useEveningStore } from '@/features/evening/evening-store';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { StopGallery } from '@/features/planner/StopGallery';
import { StopMeta } from '@/features/planner/StopMeta';
import { usePlannerStore } from '@/features/planner/planner-store';
import type { PlanStop } from '@/features/planner/types';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function SummaryStat({ icon, label }: { icon: IoniconName; label: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Ionicons name={icon} size={16} color={t.colors.textSecondary} />
      <Text variant="small" color="textSecondary">
        {label}
      </Text>
    </View>
  );
}

/** The generated evening — anticipation, not logistics (19_ROUTE). */
export default function RouteScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const plan = usePlannerStore((s) => s.plan);
  const mood = usePlannerStore((s) => s.answers.mood);
  const reset = usePlannerStore((s) => s.reset);
  const startEvening = useEveningStore((s) => s.startEvening);
  const favorites = useFavoritesStore((s) => s.places);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const [galleryStop, setGalleryStop] = useState<PlanStop | null>(null);

  useEffect(() => {
    void loadFavorites();
  }, [loadFavorites]);

  if (!plan) {
    return (
      <Screen contentStyle={{ flex: 1, justifyContent: 'center' }}>
        <Text variant="bodyLarge" center>
          {tr('route.error')}
        </Text>
      </Screen>
    );
  }

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" color="textSecondary" onPress={() => router.back()}>
          {tr('common.close')}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="sparkles" size={13} color={t.colors.primary} />
          <Text variant="small" color="textSecondary">
            {tr('route.experience', { score: plan.score })}
          </Text>
        </View>
      </View>

      <View style={{ gap: t.spacing.xs }}>
        <Text variant="displayMedium">{plan.title}</Text>
        <Text variant="bodyLarge" color="textSecondary">
          {plan.summary}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: t.spacing.lg }}>
        <SummaryStat icon="wallet-outline" label={plan.estimatedCost} />
        <SummaryStat icon="time-outline" label={plan.duration} />
        <SummaryStat icon="location-outline" label={tr('route.stops', { count: plan.stops.length })} />
      </View>

      {/* The evening as a connected route — a journey, not a list (19_ROUTE). */}
      <View>
        {plan.stops.map((stop, i) => {
          const isLast = i === plan.stops.length - 1;
          const isMemory = Boolean(stop.memoryMoment);
          return (
            <Animated.View
              key={i}
              entering={FadeInDown.duration(320).delay(140 + i * 70)}
              style={{ flexDirection: 'row', gap: t.spacing.base }}
            >
              {/* Rail: numbered waypoint + connecting line down to the next stop. */}
              <View style={{ width: 36, alignItems: 'center' }}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isMemory ? t.colors.accentOrange : t.colors.surfaceSecondary,
                    borderWidth: isMemory ? 0 : 1.5,
                    borderColor: t.colors.primary,
                  }}
                >
                  {isMemory ? (
                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  ) : (
                    <Text variant="small" style={{ color: t.colors.primary, fontWeight: '700' }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {!isLast && <View style={{ width: 2, flex: 1, backgroundColor: t.colors.border, marginTop: 2 }} />}
              </View>

              {/* Content */}
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : t.spacing.lg }}>
                <Card style={isMemory ? { borderWidth: 1.5, borderColor: t.colors.accentOrange } : undefined}>
                  {stop.photoUrl && (
                    <Pressable
                      onPress={() => {
                        haptics.light();
                        setGalleryStop(stop);
                      }}
                      style={{ marginBottom: t.spacing.md }}
                    >
                      <Image
                        source={{ uri: stop.photoUrl }}
                        style={{ width: '100%', height: 130, borderRadius: t.radius.md }}
                        contentFit="cover"
                        transition={200}
                      />
                      {(stop.photoNames?.length ?? 0) > 1 && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: t.radius.pill,
                          }}
                        >
                          <Ionicons name="images-outline" size={13} color="#FFFFFF" />
                          <Text variant="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                            {stop.photoNames?.length}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                  )}
                  <View style={{ gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                      <Text variant="small" color="primary" style={{ fontWeight: '700' }}>
                        {stop.time}
                      </Text>
                      <View style={{ flex: 1 }} />
                      {isMemory && <Ionicons name="sparkles" size={15} color={t.colors.accentOrange} />}
                      <Pressable
                        hitSlop={8}
                        onPress={() => {
                          haptics.light();
                          void toggleFavorite(stop.title);
                        }}
                      >
                        <Ionicons
                          name={favorites.includes(stop.title) ? 'heart' : 'heart-outline'}
                          size={18}
                          color={favorites.includes(stop.title) ? t.colors.primary : t.colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                    <Text variant="h3">{stop.title}</Text>
                    <StopMeta stop={stop} />
                    <Text variant="small" color="textSecondary">
                      {stop.reason}
                    </Text>
                  </View>
                </Card>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View entering={FadeInUp.duration(350).delay(140 + plan.stops.length * 70)} style={{ gap: t.spacing.md }}>
        <Button
          title={tr('route.startEvening')}
          onPress={() => {
            startEvening(plan, mood);
            reset();
            router.replace('/evening');
          }}
        />
        <Button
          title={tr('route.anotherIdea')}
          variant="secondary"
          onPress={() => router.replace('/plan/generating')}
        />
        <Button
          title={tr('route.planAnother')}
          variant="secondary"
          onPress={() => {
            reset();
            router.back();
          }}
        />
      </Animated.View>

      <StopGallery stop={galleryStop} onClose={() => setGalleryStop(null)} />
    </Screen>
  );
}
