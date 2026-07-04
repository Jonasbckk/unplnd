import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { usePlannerStore } from '@/features/planner/planner-store';
import { getCommunityPlan, toggleStar, type CommunityPlan } from '@/lib/community';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

export default function CommunityPlanDetail() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const loadIntoPlanner = usePlannerStore((s) => s.setPlan);
  const [plan, setPlan] = useState<CommunityPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    void getCommunityPlan(id).then((p) => {
      setPlan(p);
      if (p) {
        setStarred(p.starred);
        setCount(p.starCount);
      }
      setLoading(false);
    });
  }, [id]);

  const onStar = () => {
    if (!plan) return;
    haptics.light();
    const next = !starred;
    setStarred(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));
    void toggleStar(plan.id, starred);
  };

  const usePlan = () => {
    if (!plan) return;
    haptics.success();
    loadIntoPlanner({
      title: plan.title,
      summary: plan.summary ?? '',
      stops: plan.route,
      estimatedCost: '',
      duration: '',
      score: plan.selfRating ? Math.min(97, plan.selfRating * 18 + 7) : 88,
    });
    router.replace('/plan/route');
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={t.colors.primary} />
        </View>
      ) : !plan ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.spacing.lg }}>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('community.notFound')}
          </Text>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {plan.photos.length > 0 && (
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
                {plan.photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={{ width, height: 260 }} contentFit="cover" transition={200} />
                ))}
              </ScrollView>
            )}

            <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
              <Text variant="displayMedium">{plan.title}</Text>
              <Text variant="small" color="textSecondary">
                {tr('community.by', { name: plan.authorName ?? tr('community.someone') })}
                {plan.city ? ` · ${plan.city}` : ''}
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
                <Pressable onPress={onStar} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons
                    name={starred ? 'star' : 'star-outline'}
                    size={22}
                    color={starred ? t.colors.accentOrange : t.colors.textSecondary}
                  />
                  <Text variant="body" style={{ fontWeight: '600', color: starred ? t.colors.accentOrange : t.colors.textSecondary }}>
                    {count}
                  </Text>
                </Pressable>
                {plan.selfRating ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text variant="small" color="textSecondary">
                      {tr('community.creatorRated')}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons
                          key={n}
                          name={n <= (plan.selfRating ?? 0) ? 'star' : 'star-outline'}
                          size={13}
                          color={t.colors.accentOrange}
                        />
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

              {plan.summary ? (
                <Text variant="bodyLarge" color="textSecondary">
                  {plan.summary}
                </Text>
              ) : null}

              <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
                {plan.route.map((stop, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: t.spacing.base, paddingVertical: t.spacing.sm }}>
                    <Text variant="body" color="primary" style={{ width: 52, fontWeight: '600' }}>
                      {stop.time}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text variant="body" style={{ fontWeight: '600' }}>
                        {stop.title}
                      </Text>
                      <Text variant="small" color="textSecondary">
                        {stop.reason}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              padding: t.spacing.lg,
              paddingBottom: t.spacing.xl,
              backgroundColor: t.colors.background,
              borderTopWidth: 1,
              borderTopColor: t.colors.divider,
            }}
          >
            <Button title={tr('community.usePlan')} onPress={usePlan} />
          </View>
        </>
      )}
    </View>
  );
}
