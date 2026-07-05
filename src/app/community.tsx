import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, EmptyState, FadeInUp, Skeleton, Text } from '@/components/ui';
import { getCommunityPlans, toggleStar, type CommunityPlan } from '@/lib/community';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { requestLocationPermission } from '@/lib/location';
import { useTheme } from '@/theme';

function CommunityCard({ plan }: { plan: CommunityPlan }) {
  const t = useTheme();
  const { t: tr, locale } = useT();
  const router = useRouter();
  const [starred, setStarred] = useState(plan.starred);
  const [count, setCount] = useState(plan.starCount);

  const onStar = () => {
    haptics.light();
    const next = !starred;
    setStarred(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    void toggleStar(plan.id, starred);
  };

  const distance =
    plan.distanceM == null
      ? null
      : plan.distanceM < 1000
        ? `${plan.distanceM} m`
        : `${(plan.distanceM / 1000).toFixed(1).replace('.', locale === 'de' ? ',' : '.')} km`;
  const meta = [plan.city, distance].filter(Boolean).join(' · ');
  const stops = plan.route
    .map((s) => s.title)
    .slice(0, 3)
    .join(' · ');

  return (
    <Card padded={false} onPress={() => router.push(`/community/${plan.id}` as Href)} style={{ overflow: 'hidden' }}>
      {plan.photos[0] ? (
        <Image source={{ uri: plan.photos[0] }} style={{ width: '100%', height: 190 }} contentFit="cover" transition={220} />
      ) : (
        <View style={{ width: '100%', height: 190, backgroundColor: t.colors.surfaceSecondary }} />
      )}
      <View style={{ padding: t.spacing.base, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
          <Pressable
            onPress={() => plan.authorId && router.push(`/user/${plan.authorId}` as Href)}
            disabled={!plan.authorId}
            hitSlop={4}
          >
            <Text
              variant="small"
              style={{
                color: plan.authorId ? t.colors.primary : t.colors.textSecondary,
                fontWeight: plan.authorId ? '600' : '400',
              }}
            >
              {tr('community.by', { name: plan.authorName ?? tr('community.someone') })}
            </Text>
          </Pressable>
          {meta ? (
            <Text variant="small" color="textSecondary">
              {` · ${meta}`}
            </Text>
          ) : null}
          {plan.isCustom ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                marginLeft: 6,
                backgroundColor: t.colors.surfaceSecondary,
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: t.radius.pill,
              }}
            >
              <Ionicons name="create-outline" size={11} color={t.colors.primary} />
              <Text variant="caption" style={{ color: t.colors.primary, fontWeight: '600' }}>
                {tr('community.customBadge')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="h3" numberOfLines={2}>
          {plan.title}
        </Text>
        {stops ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {stops}
            {plan.route.length > 3 ? ' …' : ''}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: t.spacing.xs }}>
          <Pressable
            onPress={onStar}
            hitSlop={8}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
          >
            <Ionicons
              name={starred ? 'star' : 'star-outline'}
              size={20}
              color={starred ? t.colors.accentOrange : t.colors.textSecondary}
            />
            <Text variant="small" style={{ fontWeight: '600', color: starred ? t.colors.accentOrange : t.colors.textSecondary }}>
              {count}
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

/** Community feed — real evenings other people published near you (Feature D). */
export default function CommunityScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const [plans, setPlans] = useState<CommunityPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [needsLocation, setNeedsLocation] = useState(false);

  const load = useCallback(async () => {
    const result = await getCommunityPlans();
    setPlans(result.plans);
    setNeedsLocation(result.needsLocation);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

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
          <Text variant="h2" style={{ flex: 1 }}>{tr('community.title')}</Text>
          <Pressable
            onPress={() => router.push('/plan/create' as Href)}
            hitSlop={8}
            accessibilityLabel={tr('createPlan.title')}
          >
            <Ionicons name="add-circle-outline" size={28} color={t.colors.primary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.base }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} />}
      >
        <Text variant="bodyLarge" color="textSecondary" style={{ marginBottom: t.spacing.sm }}>
          {tr('community.sub')}
        </Text>

        {needsLocation ? (
          <View style={{ alignItems: 'center', gap: t.spacing.base, paddingVertical: t.spacing.xxl }}>
            <Ionicons name="location-outline" size={32} color={t.colors.primary} />
            <Text variant="bodyLarge" color="textSecondary" center>
              {tr('community.needLocation')}
            </Text>
            <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>
              <Button
                title={tr('location.allow')}
                onPress={async () => {
                  await requestLocationPermission();
                  void load();
                }}
              />
            </View>
          </View>
        ) : loading ? (
          <View style={{ gap: t.spacing.base }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={264} radius={t.radius.card} />
            ))}
          </View>
        ) : plans.length === 0 ? (
          <EmptyState icon="people-outline" title={tr('community.emptyTitle')} body={tr('community.empty')} />
        ) : (
          plans.map((plan, i) => (
            <FadeInUp key={plan.id} index={i}>
              <CommunityCard plan={plan} />
            </FadeInUp>
          ))
        )}
      </ScrollView>
    </View>
  );
}
