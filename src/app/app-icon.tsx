import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { APP_ICONS, iconState, type AppIconDef, type IconState } from '@/features/appicon/catalog';
import { applyIcon, canChangeIcon, currentIconName } from '@/features/appicon/icon';
import { fetchIsPremium } from '@/features/profile/use-premium';
import { useProfileStyle } from '@/features/profile/profile-styles';
import { getVerifyMetrics, type VerifyMetrics } from '@/features/verify/verification';
import { getPublicProfile } from '@/lib/community';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** A thin progress rail — how far along you are toward earning an icon. */
function Progress({ current, target, accent }: { current: number; target: number; accent: string }) {
  const t = useTheme();
  return (
    <View style={{ height: 5, borderRadius: 3, backgroundColor: t.colors.surfaceSecondary, overflow: 'hidden' }}>
      <View style={{ width: `${Math.min(100, (current / target) * 100)}%`, height: '100%', backgroundColor: accent, borderRadius: 3 }} />
    </View>
  );
}

function IconTile({
  state,
  active,
  accent,
  index,
  onPress,
}: {
  state: IconState;
  active: boolean;
  accent: string;
  index: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const { def, unlocked, current, target, needsPremium } = state;
  const earning = !unlocked && !needsPremium && target !== undefined;

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 55)} style={{ width: '48%' }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={tr(`appIcon.names.${def.key}`)}
        style={{
          backgroundColor: active ? accent + '14' : t.colors.card,
          borderRadius: t.radius.card,
          borderWidth: 1,
          borderColor: active ? accent : t.colors.border,
          padding: t.spacing.base,
          gap: t.spacing.sm,
        }}
      >
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: '100%', aspectRatio: 1, borderRadius: t.radius.lg, overflow: 'hidden' }}>
            <Image
              source={def.source}
              style={{ width: '100%', height: '100%', opacity: unlocked ? 1 : 0.3 }}
              contentFit="cover"
            />
            {!unlocked && (
              <View
                style={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(0,0,0,0.55)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={needsPremium ? 'diamond' : 'lock-closed'} size={13} color="#FFFFFF" />
              </View>
            )}
            {active && (
              <View
                style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="checkmark" size={15} color="#FFFFFF" />
              </View>
            )}
          </View>
        </View>

        <Text variant="small" style={{ fontWeight: '600' }} numberOfLines={1}>
          {tr(`appIcon.names.${def.key}`)}
        </Text>

        {/* Always say what it takes — a lock with no reason is just a wall. */}
        {earning ? (
          <View style={{ gap: 5 }}>
            <Text variant="caption" color="textSecondary" numberOfLines={2}>
              {tr(`appIcon.reqs.${def.key}`)}
            </Text>
            <Progress current={current ?? 0} target={target} accent={accent} />
            <Text variant="caption" color="textSecondary">
              {`${current ?? 0}/${target}`}
            </Text>
          </View>
        ) : needsPremium ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="diamond" size={11} color={accent} />
            <Text variant="caption" style={{ color: accent, fontWeight: '600' }}>
              {tr('appIcon.premium')}
            </Text>
          </View>
        ) : (
          <Text variant="caption" color="textSecondary" numberOfLines={1}>
            {active ? tr('appIcon.inUse') : tr(`appIcon.tiers.${def.tier}`)}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

function SectionHeading({ title, accent }: { title: string; accent: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text variant="h3">{title}</Text>
    </View>
  );
}

/** Choose the home-screen icon. Premium icons come with Pro; the rest are earned. */
export default function AppIconScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const accent = useProfileStyle().accent;
  const userId = useAuthStore((s) => s.user?.id);

  const [metrics, setMetrics] = useState<VerifyMetrics | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isFounder, setIsFounder] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    setActive(currentIconName());
    void getVerifyMetrics().then(setMetrics);
    void fetchIsPremium().then(setIsPremium);
    if (userId) void getPublicProfile(userId).then((p) => setIsFounder(Boolean(p?.isFounder)));
  }, [userId]);

  const choose = useCallback(
    async (def: AppIconDef, state: IconState) => {
      if (!state.unlocked) {
        haptics.light();
        if (state.needsPremium) router.push('/paywall' as Href);
        else toast(tr(`appIcon.reqs.${def.key}`));
        return;
      }
      haptics.selection();
      const ok = await applyIcon(def.iosName);
      if (!ok) {
        toast(tr('appIcon.failed'));
        return;
      }
      haptics.success();
      setActive(def.iosName);
    },
    [router, tr],
  );

  const states = APP_ICONS.map((def) => iconState(def, metrics, isPremium, isFounder));
  const groups: { tier: 'default' | 'premium' | 'achievement'; items: IconState[] }[] = [
    { tier: 'default', items: states.filter((s) => s.def.tier === 'default') },
    { tier: 'premium', items: states.filter((s) => s.def.tier === 'premium') },
    { tier: 'achievement', items: states.filter((s) => s.def.tier === 'achievement') },
  ];
  const showFooter = !isPremium && !isFounder;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, padding: t.spacing.lg }}>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel={tr('location.back')}>
            <Ionicons name={'chevron-back' as IoniconName} size={26} color={t.colors.textHeading} />
          </Pressable>
          <Text variant="h1">{tr('appIcon.title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, paddingBottom: t.spacing.xxl, gap: t.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body" color="textSecondary">
          {tr('appIcon.body')}
        </Text>

        {!canChangeIcon ? (
          <Card>
            <Text variant="body" color="textSecondary">
              {tr('appIcon.unsupported')}
            </Text>
          </Card>
        ) : (
          <>
            {isFounder && (
              <Card style={{ backgroundColor: accent + '14', borderWidth: 1, borderColor: accent + '40' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <Ionicons name="ribbon" size={16} color={accent} />
                  <Text variant="small" style={{ flex: 1, color: accent, fontWeight: '600' }}>
                    {tr('appIcon.founderNote')}
                  </Text>
                </View>
              </Card>
            )}

            {groups.map((group) => (
              <View key={group.tier} style={{ gap: t.spacing.md }}>
                <SectionHeading title={tr(`appIcon.sections.${group.tier}`)} accent={accent} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}>
                  {group.items.map((state, i) => (
                    <IconTile
                      key={state.def.key}
                      state={state}
                      accent={accent}
                      index={i}
                      active={active === state.def.iosName}
                      onPress={() => void choose(state.def, state)}
                    />
                  ))}
                </View>
              </View>
            ))}

            {/* Locked icons should lead somewhere, not just sit there. */}
            {showFooter && (
              <Card padded={false} onPress={() => router.push('/paywall' as Href)} style={{ overflow: 'hidden' }}>
                <LinearGradient
                  colors={[t.colors.primary, t.colors.accentOrange]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, padding: t.spacing.base }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: t.radius.md,
                      backgroundColor: 'rgba(255,255,255,0.22)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="diamond" size={22} color="#FFFFFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" style={{ fontWeight: '700', color: '#FFFFFF' }}>
                      {tr('appIcon.footerTitle')}
                    </Text>
                    <Text variant="small" style={{ color: 'rgba(255,255,255,0.88)' }}>
                      {tr('appIcon.footerSub')}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </Card>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}
