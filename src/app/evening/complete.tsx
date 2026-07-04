import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Card, Logo, Screen, StarRating, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useEveningStore } from '@/features/evening/evening-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { getCurrentLocation } from '@/lib/location';
import { notifyAlbumReady } from '@/lib/notifications';
import { savePlaceRatings, savePlanRating } from '@/lib/ratings';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

/** Evening completed — elegant celebration, then the memory album (19_ROUTE completion flow). */
export default function EveningComplete() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const evening = useEveningStore((s) => s.evening);
  const finishEvening = useEveningStore((s) => s.finishEvening);
  const createFromPlan = useAlbumsStore((s) => s.createFromPlan);
  const [saving, setSaving] = useState(false);
  const [planRating, setPlanRating] = useState(0);
  const [stopRatings, setStopRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    haptics.success();
  }, []);

  if (!evening) {
    return <Redirect href="/" />;
  }

  const completed = evening.stops.filter((s) => s.status === 'completed').length;
  const durationMin = Math.max(1, Math.round((Date.now() - new Date(evening.startedAt).getTime()) / 60000));
  const durationLabel = durationMin >= 60 ? `${Math.round(durationMin / 60)}h ${durationMin % 60}min` : `${durationMin}min`;
  const ratableStops = evening.plan.stops.filter((s) => s.placeId);

  const persistRatings = async () => {
    await Promise.all([
      savePlanRating(evening.planRowId, planRating),
      savePlaceRatings(
        Object.entries(stopRatings).map(([placeId, rating]) => ({
          placeId,
          placeName: evening.plan.stops.find((s) => s.placeId === placeId)?.title,
          rating,
        })),
      ),
    ]);
  };

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.xl, paddingTop: t.spacing.xxl, paddingBottom: t.spacing.lg }}>
      <Animated.View entering={FadeInUp.duration(450)} style={{ alignItems: 'center', gap: t.spacing.lg }}>
        <Logo size={64} />
        <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
          <Text variant="displayMedium" center>
            {tr('complete.title')}
          </Text>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('complete.stats', {
              stops: completed === 1 ? tr('complete.stopOne') : tr('complete.stopMany', { count: completed }),
              duration: durationLabel,
            })}
          </Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(150)}>
        <Card>
          <View style={{ gap: t.spacing.md }}>
            <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
              <Text variant="h3" center>
                {tr('complete.rateTitle')}
              </Text>
              <StarRating value={planRating} onChange={setPlanRating} />
            </View>
            {ratableStops.length > 0 && (
              <>
                <View style={{ height: 1, backgroundColor: t.colors.divider, marginVertical: t.spacing.xs }} />
                <Text variant="small" color="textSecondary">
                  {tr('complete.rateStops')}
                </Text>
                {ratableStops.map((s) => (
                  <View key={s.placeId} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {s.title}
                    </Text>
                    <StarRating
                      value={stopRatings[s.placeId as string] ?? 0}
                      onChange={(v) => setStopRatings((prev) => ({ ...prev, [s.placeId as string]: v }))}
                      size={20}
                    />
                  </View>
                ))}
              </>
            )}
          </View>
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(400).delay(250)} style={{ gap: t.spacing.md }}>
        <Button
          title={tr('complete.createAlbum')}
          loading={saving}
          onPress={async () => {
            setSaving(true);
            await persistRatings();
            const location = await getCurrentLocation();
            const id = await createFromPlan(evening.plan, evening.mood, location?.city ?? '', evening.planRowId);
            await finishEvening();
            setSaving(false);
            if (id) {
              if (useAppStore.getState().notificationPrefs.albumReady) {
                void notifyAlbumReady();
              }
              router.replace({ pathname: '/album/[id]', params: { id } });
            } else {
              router.replace('/');
            }
          }}
        />
        <Button
          title={tr('complete.maybeLater')}
          variant="secondary"
          onPress={async () => {
            await persistRatings();
            await finishEvening();
            router.replace('/');
          }}
        />
      </Animated.View>
    </Screen>
  );
}
