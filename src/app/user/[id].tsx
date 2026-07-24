import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, FadeInUp, Text, useCountUp } from '@/components/ui';
import { normalizeMoodCounts } from '@/features/albums/mood';
import { useAuthStore } from '@/features/auth/auth-store';
import { BadgesCollection } from '@/features/profile/BadgesCollection';
import { EveningDNA } from '@/features/profile/EveningDNA';
import { ProfileBanner } from '@/features/profile/ProfileBanner';
import { ProfileExtras } from '@/features/profile/ProfileExtras';
import { ProfileHighlights } from '@/features/profile/ProfileHighlights';
import { computeAllBadgesFromCtx, computeDNAFromMoodCounts } from '@/features/profile/evening-dna';
import { getProfileStyle } from '@/features/profile/profile-styles';
import { VerifyBadge } from '@/features/verify/VerifyBadge';
import { currentTierLevel, effectiveVerifyLevel, tierByLevel } from '@/features/verify/verification';
import {
  getPublicProfile,
  getPublicProfileStats,
  getUserPublishedPlans,
  type CommunityPlan,
  type PublicProfile,
  type PublicProfileStats,
} from '@/lib/community';
import {
  acceptRequest,
  getConnectionState,
  removeConnection,
  sendRequest,
  type ConnectionState,
} from '@/lib/connections';
import { getOrCreateDm } from '@/lib/messaging';
import { confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function Stat({ icon, value, label, accent }: { icon: IoniconName; value: number; label: string; accent: string }) {
  const t = useTheme();
  const counted = useCountUp(value);
  return (
    <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.pill,
          backgroundColor: t.colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={accent} />
      </View>
      <Text variant="h2" color="textHeading">
        {counted}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function UserPlanCard({ plan, onPress }: { plan: CommunityPlan; onPress: () => void }) {
  const t = useTheme();
  const stops = plan.route
    .map((s) => s.title)
    .slice(0, 3)
    .join(' · ');
  return (
    <Card padded={false} onPress={onPress} style={{ overflow: 'hidden' }}>
      {plan.photos[0] ? (
        <Image source={{ uri: plan.photos[0] }} style={{ width: '100%', height: 160 }} contentFit="cover" transition={200} />
      ) : (
        <View style={{ width: '100%', height: 160, backgroundColor: t.colors.surfaceSecondary }} />
      )}
      <View style={{ padding: t.spacing.base, gap: 6 }}>
        <Text variant="h3" numberOfLines={2}>
          {plan.title}
        </Text>
        {stops ? (
          <Text variant="small" color="textSecondary" numberOfLines={1}>
            {stops}
            {plan.route.length > 3 ? ' …' : ''}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: t.spacing.xs }}>
          <Ionicons name="star" size={16} color={t.colors.accentOrange} />
          <Text variant="small" style={{ fontWeight: '600', color: t.colors.textSecondary }}>
            {plan.starCount}
          </Text>
          {plan.city ? (
            <Text variant="small" color="textSecondary">
              {` · ${plan.city}`}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

/** Public author profile — reachable by tapping whoever published a plan (Feature D). */
export default function PublicProfileScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [plans, setPlans] = useState<CommunityPlan[]>([]);
  const [stats, setStats] = useState<PublicProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const me = useAuthStore((s) => s.user?.id);
  const isOwn = !!me && me === id;
  const [connState, setConnState] = useState<ConnectionState>('none');
  const [connRow, setConnRow] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void Promise.all([getPublicProfile(id), getUserPublishedPlans(id), getPublicProfileStats(id)]).then(
      ([pr, pl, st]) => {
        if (!active) return;
        setProfile(pr);
        setPlans(pl);
        setStats(st);
        setLoading(false);
      },
    );
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !me || me === id) return;
    let active = true;
    void getConnectionState(id).then((info) => {
      if (!active) return;
      setConnState(info.state);
      setConnRow(info.rowId);
    });
    return () => {
      active = false;
    };
  }, [id, me]);

  const refreshConn = async () => {
    if (!id) return;
    const info = await getConnectionState(id);
    setConnState(info.state);
    setConnRow(info.rowId);
  };

  const onConnectPress = async () => {
    if (!id) return;
    haptics.light();
    if (connState === 'none') {
      const next = await sendRequest(id);
      if (next === 'outgoing') toast(tr('connections.requested'));
      if (next === 'connected') toast(tr('connections.accepted'));
      if (next !== 'none') haptics.success();
      await refreshConn();
    } else if (connState === 'incoming' && connRow) {
      if (await acceptRequest(connRow)) {
        haptics.success();
        toast(tr('connections.accepted'));
      }
      await refreshConn();
    } else if ((connState === 'outgoing' || connState === 'connected') && connRow) {
      const ok = await confirmDialog(
        connState === 'connected' ? tr('connections.disconnectTitle') : tr('connections.cancelTitle'),
        connState === 'connected' ? tr('connections.disconnectBody') : tr('connections.cancelBody'),
        tr('connections.remove'),
        tr('common2.cancel'),
      );
      if (ok) {
        await removeConnection(connRow);
        await refreshConn();
      }
    }
  };

  const declineRequest = async () => {
    if (!connRow) return;
    await removeConnection(connRow);
    await refreshConn();
  };

  const openDm = async () => {
    if (!id) return;
    haptics.light();
    const conv = await getOrCreateDm(id);
    if (conv) router.push(`/chat/${conv}` as Href);
  };

  const connLabel =
    connState === 'connected'
      ? tr('connections.connected')
      : connState === 'incoming'
        ? tr('connections.accept')
        : connState === 'outgoing'
          ? tr('connections.requested')
          : tr('connections.connect');

  const style = getProfileStyle(profile?.styleId);
  const accent = style.accent;
  const totalStars = plans.reduce((sum, p) => sum + p.starCount, 0);
  const name = profile?.name ?? tr('community.someone');

  // Their verification tier — computed here from server aggregates with the SAME ladder the
  // profile tab uses (single source of truth in features/verify), so the seal matches everywhere.
  // Ratcheted like the owner's own tab: the stored earned level wins over a momentarily broken streak.
  const verifyTier = stats
    ? tierByLevel(
        effectiveVerifyLevel(
          stats.verifyLevel,
          currentTierLevel({
            eveningsCreated: stats.evenings,
            published: stats.published,
            ownPlans: stats.ownPlans,
            streakDays: stats.streakDays,
            connections: stats.connections,
            ratingsReceived: stats.ratings,
            topPlans: stats.topPlans,
          }),
        ),
      )
    : undefined;

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
      ) : !profile ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: t.spacing.lg }}>
          <Text variant="bodyLarge" color="textSecondary" center>
            {tr('publicProfile.notFound')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, paddingBottom: t.spacing.xxl, gap: t.spacing.lg }}
        >
          <ProfileBanner style={style}>
            <View style={{ alignItems: 'center', gap: t.spacing.sm }}>
              <View
                style={{
                  width: 84,
                  height: 84,
                  borderRadius: t.radius.pill,
                  backgroundColor: accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: style.onGradient,
                }}
              >
                {profile.avatar ? (
                  <Image source={{ uri: profile.avatar }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <Text variant="displayMedium" color="onPrimary">
                    {(name || '?').charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: '100%' }}>
                <Text variant="h1" style={{ color: style.onGradient, flexShrink: 1 }} center numberOfLines={1}>
                  {name}
                </Text>
                {verifyTier ? <VerifyBadge color={verifyTier.color} size={22} animated={false} /> : null}
              </View>
              {profile.isFounder && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: t.radius.pill,
                  }}
                >
                  <Ionicons name="ribbon" size={13} color={style.onGradient} />
                  <Text variant="caption" style={{ color: style.onGradient, fontWeight: '700', letterSpacing: 0.3 }}>
                    {tr('profile.founderBadge')}
                  </Text>
                </View>
              )}
              {/* Founder wins — the CEO ribbon and the creator sparkles never stack. */}
              {!profile.isFounder && profile.isCreator && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: t.radius.pill,
                  }}
                >
                  <Ionicons name="sparkles" size={13} color={style.onGradient} />
                  <Text variant="caption" style={{ color: style.onGradient, fontWeight: '700', letterSpacing: 0.3 }}>
                    {tr('profile.creatorBadge')}
                  </Text>
                </View>
              )}
              {profile.homeCity ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="location" size={12} color={style.onGradient} />
                  <Text variant="small" style={{ color: style.onGradient, opacity: 0.9 }}>
                    {tr('profile.fromCity', { city: profile.homeCity })}
                  </Text>
                </View>
              ) : null}
              {profile.memberSince ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="calendar-outline" size={12} color={style.onGradient} />
                  <Text variant="small" style={{ color: style.onGradient, opacity: 0.9 }}>
                    {tr('publicProfile.memberSince', { year: new Date(profile.memberSince).getFullYear() })}
                  </Text>
                </View>
              ) : null}
              {profile.bio ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4, maxWidth: '92%' }}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={12}
                    color={style.onGradient}
                    style={{ marginTop: 3, opacity: 0.9 }}
                  />
                  <Text
                    variant="small"
                    style={{ color: style.onGradient, opacity: 0.9, flexShrink: 1 }}
                    numberOfLines={3}
                  >
                    {profile.bio}
                  </Text>
                </View>
              ) : null}
            </View>
          </ProfileBanner>

          <Card style={{ backgroundColor: accent + '1F' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat icon="sparkles-outline" value={plans.length} label={tr('publicProfile.published')} accent={accent} />
              <Stat icon="star" value={totalStars} label={tr('publicProfile.starsReceived')} accent={accent} />
            </View>
          </Card>

          {me && !isOwn && (
            <View style={{ gap: t.spacing.sm }}>
              {connState === 'connected' ? (
                <>
                  <Button title={tr('connections.message')} onPress={openDm} />
                  <Button title={tr('connections.connected')} variant="secondary" onPress={onConnectPress} />
                </>
              ) : (
                <>
                  <Button
                    title={connLabel}
                    variant={connState === 'none' || connState === 'incoming' ? 'primary' : 'secondary'}
                    onPress={onConnectPress}
                  />
                  {connState === 'incoming' && (
                    <Pressable onPress={declineRequest} style={{ alignSelf: 'center' }} hitSlop={8}>
                      <Text variant="small" color="textSecondary">
                        {tr('connections.decline')}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          )}

          {profile.pinnedPlaces.length > 0 && (
            <View style={{ gap: t.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
                <Text variant="h3">{tr('publicProfile.favorites')}</Text>
              </View>
              <Card padded={false} style={{ paddingHorizontal: t.spacing.base, backgroundColor: accent + '14' }}>
                {profile.pinnedPlaces.map((place, i) => (
                  <View
                    key={place}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: t.spacing.md,
                      paddingVertical: t.spacing.md,
                      borderTopWidth: i === 0 ? 0 : 1,
                      borderTopColor: t.colors.divider,
                    }}
                  >
                    <Ionicons name="pin" size={18} color={accent} />
                    <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                      {place}
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          )}

          {/* Evenings they chose to share (27_SOCIAL_VISION: "Recent Albums (if shared)"). */}
          {id ? <ProfileHighlights userId={id} accent={accent} /> : null}

          <ProfileExtras interests={profile.interests} prompts={profile.prompts} accent={accent} />

          {/* Their Evening DNA + badges — from server-side aggregates (private albums never leave the server).
              Moods are normalized to the six themed moods so this reads exactly like their own profile tab. */}
          {stats && stats.evenings > 0 && (
            <>
              <EveningDNA
                dna={computeDNAFromMoodCounts(normalizeMoodCounts(stats.moods))}
                accent={accent}
                title={tr('publicProfile.dna')}
              />
              <BadgesCollection
                badges={computeAllBadgesFromCtx({
                  evenings: stats.evenings,
                  cities: stats.cities,
                  photos: stats.photos,
                  moods: normalizeMoodCounts(stats.moods),
                })}
                accent={accent}
              />
            </>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
            <Text variant="h3">{tr('publicProfile.evenings')}</Text>
          </View>

          {plans.length === 0 ? (
            <Text variant="body" color="textSecondary">
              {tr('publicProfile.noEvenings')}
            </Text>
          ) : (
            plans.map((plan, i) => (
              <FadeInUp key={plan.id} index={i}>
                <UserPlanCard plan={plan} onPress={() => router.push(`/community/${plan.id}` as Href)} />
              </FadeInUp>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
