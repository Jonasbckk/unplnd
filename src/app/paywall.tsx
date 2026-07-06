import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { purchase, restore, type PurchasesPackage } from '@/lib/revenuecat';
import { toast } from '@/store/toast-store';
import { useRevenueCatStore } from '@/store/revenuecat-store';
import { useTheme } from '@/theme';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; key: string }[] = [
  { icon: 'infinite', key: 'benefitPlans' },
  { icon: 'color-palette-outline', key: 'benefitStyles' },
  { icon: 'images-outline', key: 'benefitPhotos' },
  { icon: 'location-outline', key: 'benefitFavorites' },
  { icon: 'ribbon-outline', key: 'benefitBadge' },
];

export default function PaywallScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const offering = useRevenueCatStore((s) => s.offering);
  const isPremium = useRevenueCatStore((s) => s.isPremium);
  const [busy, setBusy] = useState<string | null>(null);

  const buy = async (pkg: PurchasesPackage) => {
    setBusy(pkg.identifier);
    const res = await purchase(pkg);
    setBusy(null);
    if (res.premium) {
      haptics.success();
      toast(tr('paywall.thanks'));
      router.back();
    } else if (!res.cancelled) {
      toast(tr('paywall.failed'));
    }
  };

  const doRestore = async () => {
    setBusy('restore');
    const ok = await restore();
    setBusy(null);
    toast(ok ? tr('paywall.restored') : tr('paywall.nothingToRestore'));
    if (ok) router.back();
  };

  const annual = offering?.annual ?? null;
  const monthly = offering?.monthly ?? null;
  const lifetime = offering?.lifetime ?? null;

  const Row = ({ pkg, title, sub, featured }: { pkg: PurchasesPackage; title: string; sub: string; featured?: boolean }) => (
    <Pressable
      onPress={() => buy(pkg)}
      disabled={!!busy}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: t.spacing.md,
        padding: t.spacing.base,
        borderRadius: t.radius.lg,
        borderWidth: 2,
        borderColor: featured ? t.colors.primary : t.colors.border,
        backgroundColor: featured ? t.colors.primary + '10' : t.colors.surface,
        opacity: busy && busy !== pkg.identifier ? 0.5 : 1,
      }}
    >
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
          <Text variant="body" style={{ fontWeight: '700' }}>
            {title}
          </Text>
          {featured ? (
            <View style={{ backgroundColor: t.colors.primary, borderRadius: t.radius.pill, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {tr('paywall.trialBadge')}
              </Text>
            </View>
          ) : null}
        </View>
        <Text variant="small" color="textSecondary">
          {sub}
        </Text>
      </View>
      <Text variant="h3">{pkg.product.priceString}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView edges={['top']}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: t.spacing.lg, paddingVertical: t.spacing.md }}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="close" size={26} color={t.colors.textSecondary} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: t.spacing.lg, paddingTop: 0, gap: t.spacing.lg }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={[t.colors.primary, t.colors.accentOrange]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: t.radius.card, padding: t.spacing.xl, alignItems: 'center', gap: t.spacing.sm }}
        >
          <Ionicons name="sparkles" size={40} color="#FFFFFF" />
          <Text variant="displayMedium" style={{ color: '#FFFFFF' }} center>
            UNPLND Premium
          </Text>
          <Text variant="body" style={{ color: 'rgba(255,255,255,0.9)' }} center>
            {tr('paywall.subtitle')}
          </Text>
        </LinearGradient>

        {isPremium ? (
          <View style={{ alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.lg }}>
            <Ionicons name="checkmark-circle" size={44} color={t.colors.success} />
            <Text variant="h3" center>
              {tr('paywall.alreadyPremium')}
            </Text>
            <Button title={tr('paywall.done')} onPress={() => router.back()} />
          </View>
        ) : (
          <>
            <View style={{ gap: t.spacing.md }}>
              {BENEFITS.map((b) => (
                <View key={b.key} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: t.colors.primary + '1A', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={b.icon} size={18} color={t.colors.primary} />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {tr(`paywall.${b.key}`)}
                  </Text>
                </View>
              ))}
            </View>

            {offering ? (
              <View style={{ gap: t.spacing.sm }}>
                {annual ? <Row pkg={annual} title={tr('paywall.annual')} sub={tr('paywall.annualSub')} featured /> : null}
                {monthly ? <Row pkg={monthly} title={tr('paywall.monthly')} sub={tr('paywall.monthlySub')} /> : null}
                {lifetime ? <Row pkg={lifetime} title={tr('paywall.lifetime')} sub={tr('paywall.lifetimeSub')} /> : null}
              </View>
            ) : (
              <Text variant="small" color="textSecondary" center>
                {tr('paywall.loading')}
              </Text>
            )}

            <Pressable onPress={doRestore} disabled={!!busy} style={{ alignSelf: 'center', paddingVertical: t.spacing.sm }}>
              <Text variant="small" color="textSecondary">
                {tr('paywall.restore')}
              </Text>
            </Pressable>

            <Text variant="caption" color="textSecondary" center>
              {tr('paywall.legal')}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
