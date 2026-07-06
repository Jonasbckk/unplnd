import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

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
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const offering = useRevenueCatStore((s) => s.offering);
  const isPremium = useRevenueCatStore((s) => s.isPremium);
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const annual = offering?.annual ?? null;
  const monthly = offering?.monthly ?? null;
  const lifetime = offering?.lifetime ?? null;

  const plans = [
    annual && { pkg: annual, title: tr('paywall.annual'), sub: tr('paywall.annualSub'), featured: true },
    monthly && { pkg: monthly, title: tr('paywall.monthly'), sub: tr('paywall.monthlySub'), featured: false },
    lifetime && { pkg: lifetime, title: tr('paywall.lifetime'), sub: tr('paywall.lifetimeSub'), featured: false },
  ].filter(Boolean) as { pkg: PurchasesPackage; title: string; sub: string; featured: boolean }[];

  // Preselect the featured (annual) plan as soon as the offering arrives.
  useEffect(() => {
    if (!selectedId && plans.length > 0) setSelectedId(plans[0].pkg.identifier);
  }, [plans, selectedId]);

  const selected = plans.find((p) => p.pkg.identifier === selectedId) ?? plans[0] ?? null;

  // "Save 44%" on the annual card — real math from store prices, no invented urgency.
  const savingsPct =
    annual && monthly && monthly.product.price > 0
      ? Math.max(0, Math.round((1 - annual.product.price / (monthly.product.price * 12)) * 100))
      : null;

  const selectedHasTrial = Boolean(
    selected && selected.pkg.product.introPrice && selected.pkg.product.introPrice.price === 0,
  );

  const buy = async () => {
    if (!selected) return;
    setBusy(true);
    const res = await purchase(selected.pkg);
    setBusy(false);
    if (res.premium) {
      haptics.success();
      toast(tr('paywall.thanks'));
      router.back();
    } else if (!res.cancelled) {
      toast(tr('paywall.failed'));
    }
  };

  const doRestore = async () => {
    setBusy(true);
    const ok = await restore();
    setBusy(false);
    toast(ok ? tr('paywall.restored') : tr('paywall.nothingToRestore'));
    if (ok) router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: t.spacing.lg,
          paddingTop: t.spacing.md + insets.top,
          paddingBottom: t.spacing.xl,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — living gradient with drifting sparkles. */}
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(400)}>
          <View style={{ borderRadius: t.radius.card, overflow: 'hidden', ...t.shadows.md }}>
            <LinearGradient
              colors={[t.colors.primary, t.colors.accentOrange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: t.spacing.xl, alignItems: 'center', gap: t.spacing.sm }}
            >
              <Ionicons name="sparkles" size={40} color="#FFFFFF" />
              <Text variant="displayMedium" style={{ color: '#FFFFFF' }} center>
                UNPLND Premium
              </Text>
              <Text variant="body" style={{ color: 'rgba(255,255,255,0.92)' }} center>
                {tr('paywall.subtitle')}
              </Text>
            </LinearGradient>
            {/* Close — on the hero so it never collides with content. */}
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={{
                position: 'absolute',
                top: t.spacing.md,
                right: t.spacing.md,
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.22)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>

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
            {/* Benefits — staggered entrance. */}
            <View style={{ gap: t.spacing.md }}>
              {BENEFITS.map((b, i) => (
                <Animated.View
                  key={b.key}
                  entering={reduced ? undefined : FadeInDown.duration(320).delay(120 + i * 70)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}
                >
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 17,
                      backgroundColor: t.colors.primary + '1A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={b.icon} size={18} color={t.colors.primary} />
                  </View>
                  <Text variant="body" style={{ flex: 1 }}>
                    {tr(`paywall.${b.key}`)}
                  </Text>
                </Animated.View>
              ))}
            </View>

            {/* Plans — tap to select, one clear CTA below. */}
            {plans.length > 0 ? (
              <Animated.View
                entering={reduced ? undefined : FadeInDown.duration(360).delay(420)}
                style={{ gap: t.spacing.sm }}
              >
                {plans.map(({ pkg, title, sub, featured }) => {
                  const active = selected?.pkg.identifier === pkg.identifier;
                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => {
                        haptics.selection();
                        setSelectedId(pkg.identifier);
                      }}
                      disabled={busy}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: t.spacing.md,
                        padding: t.spacing.base,
                        borderRadius: t.radius.lg,
                        borderWidth: 2,
                        borderColor: active ? t.colors.primary : t.colors.border,
                        backgroundColor: active ? t.colors.primary + '12' : t.colors.surface,
                      }}
                    >
                      <Ionicons
                        name={active ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={active ? t.colors.primary : t.colors.textSecondary}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' }}>
                          <Text variant="body" style={{ fontWeight: '700' }}>
                            {title}
                          </Text>
                          {featured ? (
                            <View
                              style={{
                                backgroundColor: t.colors.primary,
                                borderRadius: t.radius.pill,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                              }}
                            >
                              <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                                {tr('paywall.trialBadge')}
                              </Text>
                            </View>
                          ) : null}
                          {featured && savingsPct !== null && savingsPct > 0 ? (
                            <View
                              style={{
                                backgroundColor: t.colors.success + '22',
                                borderRadius: t.radius.pill,
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                              }}
                            >
                              <Text variant="caption" style={{ color: t.colors.success, fontWeight: '700' }}>
                                {tr('paywall.save', { percent: savingsPct })}
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
                })}

                <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
                  <Button
                    title={selectedHasTrial ? tr('paywall.ctaTrial') : tr('paywall.cta')}
                    loading={busy}
                    disabled={!selected}
                    onPress={buy}
                  />
                  <Pressable onPress={doRestore} disabled={busy} style={{ alignSelf: 'center', paddingVertical: t.spacing.sm }}>
                    <Text variant="small" color="textSecondary">
                      {tr('paywall.restore')}
                    </Text>
                  </Pressable>
                </View>
              </Animated.View>
            ) : (
              <Text variant="small" color="textSecondary" center>
                {tr('paywall.loading')}
              </Text>
            )}

            <Text variant="caption" color="textSecondary" center>
              {tr('paywall.legal')}
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
