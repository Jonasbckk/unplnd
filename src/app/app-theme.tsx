import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useAuthStore } from '@/features/auth/auth-store';
import { usePremium } from '@/features/profile/use-premium';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import { toast } from '@/store/toast-store';
import { useAppStore } from '@/store/app-store';
import { APP_THEMES, UNLOCK_PUBLISHED_REQUIRED, useTheme, type AppTheme } from '@/theme';
import { shade } from '@/utils/color';

/** How many evenings the current user has published — gates the free "unlock" themes. */
function usePublishedCount(): number {
  const userId = useAuthStore((s) => s.user?.id);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    void supabase
      .from('published_plans')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .then(({ count: c }) => {
        if (active) setCount(c ?? 0);
      });
    return () => {
      active = false;
    };
  }, [userId]);
  return count;
}

export default function AppThemeScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const appThemeId = useAppStore((s) => s.appThemeId);
  const setAppThemeId = useAppStore((s) => s.setAppThemeId);
  const isPremium = usePremium();
  const publishedCount = usePublishedCount();

  const isAvailable = (th: AppTheme): boolean =>
    th.tier === 'default' ||
    (th.tier === 'unlock' && publishedCount >= UNLOCK_PUBLISHED_REQUIRED) ||
    (th.tier === 'premium' && isPremium);

  const onPick = (th: AppTheme) => {
    if (!isAvailable(th)) {
      haptics.light();
      toast(
        th.tier === 'premium'
          ? tr('appTheme.premiumLocked')
          : tr('appTheme.unlockLocked', { n: UNLOCK_PUBLISHED_REQUIRED }),
      );
      return;
    }
    if (th.id === appThemeId) return;
    haptics.success();
    setAppThemeId(th.id);
    toast(tr('appTheme.applied'));
  };

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
          <Text variant="h2">{tr('appTheme.title')}</Text>
        </View>
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.base }}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="body" color="textSecondary">
          {tr('appTheme.subtitle')}
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.base }}>
          {APP_THEMES.map((th) => {
            const active = th.id === appThemeId;
            const available = isAvailable(th);
            const locked = !available;
            return (
              <Pressable key={th.id} onPress={() => onPick(th)} style={{ width: '47%' }}>
                <View
                  style={{
                    borderRadius: t.radius.card,
                    overflow: 'hidden',
                    borderWidth: active ? 2 : 0,
                    borderColor: th.primary,
                  }}
                >
                  <LinearGradient
                    colors={[shade(th.primary, 0.14), th.primary, shade(th.primary, -0.22)]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ height: 92, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {active ? (
                      <Ionicons name="checkmark-circle" size={30} color="#FFFFFF" />
                    ) : locked ? (
                      <Ionicons name="lock-closed" size={20} color="rgba(255,255,255,0.92)" />
                    ) : null}
                  </LinearGradient>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <Text variant="small" style={{ fontWeight: '600', flex: 1 }} numberOfLines={1}>
                    {tr(`appTheme.names.${th.id}`)}
                  </Text>
                  {th.tier === 'premium' && !isPremium ? (
                    <View
                      style={{
                        backgroundColor: t.colors.surfaceSecondary,
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: t.radius.pill,
                      }}
                    >
                      <Text variant="caption" style={{ color: t.colors.textHeading, fontWeight: '600' }}>
                        {tr('appTheme.premiumTag')}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {th.tier === 'unlock' && locked ? (
                  <Text variant="caption" color="textSecondary" style={{ marginTop: 2 }}>
                    {tr('appTheme.progress', { have: Math.min(publishedCount, UNLOCK_PUBLISHED_REQUIRED), need: UNLOCK_PUBLISHED_REQUIRED })}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
