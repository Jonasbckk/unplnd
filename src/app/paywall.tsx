import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Button, Logo, Text } from '@/components/ui';
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
    annual && {
      pkg: annual,
      title: tr('paywall.annual'),
      sub: tr('paywall.annualSub'),
      period: tr('paywall.perYear'),
      featured: true,
    },
    monthly && {
      pkg: monthly,
      title: tr('paywall.monthly'),
      sub: tr('paywall.monthlySub'),
      period: tr('paywall.perMonth'),
      featured: false,
    },
    lifetime && {
      pkg: lifetime,
      title: tr('paywall.lifetime'),
      sub: tr('paywall.lifetimeSub'),
      period: tr('paywall.once'),
      featured: false,
    },
  ].filter(Boolean) as {
    pkg: PurchasesPackage;
    title: string;
    sub: string;
    period: string;
    featured: boolean;
  }[];

  // Preselect the featured (annual) plan as soon as the offering arrives.
  useEffect(() => {
    if (!selectedId && plans.length > 0) setSelectedId(plans[0].pkg.identifier);
  }, [plans, selectedId]);

  const selected = plans.find((p) => p.pkg.identifier === selectedId) ?? plans[0] ?? null;

  // "Save 42%" on the annual card — real math from store prices, no invented urgency.
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
        {/* Brand row + close */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <Logo size={26} />
            <Text variant="small" style={{ letterSpacing: 2.5, fontWeight: '700', color: t.colors.textHeading }}>
              UNPLND
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.colors.surfaceSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={20} color={t.colors.textPrimary} />
          </Pressable>
        </View>

        {/* Statement headline — second line in brand orange */}
        <Animated.View entering={reduced ? undefined : FadeInDown.duration(400)} style={{ gap: t.spacing.md }}>
          <Text variant="displayLarge" style={{ color: t.colors.textHeading }}>
            {tr('paywall.headline')}
            {'\n'}
            <Text variant="displayLarge" style={{ color: t.colors.primary }}>
              {tr('paywall.headlineAccent')}
            </Text>
          </Text>
          <Text variant="bodyLarge" color="textSecondary">
            {tr('paywall.subtitle')}
          </Text>
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
            {/* Benefits — one calm card, icon chips + title + line */}
            <Animated.View
              entering={reduced ? undefined : FadeInDown.duration(360).delay(120)}
              style={{
                backgroundColor: t.colors.surface,
                borderRadius: t.radius.card,
                paddingHorizontal: t.spacing.base,
                ...t.shadows.sm,
              }}
            >
              {BENEFITS.map((b, i) => (
                <View key={b.key}>
                  {i > 0 && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border }} />}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md, paddingVertical: t.spacing.md }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: t.radius.sm,
                        backgroundColor: t.colors.surfaceSecondary,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name={b.icon} size={21} color={t.colors.primary} />
                    </View>
                    <View style={{ flex: 1, gap: 1 }}>
                      <Text variant="body" style={{ fontWeight: '600' }}>
                        {tr(`paywall.${b.key}`)}
                      </Text>
                      <Text variant="small" color="textSecondary">
                        {tr(`paywall.${b.key}Sub`)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Animated.View>

            {/* Plans — tap to select, one clear CTA below */}
            {plans.length > 0 ? (
              <Animated.View
                entering={reduced ? undefined : FadeInDown.duration(360).delay(240)}
                style={{ gap: t.spacing.md }}
              >
                {plans.map(({ pkg, title, sub, period, featured }) => {
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
                        padding: t.spacing.base,
                        paddingTop: featured ? t.spacing.lg : t.spacing.base,
                        marginTop: featured ? t.spacing.sm : 0,
                        borderRadius: t.radius.lg,
                        borderWidth: 1.5,
                        borderColor: active ? t.colors.primary : t.colors.border,
                        backgroundColor: t.colors.card,
                      }}
                    >
                      {featured ? (
                        <View
                          style={{
                            position: 'absolute',
                            top: -13,
                            left: t.spacing.base,
                            backgroundColor: t.colors.background,
                            borderWidth: 1,
                            borderColor: t.colors.primary,
                            borderRadius: t.radius.pill,
                            paddingHorizontal: 10,
                            paddingVertical: 3,
                          }}
                        >
                          <Text variant="caption" style={{ color: t.colors.primary, fontWeight: '700' }}>
                            {tr('paywall.popular')}
                          </Text>
                        </View>
                      ) : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                        <Ionicons
                          name={active ? 'checkmark-circle' : 'ellipse-outline'}
                          size={24}
                          color={active ? t.colors.primary : t.colors.textSecondary}
                        />
                        <View style={{ flex: 1, gap: 3 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, flexWrap: 'wrap' }}>
                            <Text variant="h3">{title}</Text>
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
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text variant="h2" style={{ color: t.colors.textHeading }}>
                            {pkg.product.priceString}
                          </Text>
                          <Text variant="caption" color="textSecondary">
                            {period}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}

                <View style={{ marginTop: t.spacing.sm, gap: t.spacing.sm }}>
                  <Button
                    title={selectedHasTrial ? tr('paywall.ctaTrial') : tr('paywall.cta')}
                    gradient
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
