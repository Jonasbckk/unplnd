import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Card, Skeleton, Text } from '@/components/ui';
import { VerifyBadge } from '@/features/verify/VerifyBadge';
import {
  getVerifyMetrics,
  resolveVerifyLevel,
  tierByLevel,
  tierProgress,
  TIERS,
  type MetricKey,
  type Tier,
  type VerifyMetrics,
} from '@/features/verify/verification';
import { maybeCelebrateTier } from '@/features/celebrate/celebrate-store';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

function Bar({ frac, color }: { frac: number; color: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 8, borderRadius: t.radius.pill, backgroundColor: t.colors.border, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, Math.max(0, frac * 100))}%`, height: '100%', backgroundColor: color, borderRadius: t.radius.pill }} />
    </View>
  );
}

export default function VerifyScreen() {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const router = useRouter();
  const showBadge = useAppStore((s) => s.showVerifyBadge);
  const setShowBadge = useAppStore((s) => s.setShowVerifyBadge);

  const [metrics, setMetrics] = useState<VerifyMetrics | null>(null);

  const [level, setLevel] = useState(0);

  useEffect(() => {
    void getVerifyMetrics().then(async (m) => {
      setMetrics(m);
      // Ratcheted: once a tier is earned it stays earned, even if the streak later breaks.
      const lvl = await resolveVerifyLevel(m);
      setLevel(lvl);
      maybeCelebrateTier(lvl);
    });
  }, []);

  const current = tierByLevel(level);
  // "Next" counts from the earned level — never re-offers a tier that's already yours.
  const next = tierByLevel(level + 1) ?? null;

  // Group thousands without Intl (Hermes-safe): 1000 -> "1.000" (de) / "1,000" (en).
  const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, locale === 'de' ? '.' : ',');
  const metricLabel = (key: MetricKey) => tr(`verify.metric.${key}`);
  const tierName = (tier: Tier) => tr(`verify.tier.${tier.id}.name`);
  const tierTag = (tier: Tier) => tr(`verify.tier.${tier.id}.tag`);

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
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
          <Text variant="h2">{tr('verify.title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        {!metrics ? (
          <View style={{ gap: t.spacing.base, alignItems: 'center', paddingTop: t.spacing.lg }}>
            <Skeleton height={130} width={130} radius={65} />
            <Skeleton height={22} width={180} radius={8} />
            <View style={{ alignSelf: 'stretch' }}>
              <Skeleton height={120} radius={t.radius.card} />
            </View>
          </View>
        ) : (
          <>
            {/* Hero — the current seal */}
            <Animated.View entering={FadeInUp.duration(360)} style={{ alignItems: 'center', gap: t.spacing.sm, paddingVertical: t.spacing.base }}>
              <VerifyBadge color={current?.color ?? '#8C8C8C'} size={132} animated={level > 0} locked={level === 0} />
              <Text variant="h2" center style={{ marginTop: t.spacing.sm }}>
                {current ? tierName(current) : tr('verify.notYet')}
              </Text>
              <Text variant="body" color="textSecondary" center>
                {current ? tierTag(current) : tr('verify.notYetSub')}
              </Text>
            </Animated.View>

            {/* Toggle: show the badge on your profile (only meaningful once verified) */}
            {level > 0 ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="body" style={{ flex: 1 }}>
                  {tr('verify.showOnProfile')}
                </Text>
                <Switch
                  value={showBadge}
                  onValueChange={setShowBadge}
                  trackColor={{ false: t.colors.border, true: t.colors.primary }}
                  thumbColor="#FFFFFF"
                />
              </Card>
            ) : null}

            {/* Progress to the next tier */}
            {next ? (
              <Card style={{ gap: t.spacing.md }}>
                <View>
                  <Text variant="small" color="textSecondary">
                    {tr('verify.nextTier')}
                  </Text>
                  <Text variant="h3">{tierName(next)}</Text>
                </View>
                {tierProgress(metrics, next).map((p) => (
                  <View key={p.key} style={{ gap: 5 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text variant="small">{metricLabel(p.key)}</Text>
                      <Text variant="small" color="textSecondary">
                        {fmt(Math.min(p.have, p.need))} / {fmt(p.need)}
                      </Text>
                    </View>
                    <Bar frac={p.need === 0 ? 1 : p.have / p.need} color={next.color} />
                  </View>
                ))}
              </Card>
            ) : (
              <Card>
                <Text variant="body" center>
                  {tr('verify.allUnlocked')}
                </Text>
              </Card>
            )}

            {/* The full ladder */}
            <Text variant="h3" style={{ marginTop: t.spacing.sm }}>
              {tr('verify.allTiers')}
            </Text>
            {TIERS.map((tier) => {
              const reached = level >= tier.level;
              const isCurrent = level === tier.level;
              const progress = tierProgress(metrics, tier);
              const met = progress.filter((p) => p.done).length;
              return (
                <Card
                  key={tier.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: t.spacing.md,
                    borderWidth: isCurrent ? 2 : 1,
                    borderColor: reached ? tier.color : t.colors.border,
                  }}
                >
                  <VerifyBadge color={tier.color} size={40} animated={false} locked={!reached} />
                  <View style={{ flex: 1, gap: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="body" style={{ fontWeight: '700', flex: 1 }} numberOfLines={1}>
                        {tierName(tier)}
                      </Text>
                      {reached ? (
                        <Ionicons name="checkmark-circle" size={18} color={tier.color} />
                      ) : (
                        <Text variant="caption" color="textSecondary">{`${met}/${progress.length}`}</Text>
                      )}
                    </View>
                    {/* Requirement progress at a glance — a filled dot per met requirement. */}
                    <View style={{ flexDirection: 'row', gap: 4 }}>
                      {progress.map((p) => (
                        <View
                          key={p.key}
                          style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: p.done ? tier.color : t.colors.border }}
                        />
                      ))}
                    </View>
                    <Text variant="caption" color="textSecondary" numberOfLines={1}>
                      {tierTag(tier)}
                    </Text>
                  </View>
                </Card>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}
