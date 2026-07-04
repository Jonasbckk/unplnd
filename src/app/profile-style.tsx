import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Screen, Text } from '@/components/ui';
import { PROFILE_STYLES, useProfileStyle, type ProfileStyle } from '@/features/profile/profile-styles';
import { usePremium } from '@/features/profile/use-premium';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { updateProfileStyle } from '@/lib/profile';
import { toast } from '@/store/toast-store';
import { useTheme } from '@/theme';

export default function ProfileStyleScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const active = useProfileStyle();
  const isPremium = usePremium();
  const [upsell, setUpsell] = useState(false);

  const onPick = async (style: ProfileStyle) => {
    if (style.premium && !isPremium) {
      haptics.light();
      setUpsell(true);
      return;
    }
    if (style.id === active.id) return;
    haptics.success();
    // The checkmark on the card is the confirmation — no toast needed (only on failure).
    const ok = await updateProfileStyle(style.id);
    if (!ok) toast(tr('editProfile.failed'));
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
          <Text variant="h2">{tr('profileStyle.title')}</Text>
        </View>
      </SafeAreaView>

      <Screen scroll edges={[]} contentStyle={{ gap: t.spacing.base }}>
        <Text variant="body" color="textSecondary">
          {tr('profileStyle.subtitle')}
        </Text>

        <View
          style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}
        >
          {PROFILE_STYLES.map((style) => {
            const selected = style.id === active.id;
            const locked = style.premium && !isPremium;
            return (
              <Pressable
                key={style.id}
                onPress={() => onPick(style)}
                style={{
                  width: '48%',
                  borderRadius: t.radius.lg,
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: selected ? style.accent : 'transparent',
                }}
              >
                <View style={{ height: 96, justifyContent: 'space-between', padding: t.spacing.sm }}>
                  <LinearGradient
                    colors={style.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                  />
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {locked ? (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          backgroundColor: 'rgba(0,0,0,0.28)',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: t.radius.pill,
                        }}
                      >
                        <Ionicons name="lock-closed" size={11} color="#FFFFFF" />
                        <Text variant="caption" style={{ color: '#FFFFFF' }}>
                          {tr('profileStyle.premiumBadge')}
                        </Text>
                      </View>
                    ) : selected ? (
                      <View
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: t.radius.pill,
                          backgroundColor: style.onGradient,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="checkmark" size={15} color={style.accent} />
                      </View>
                    ) : null}
                  </View>
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: t.radius.pill,
                      backgroundColor: style.accent,
                      borderWidth: 2,
                      borderColor: style.onGradient,
                    }}
                  />
                </View>
                <View style={{ backgroundColor: t.colors.surfaceSecondary, padding: t.spacing.sm }}>
                  <Text variant="small" numberOfLines={1} style={{ fontWeight: '600' }}>
                    {tr(`profileStyle.names.${style.id}`)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </Screen>

      <Modal visible={upsell} transparent animationType="fade" onRequestClose={() => setUpsell(false)}>
        <Pressable
          onPress={() => setUpsell(false)}
          style={{
            flex: 1,
            backgroundColor: t.colors.overlay,
            alignItems: 'center',
            justifyContent: 'center',
            padding: t.spacing.lg,
          }}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380 }}>
            <Card style={{ gap: t.spacing.md, alignItems: 'center' }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: t.radius.pill,
                  backgroundColor: t.colors.surfaceSecondary,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="sparkles" size={26} color={t.colors.primary} />
              </View>
              <Text variant="h2" center>
                {tr('profileStyle.premiumTitle')}
              </Text>
              <Text variant="body" color="textSecondary" center>
                {tr('profileStyle.premiumBody')}
              </Text>
              <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>
                <Button title={tr('profileStyle.premiumDismiss')} onPress={() => setUpsell(false)} />
              </View>
            </Card>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
