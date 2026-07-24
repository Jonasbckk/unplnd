import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, FadeInUp, PressableScale, Skeleton, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { usePlannerStore } from '@/features/planner/planner-store';
import {
  blockUser,
  deletePublishedPlan,
  getCommunityPlan,
  reportPlan,
  toggleStar,
  type CommunityPlan,
} from '@/lib/community';
import { confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { toast } from '@/store/toast-store';
import { useShareStore } from '@/store/share-store';
import { useTheme } from '@/theme';

export default function CommunityPlanDetail() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const loadIntoPlanner = usePlannerStore((s) => s.setPlan);
  const me = useAuthStore((s) => s.user?.id);
  const [plan, setPlan] = useState<CommunityPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(false);
  const [count, setCount] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);

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

  const shareToChat = () => {
    if (!plan) return;
    useShareStore.getState().setPlan({
      title: plan.title,
      route: plan.route.map((s) => ({ time: s.time, title: s.title })),
      photo: plan.photos[0] ?? null,
      sourceId: plan.id,
    });
    router.push('/messages' as Href);
  };

  const onReport = async () => {
    if (!plan) return;
    const ok = await confirmDialog(
      tr('community.reportTitle'),
      tr('community.reportBody'),
      tr('community.report'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await reportPlan(plan.id);
    toast(tr('community.reported'));
    router.back();
  };

  const onBlock = async () => {
    if (!plan?.authorId) return;
    const ok = await confirmDialog(
      tr('community.blockTitle'),
      tr('community.blockBody'),
      tr('community.block'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await blockUser(plan.authorId);
    toast(tr('community.blocked'));
    router.back();
  };

  const isMine = !!me && !!plan && me === plan.authorId;

  const onDeletePublished = async () => {
    if (!plan) return;
    const ok = await confirmDialog(
      tr('community.deleteTitle'),
      tr('community.deleteBody'),
      tr('community.delete'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await deletePublishedPlan(plan.id);
    haptics.success();
    toast(tr('community.deleted'));
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }}>
          <PressableScale onPress={() => router.back()} feedback="light" hitTarget accessibilityLabel={tr('location.back')}>
            <Ionicons name="chevron-back" size={26} color={t.colors.textPrimary} />
          </PressableScale>
          {plan && (
            <PressableScale onPress={shareToChat} feedback="light" hitTarget accessibilityLabel={tr('messages.shareTitle')}>
              <Ionicons name="paper-plane-outline" size={22} color={t.colors.primary} />
            </PressableScale>
          )}
        </View>
      </SafeAreaView>

      {loading ? (
        // Skeleton mirrors the loaded layout: photo, title, author row, stop rows.
        <View style={{ flex: 1 }}>
          <Skeleton width="100%" height={260} radius={0} />
          <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
            <Skeleton width="60%" height={28} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
              <Skeleton width={34} height={34} radius={17} />
              <Skeleton width="45%" height={14} />
            </View>
            <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} height={64} radius={t.radius.card} />
              ))}
            </View>
          </View>
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
              <FadeInUp index={0}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) =>
                    setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))
                  }
                >
                  {plan.photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={{ width, height: 260 }} contentFit="cover" transition={200} />
                  ))}
                </ScrollView>

                {/* "Album" label + counter — makes clear these are the author's own photos and, when
                    there are several, that you can swipe for more (the dots reinforce it). */}
                <View
                  style={{
                    position: 'absolute',
                    top: t.spacing.md,
                    left: t.spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: t.radius.pill,
                  }}
                >
                  <Ionicons name="images-outline" size={13} color={t.colors.onPrimary} />
                  <Text variant="caption" style={{ color: t.colors.onPrimary, fontWeight: '700' }}>
                    {plan.photos.length > 1
                      ? `${tr('community.album')} · ${photoIndex + 1}/${plan.photos.length}`
                      : tr('community.album')}
                  </Text>
                </View>

                {plan.photos.length > 1 && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: t.spacing.md,
                      left: 0,
                      right: 0,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {plan.photos.map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: i === photoIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: i === photoIndex ? t.colors.onPrimary : 'rgba(255,255,255,0.55)',
                        }}
                      />
                    ))}
                  </View>
                )}
              </FadeInUp>
            )}

            <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
              <FadeInUp index={1} style={{ gap: t.spacing.md }}>
                <Text variant="displayMedium">{plan.title}</Text>
                <PressableScale
                  onPress={() => plan.authorId && router.push(`/user/${plan.authorId}` as Href)}
                  disabled={!plan.authorId}
                  feedback="light"
                  hitSlop={6}
                  accessibilityLabel={tr('community.by', { name: plan.authorName ?? tr('community.someone') })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, minHeight: 44 }}>
                    {plan.authorAvatar ? (
                      <Image source={{ uri: plan.authorAvatar }} style={{ width: 28, height: 28, borderRadius: 14 }} contentFit="cover" />
                    ) : (
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: t.colors.primary,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text variant="caption" color="onPrimary">
                          {(plan.authorName ?? '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text variant="small" color="textSecondary" style={{ flex: 1 }}>
                      {tr('community.by', { name: plan.authorName ?? tr('community.someone') })}
                      {plan.city ? ` · ${plan.city}` : ''}
                    </Text>
                    {plan.authorId ? <Ionicons name="chevron-forward" size={14} color={t.colors.textSecondary} /> : null}
                  </View>
                </PressableScale>

                {plan.isCustom ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      alignSelf: 'flex-start',
                      backgroundColor: t.colors.surfaceSecondary,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: t.radius.pill,
                    }}
                  >
                    <Ionicons name="create-outline" size={13} color={t.colors.primary} />
                    <Text variant="small" style={{ color: t.colors.primary, fontWeight: '600' }}>
                      {tr('community.customBadge')}
                    </Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.lg }}>
                  <PressableScale
                    onPress={onStar}
                    feedback="selection"
                    hitTarget
                    accessibilityLabel={tr('community.starsShort', { count })}
                    accessibilityState={{ selected: starred }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons
                        name={starred ? 'star' : 'star-outline'}
                        size={22}
                        color={starred ? t.colors.accentOrange : t.colors.textSecondary}
                      />
                      <Text variant="body" style={{ fontWeight: '600', color: starred ? t.colors.accentOrange : t.colors.textSecondary }}>
                        {count}
                      </Text>
                    </View>
                  </PressableScale>
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
              </FadeInUp>

              {plan.summary ? (
                <FadeInUp index={2}>
                  <Text variant="bodyLarge" color="textSecondary">
                    {plan.summary}
                  </Text>
                </FadeInUp>
              ) : null}

              <FadeInUp index={3}>
                {/* The route reads as one unit — stops grouped on a card surface. */}
                <View
                  style={{
                    gap: t.spacing.sm,
                    marginTop: t.spacing.sm,
                    backgroundColor: t.colors.surface,
                    borderRadius: t.radius.card,
                    borderWidth: t.scheme === 'dark' ? 1 : 0,
                    borderColor: t.colors.border,
                    paddingHorizontal: t.spacing.base,
                    paddingVertical: t.spacing.sm,
                  }}
                >
                  {plan.route.map((stop, i) => (
                    <View
                      key={i}
                      style={{ flexDirection: 'row', gap: t.spacing.base, paddingVertical: t.spacing.sm, alignItems: 'center' }}
                    >
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
                      {stop.photoUrl ? (
                        <Image
                          source={{ uri: stop.photoUrl }}
                          style={{ width: 56, height: 56, borderRadius: t.radius.md }}
                          contentFit="cover"
                          transition={200}
                        />
                      ) : null}
                    </View>
                  ))}
                </View>
              </FadeInUp>

              <FadeInUp index={4}>
                <View style={{ flexDirection: 'row', gap: t.spacing.lg, marginTop: t.spacing.md }}>
                  {isMine ? (
                    <PressableScale onPress={onDeletePublished} feedback="light" accessibilityLabel={tr('community.delete')}>
                      <View style={{ minHeight: 44, justifyContent: 'center' }}>
                        <Text variant="small" color="error" style={{ fontWeight: '600' }}>
                          {tr('community.delete')}
                        </Text>
                      </View>
                    </PressableScale>
                  ) : (
                    <>
                      <PressableScale onPress={onReport} feedback="light" accessibilityLabel={tr('community.report')}>
                        <View style={{ minHeight: 44, justifyContent: 'center' }}>
                          <Text variant="small" color="textSecondary">
                            {tr('community.report')}
                          </Text>
                        </View>
                      </PressableScale>
                      <PressableScale onPress={onBlock} feedback="light" accessibilityLabel={tr('community.block')}>
                        <View style={{ minHeight: 44, justifyContent: 'center' }}>
                          <Text variant="small" color="textSecondary">
                            {tr('community.block')}
                          </Text>
                        </View>
                      </PressableScale>
                    </>
                  )}
                </View>
              </FadeInUp>
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
            <FadeInUp index={3}>
              <Button title={tr('community.usePlan')} onPress={usePlan} gradient iconRight="arrow-forward" />
            </FadeInUp>
          </View>
        </>
      )}
    </View>
  );
}
