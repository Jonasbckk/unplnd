import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, StatementTitle, Text } from '@/components/ui';
import { getLiveEveningOf, type LiveEvening } from '@/features/evening/live-evening';
import { getPublicProfile } from '@/lib/community';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { openInMaps } from '@/lib/maps';
import { useTheme } from '@/theme';

/** Watch the friend's progress move — refreshed while you decide whether to head over. */
const POLL_MS = 30000;

/**
 * A friend's live evening, read-only (0038; 27_SOCIAL_VISION "Group Planning"). The whole point is
 * Rule 14: you see the stop they're at RIGHT NOW and open it in Maps — the app gets you to the
 * table, then gets out of the way.
 */
export default function FriendEveningScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { user } = useLocalSearchParams<{ user: string }>();
  const [evening, setEvening] = useState<LiveEvening | null>(null);
  const [name, setName] = useState('');
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const [live, profile] = await Promise.all([getLiveEveningOf(user), getPublicProfile(user)]);
    setEvening(live);
    setName(profile?.name ?? '');
    setLoaded(true);
  }, [user]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const current = evening?.stops.find((s) => s.status === 'current');

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: t.spacing.sm,
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={tr('location.back')}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
          {evening ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.colors.success }} />
              <Text variant="small" style={{ color: t.colors.success, fontWeight: '700' }}>
                {tr('liveEvening.liveNow')}
              </Text>
            </View>
          ) : null}
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, paddingBottom: t.spacing.xxl, gap: t.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        {!loaded ? null : !evening ? (
          <View style={{ paddingTop: t.spacing.xxl, alignItems: 'center', gap: t.spacing.md }}>
            <Ionicons name="moon-outline" size={34} color={t.colors.textSecondary} />
            <Text variant="body" color="textSecondary" center>
              {tr('liveEvening.over')}
            </Text>
          </View>
        ) : (
          <>
            <StatementTitle text={tr('liveEvening.title', { name: name || tr('community.someone') })} />
            <Text variant="body" color="textSecondary">
              {evening.title}
            </Text>

            {/* The one action that matters: get to where they are right now. */}
            {current ? (
              <Card style={{ borderWidth: 1.5, borderColor: t.colors.primary, gap: t.spacing.sm }}>
                <Text variant="caption" style={{ color: t.colors.primary, fontWeight: '700', letterSpacing: 1 }}>
                  {tr('liveEvening.rightNow').toUpperCase()}
                </Text>
                <Text variant="h2">{current.title}</Text>
                {current.address ? (
                  <Text variant="small" color="textSecondary" numberOfLines={2}>
                    {current.address}
                  </Text>
                ) : null}
                <Button
                  title={tr('liveEvening.joinThere')}
                  gradient
                  iconRight="navigate"
                  onPress={() => {
                    haptics.success();
                    openInMaps(current.address ?? current.title, current.placeId);
                  }}
                />
              </Card>
            ) : null}

            {/* The rest of their route, read-only. */}
            <View style={{ gap: t.spacing.sm }}>
              {evening.stops.map((stop, i) => {
                const done = stop.status === 'completed' || stop.status === 'skipped';
                const isCurrent = stop.status === 'current';
                return (
                  <Animated.View
                    key={i}
                    entering={FadeInDown.duration(300).delay(i * 60)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, opacity: done ? 0.45 : 1 }}
                  >
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: done || isCurrent ? t.colors.primary : t.colors.surfaceSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {done ? (
                        <Ionicons name="checkmark" size={14} color={t.colors.onPrimary} />
                      ) : (
                        <Text variant="caption" style={{ color: isCurrent ? t.colors.onPrimary : t.colors.textSecondary, fontWeight: '700' }}>
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        variant="body"
                        numberOfLines={1}
                        style={{ fontWeight: isCurrent ? '700' : '400' }}
                        color={isCurrent ? 'textPrimary' : done ? 'textSecondary' : 'textPrimary'}
                      >
                        {stop.title}
                      </Text>
                      <Text variant="caption" color="textSecondary">
                        {stop.time}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
