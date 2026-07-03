import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button, Card, Screen, Text } from '@/components/ui';
import { isEveningDone, useEveningStore, type EveningStop } from '@/features/evening/evening-store';
import { StopMeta } from '@/features/planner/StopMeta';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { getCurrentLocation } from '@/lib/location';
import { openInMaps } from '@/lib/maps';
import { useTheme } from '@/theme';

function TimelineRow({ stop }: { stop: EveningStop }) {
  const t = useTheme();
  const done = stop.status === 'completed';
  const skipped = stop.status === 'skipped';
  const muted = done || skipped;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, opacity: muted ? 0.55 : 1 }}>
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: t.radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: done ? t.colors.success : skipped ? t.colors.border : t.colors.surfaceSecondary,
        }}
      >
        {done ? (
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
        ) : skipped ? (
          <Ionicons name="remove" size={15} color={t.colors.textSecondary} />
        ) : (
          <Text variant="caption" color="textSecondary">
            {stop.time}
          </Text>
        )}
      </View>
      <Text
        variant="body"
        color={muted ? 'textSecondary' : 'textPrimary'}
        style={skipped ? { textDecorationLine: 'line-through' } : undefined}
      >
        {stop.title}
      </Text>
    </View>
  );
}

/** The Evening Companion (19A) — guides the active evening, then gets out of the way. */
export default function EveningScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const evening = useEveningStore((s) => s.evening);
  const completeCurrentStop = useEveningStore((s) => s.completeCurrentStop);
  const skipCurrentStop = useEveningStore((s) => s.skipCurrentStop);

  const done = evening ? isEveningDone(evening) : false;

  useEffect(() => {
    if (evening && done) {
      router.replace('/evening/complete');
    }
  }, [evening, done, router]);

  if (!evening) {
    return <Redirect href="/" />;
  }

  const current = evening.stops.find((s) => s.status === 'current');
  const currentIndex = evening.stops.findIndex((s) => s.status === 'current');
  const completedCount = evening.stops.filter((s) => s.status === 'completed' || s.status === 'skipped').length;
  const progress = completedCount / evening.stops.length;

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="small" color="textSecondary" onPress={() => router.back()}>
          {tr('common.close')}
        </Text>
        <Text variant="small" color="textSecondary">
          {tr('evening.progress', {
            current: Math.min(currentIndex + 1, evening.stops.length),
            total: evening.stops.length,
          })}
        </Text>
      </View>

      <View>
        <Text variant="displayMedium">{evening.plan.title}</Text>
        <View
          style={{
            height: 6,
            borderRadius: t.radius.pill,
            backgroundColor: t.colors.border,
            marginTop: t.spacing.base,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              width: `${Math.max(progress * 100, 4)}%`,
              height: '100%',
              backgroundColor: t.colors.primary,
              borderRadius: t.radius.pill,
            }}
          />
        </View>
      </View>

      {current && (
        <Animated.View key={current.title} entering={FadeInDown.duration(320)}>
          <Card style={{ gap: t.spacing.md }}>
            {current.photoUrl && (
              <Image
                source={{ uri: current.photoUrl }}
                style={{ width: '100%', height: 160, borderRadius: t.radius.md }}
                contentFit="cover"
                transition={200}
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Text variant="small" color="primary" style={{ fontWeight: '600' }}>
                {current.time} · {tr('evening.now')}
              </Text>
              {current.memoryMoment && <Ionicons name="sparkles" size={15} color={t.colors.accentOrange} />}
            </View>
            <Text variant="h2">{current.title}</Text>
            <StopMeta stop={current} />
            <Text variant="body" color="textSecondary">
              {current.reason}
            </Text>

            <View style={{ gap: t.spacing.md, marginTop: t.spacing.sm }}>
              <Button
                title={tr('evening.navigate')}
                onPress={async () => {
                  if (current.placeId) {
                    openInMaps(current.title, current.placeId);
                    return;
                  }
                  const loc = await getCurrentLocation();
                  openInMaps(loc?.city ? `${current.title}, ${loc.city}` : current.title);
                }}
              />
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button
                    title={tr('evening.doneNext')}
                    variant="secondary"
                    onPress={() => {
                      haptics.success();
                      completeCurrentStop();
                    }}
                  />
                </View>
                <Pressable
                  onPress={() => {
                    haptics.selection();
                    skipCurrentStop();
                  }}
                  style={{ justifyContent: 'center', paddingHorizontal: t.spacing.base }}
                >
                  <Text variant="small" color="textSecondary">
                    {tr('common.skip')}
                  </Text>
                </Pressable>
              </View>
            </View>
          </Card>
        </Animated.View>
      )}

      <View style={{ gap: t.spacing.base }}>
        <Text variant="h3">{tr('evening.tonight')}</Text>
        <View style={{ gap: t.spacing.md }}>
          {evening.stops.map((stop, i) => (
            <TimelineRow key={i} stop={stop} />
          ))}
        </View>
      </View>

      {/* Finish early — the evening still counts and still becomes an album (19A). */}
      <Text
        variant="small"
        color="textSecondary"
        center
        onPress={() => router.replace('/evening/complete')}
        style={{ paddingVertical: t.spacing.md }}
      >
        {tr('evening.finishEarly')}
      </Text>
    </Screen>
  );
}
