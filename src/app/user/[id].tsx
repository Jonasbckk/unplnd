import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Text } from '@/components/ui';
import { ProfileBanner } from '@/features/profile/ProfileBanner';
import { getProfileStyle } from '@/features/profile/profile-styles';
import { getPublicProfile, getUserPublishedPlans, type CommunityPlan, type PublicProfile } from '@/lib/community';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function Stat({ icon, value, label, accent }: { icon: IoniconName; value: number; label: string; accent: string }) {
  const t = useTheme();
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
        {value}
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let active = true;
    void Promise.all([getPublicProfile(id), getUserPublishedPlans(id)]).then(([pr, pl]) => {
      if (!active) return;
      setProfile(pr);
      setPlans(pl);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const style = getProfileStyle(profile?.styleId);
  const accent = style.accent;
  const totalStars = plans.reduce((sum, p) => sum + p.starCount, 0);
  const name = profile?.name ?? tr('community.someone');

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
              <Text variant="h1" style={{ color: style.onGradient }} center>
                {name}
              </Text>
              {profile.bio ? (
                <Text variant="small" style={{ color: style.onGradient, opacity: 0.9 }} center numberOfLines={3}>
                  {profile.bio}
                </Text>
              ) : null}
            </View>
          </ProfileBanner>

          <Card style={{ backgroundColor: accent + '1F' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <Stat icon="sparkles-outline" value={plans.length} label={tr('publicProfile.published')} accent={accent} />
              <Stat icon="star" value={totalStars} label={tr('publicProfile.starsReceived')} accent={accent} />
            </View>
          </Card>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
            <Text variant="h3">{tr('publicProfile.evenings')}</Text>
          </View>

          {plans.length === 0 ? (
            <Text variant="body" color="textSecondary">
              {tr('publicProfile.noEvenings')}
            </Text>
          ) : (
            plans.map((plan) => (
              <UserPlanCard key={plan.id} plan={plan} onPress={() => router.push(`/community/${plan.id}` as Href)} />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}
