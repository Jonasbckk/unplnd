import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
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

const TILE = '30%';

function Tile({ state, active, accent, onPress }: { state: IconState; active: boolean; accent: string; onPress: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const { def, unlocked, current, target, needsPremium } = state;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={tr(`appIcon.names.${def.key}`)}
      style={{ width: TILE, alignItems: 'center', gap: 6 }}
    >
      <View
        style={{
          width: '100%',
          aspectRatio: 1,
          borderRadius: t.radius.md,
          overflow: 'hidden',
          borderWidth: active ? 2 : 1,
          borderColor: active ? accent : t.colors.border,
        }}
      >
        <Image source={def.source} style={{ width: '100%', height: '100%', opacity: unlocked ? 1 : 0.35 }} contentFit="cover" />
        {!unlocked && (
          <View style={{ position: 'absolute', right: 6, top: 6 }}>
            <Ionicons name={needsPremium ? 'diamond' : 'lock-closed'} size={14} color="#FFFFFF" />
          </View>
        )}
        {active && (
          <View style={{ position: 'absolute', right: 6, bottom: 6 }}>
            <Ionicons name="checkmark-circle" size={18} color={accent} />
          </View>
        )}
      </View>

      <Text variant="caption" numberOfLines={1} style={{ fontWeight: '600' }}>
        {tr(`appIcon.names.${def.key}`)}
      </Text>

      {unlocked ? null : needsPremium ? (
        <Text variant="caption" style={{ color: accent }}>
          {tr('appIcon.premium')}
        </Text>
      ) : (
        <Text variant="caption" color="textSecondary">
          {`${current ?? 0}/${target ?? 0}`}
        </Text>
      )}
    </Pressable>
  );
}

/** Choose the home-screen icon. Free/achievement icons are earned; premium ones come with Pro. */
export default function AppIconScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const style = useProfileStyle();
  const accent = style.accent;
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
        else toast(tr('appIcon.lockedToast', { current: state.current ?? 0, target: state.target ?? 0 }));
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

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <Text variant="h1">{tr('appIcon.title')}</Text>
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

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}>
            {APP_ICONS.map((def) => {
              const state = iconState(def, metrics, isPremium, isFounder);
              return (
                <Tile
                  key={def.key}
                  state={state}
                  accent={accent}
                  active={active === def.iosName}
                  onPress={() => void choose(def, state)}
                />
              );
            })}
          </View>

          <Pressable onPress={() => void applyIcon(null).then((ok) => ok && setActive(null))} hitSlop={8}>
            <Text variant="small" color="textSecondary" center>
              {tr('appIcon.reset')}
            </Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
