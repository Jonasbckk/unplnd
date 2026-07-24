import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn, useReducedMotion } from 'react-native-reanimated';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useEveningStore } from '@/features/evening/evening-store';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { StopGallery } from '@/features/planner/StopGallery';
import { StopMeta } from '@/features/planner/StopMeta';
import { usePlannerStore } from '@/features/planner/planner-store';
import { swapStop } from '@/features/planner/generate-service';
import type { PlanStop } from '@/features/planner/types';
import { getCurrentLocation } from '@/lib/location';
import { toast } from '@/store/toast-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

// Transport mode → icon for the between-stop connector.
const TRAVEL_ICON: Record<string, IoniconName> = {
  walk: 'walk-outline',
  bike: 'bicycle-outline',
  transit: 'bus-outline',
  car: 'car-outline',
  taxi: 'car-sport-outline',
};

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

/**
 * A roadmap waypoint: a glowing map-pin that springs in, with the route line growing down to the
 * next stop. The memory moment is a bigger, orange, glowing pin. Reduce Motion → static.
 */
function Waypoint({
  index,
  isMemory,
  isLast,
  reduced,
}: {
  index: number;
  isMemory: boolean;
  isLast: boolean;
  reduced: boolean;
}) {
  const t = useTheme();
  return (
    <View style={{ width: 40, alignItems: 'center' }}>
      <Animated.View
        entering={reduced ? undefined : ZoomIn.duration(380).delay(150 + index * 90).springify().damping(13)}
        style={[
          {
            width: isMemory ? 38 : 32,
            height: isMemory ? 38 : 32,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isMemory ? t.colors.accentOrange : t.colors.card,
            borderWidth: isMemory ? 0 : 2,
            borderColor: t.colors.primary,
          },
          isMemory
            ? {
                shadowColor: t.colors.accentOrange,
                shadowOpacity: 0.55,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              }
            : t.shadows.sm,
        ]}
      >
        {isMemory ? (
          <Ionicons name="sparkles" size={17} color="#FFFFFF" />
        ) : (
          <Text variant="small" style={{ color: t.colors.primary, fontWeight: '700' }}>
            {index + 1}
          </Text>
        )}
      </Animated.View>
      {!isLast && (
        <Animated.View
          entering={reduced ? undefined : FadeIn.duration(450).delay(230 + index * 90)}
          style={{ width: 3, flex: 1, backgroundColor: t.colors.primary, opacity: 0.3, marginTop: 5, borderRadius: 2 }}
        />
      )}
    </View>
  );
}

/** The generated evening — anticipation, not logistics (19_ROUTE). */
export default function RouteScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const reduced = useReducedMotion();
  const plan = usePlannerStore((s) => s.plan);
  const mood = usePlannerStore((s) => s.answers.mood);
  const reset = usePlannerStore((s) => s.reset);
  const answers = usePlannerStore((s) => s.answers);
  const setPlan = usePlannerStore((s) => s.setPlan);
  const [swapping, setSwapping] = useState<number | null>(null);

  /**
   * Replace ONE stop. Liking 2 of 3 stops shouldn't force you to reroll all three — so we keep the
   * evening and ask only for this slot. Failure leaves the plan untouched and says why.
   */
  const onSwap = async (index: number) => {
    if (!plan || swapping !== null) return;
    haptics.light();
    setSwapping(index);
    const location = await getCurrentLocation();
    if (!location) {
      setSwapping(null);
      toast(tr('route.swapFailed'));
      return;
    }
    const result = await swapStop(answers, location, plan, index);
    setSwapping(null);
    if (!result.ok) {
      toast(tr(result.kind === 'no_options' ? 'route.swapNoOptions' : 'route.swapFailed'));
      return;
    }
    haptics.success();
    // Keep the connector of the slot we replaced — the travel leg belongs to the position, not the venue.
    const stops = plan.stops.map((s0, i) => (i === index ? { ...result.stop, travel: s0.travel } : s0));
    setPlan({ ...plan, stops });
    toast(tr('route.swapped'));
  };
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
              {/* Rail: animated map-style waypoint + route line down to the next stop. */}
              <Waypoint index={i} isMemory={isMemory} isLast={isLast} reduced={reduced} />

              {/* Content */}
              <View style={{ flex: 1, paddingBottom: isLast ? 0 : t.spacing.lg }}>
                {/* Connector: how you got here from the last stop (mode · minutes · rough cost). */}
                {stop.travel && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: t.spacing.sm }}>
                    <Ionicons
                      name={TRAVEL_ICON[stop.travel.mode] ?? 'navigate-outline'}
                      size={14}
                      color={t.colors.textSecondary}
                    />
                    <Text variant="caption" color="textSecondary">
                      {stop.travel.toHome
                        ? tr('route.travelHome')
                        : `${tr('route.travelMinutes', { count: stop.travel.minutes })}${stop.travel.cost ? ` · ${stop.travel.cost}` : ''}`}
                    </Text>
                  </View>
                )}
                <Card style={isMemory ? { borderWidth: 1.5, borderColor: t.colors.accentOrange } : undefined}>
                  {stop.photoUrl && !stop.mystery && (
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
                            backgroundColor: t.colors.overlay,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: t.radius.pill,
                          }}
                        >
                          <Ionicons name="images-outline" size={13} color={t.colors.onPrimary} />
                          <Text variant="small" style={{ color: t.colors.onPrimary, fontWeight: '600' }}>
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
                      {/* Swap just this stop — the rest of the evening stays. Only for real venues. */}
                      {stop.placeId && !stop.mystery ? (
                        <Pressable
                          hitSlop={8}
                          disabled={swapping !== null}
                          onPress={() => void onSwap(i)}
                          accessibilityRole="button"
                          accessibilityLabel={tr('route.swap')}
                        >
                          {swapping === i ? (
                            <ActivityIndicator size="small" color={t.colors.primary} />
                          ) : (
                            <Ionicons
                              name="swap-horizontal"
                              size={18}
                              color={swapping !== null ? t.colors.border : t.colors.textSecondary}
                            />
                          )}
                        </Pressable>
                      ) : null}
                      <Pressable
                        hitSlop={13}
                        accessibilityRole="button"
                        accessibilityLabel={stop.title}
                        accessibilityState={{ selected: favorites.includes(stop.title) }}
                        onPress={() => {
                          haptics.light();
                          void toggleFavorite(stop.title).then((r) => {
                            if (r === 'limit') {
                              toast(tr('paywall.favoritesLimit'));
                              router.push('/paywall' as Href);
                            }
                          });
                        }}
                      >
                        <Ionicons
                          name={favorites.includes(stop.title) ? 'heart' : 'heart-outline'}
                          size={18}
                          color={favorites.includes(stop.title) ? t.colors.primary : t.colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                    {stop.mystery ? (
                      // "Überrasch mich": the peak stays hidden until you stand in front of it.
                      // Nothing that identifies it — no name, no photo, no rating.
                      <View style={{ gap: 6 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                          <View
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 15,
                              backgroundColor: t.colors.accentOrange + '26',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="help" size={17} color={t.colors.accentOrange} />
                          </View>
                          <Text variant="h3" style={{ color: t.colors.accentOrange }}>
                            {tr('route.mysteryTitle')}
                          </Text>
                        </View>
                        <Text variant="small" color="textSecondary">
                          {tr('route.mysteryBody')}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <Text variant="h3">{stop.title}</Text>
                        <StopMeta stop={stop} />
                        <Text variant="small" color="textSecondary">
                          {stop.reason}
                        </Text>
                      </>
                    )}
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
          variant="secondary"
          title={tr('route.planAnother')}
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
