import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { CommunityPlan } from '@/lib/community';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/**
 * The user's own published plans, as a photo grid on their profile. Tapping one opens it
 * in the community view. Cards without a cover photo fall back to an accent gradient.
 */
export function PublishedPlansGrid({
  plans,
  accent,
  onOpen,
}: {
  plans: CommunityPlan[];
  accent: string;
  onOpen: (id: string) => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  if (plans.length === 0) return null;

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
        <Text variant="h3">{tr('profile.publishedPlans')}</Text>
      </View>

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}
      >
        {plans.map((plan) => (
          <Pressable
            key={plan.id}
            onPress={() => onOpen(plan.id)}
            style={{
              width: '48%',
              borderRadius: t.radius.lg,
              overflow: 'hidden',
              backgroundColor: t.colors.surface,
              borderWidth: 1,
              borderColor: t.colors.border,
            }}
          >
            <View style={{ height: 108 }}>
              {plan.photos[0] ? (
                <Image
                  source={{ uri: plan.photos[0] }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={[accent + 'DD', accent + '88']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="map-outline" size={26} color="#FFFFFF" />
                </LinearGradient>
              )}
            </View>
            <View style={{ padding: t.spacing.sm, gap: 3 }}>
              <Text variant="small" numberOfLines={2} style={{ fontWeight: '600' }}>
                {plan.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="star" size={13} color={t.colors.accentOrange} />
                <Text variant="caption" color="textSecondary" numberOfLines={1} style={{ flex: 1 }}>
                  {plan.city ? `${plan.starCount} · ${plan.city}` : `${plan.starCount}`}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
