import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { EveningStop } from '@/features/evening/evening-store';
import { i18n } from '@/lib/i18n';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Explain-then-ask lives in onboarding; this triggers the OS prompt (16_ONBOARDING). */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

function stopTimeToday(time: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;
  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return date;
}

/**
 * One gentle reminder per upcoming stop, at its planned time — never spam (33_NOTIFICATIONS).
 * No-op on web; silently skips stops whose time already passed.
 */
export async function scheduleStopReminders(stops: EveningStop[]): Promise<void> {
  if (!isNative) return;
  const now = Date.now();
  for (const stop of stops) {
    if (stop.status !== 'upcoming') continue;
    const at = stopTimeToday(stop.time);
    if (!at || at.getTime() <= now + 60_000) continue;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifs.nextStopTitle'),
        body: stop.title,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
}

/** The evening ended or was left — clear every pending reminder. */
export async function cancelEveningReminders(): Promise<void> {
  if (!isNative) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/** One notification only, never remind again (33_NOTIFICATIONS: Albums). */
export async function notifyAlbumReady(): Promise<void> {
  if (!isNative) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifs.albumReadyTitle'),
      body: i18n.t('notifs.albumReadyBody'),
    },
    trigger: null,
  });
}
