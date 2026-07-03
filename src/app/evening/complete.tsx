import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';

import { Button, Logo, Screen, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useEveningStore } from '@/features/evening/evening-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { getCurrentLocation } from '@/lib/location';
import { notifyAlbumReady } from '@/lib/notifications';
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

  useEffect(() => {
    haptics.success();
  }, []);

  if (!evening) {
    return <Redirect href="/" />;
  }

  const completed = evening.stops.filter((s) => s.status === 'completed').length;
  const durationMin = Math.max(1, Math.round((Date.now() - new Date(evening.startedAt).getTime()) / 60000));
  const durationLabel = durationMin >= 60 ? `${Math.round(durationMin / 60)}h ${durationMin % 60}min` : `${durationMin}min`;

  return (
    <Screen contentStyle={{ flex: 1, justifyContent: 'center', gap: t.spacing.lg }}>
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

      <Animated.View entering={FadeInDown.duration(400).delay(200)} style={{ gap: t.spacing.md, marginTop: t.spacing.lg }}>
        <Button
          title={tr('complete.createAlbum')}
          loading={saving}
          onPress={async () => {
            setSaving(true);
            const location = await getCurrentLocation();
            const id = await createFromPlan(evening.plan, evening.mood, location?.city ?? '');
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
            await finishEvening();
            router.replace('/');
          }}
        />
      </Animated.View>
    </Screen>
  );
}
