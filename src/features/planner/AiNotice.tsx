import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Button, Card, FadeInUp, Text } from '@/components/ui';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

/**
 * One-time disclosure that the Planner and the concierge are AI (EU AI Act Art. 50, in force since
 * 2026-08-02). This is the single place where UNPLND names the technology — a legal duty that
 * overrides Constitution Rule 6 / the copy guide. Calm, honest, shown once, then it steps aside;
 * the permanent explanation lives in Settings → Privacy.
 *
 * Sits at the top of the Planner tab, above every entry that reaches the model (questions,
 * free text, voice concierge), so nobody can start planning without having seen it.
 */
export function AiNotice() {
  const t = useTheme();
  const { t: tr } = useT();
  const seen = useAppStore((s) => s.aiNoticeSeen);
  const hydrated = useAppStore((s) => s.hasHydrated);
  const acknowledge = useAppStore((s) => s.acknowledgeAiNotice);

  // Wait for storage — otherwise the card flashes for people who already acknowledged it.
  if (!hydrated || seen) return null;

  return (
    <FadeInUp>
      <Card style={{ gap: t.spacing.md, borderWidth: 1, borderColor: t.colors.primary + '40' }}>
        <View
          accessible
          accessibilityRole="summary"
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.md }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: t.radius.sm,
              backgroundColor: t.colors.primary + '1A',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="information-circle-outline" size={24} color={t.colors.primary} />
          </View>
          <View style={{ flex: 1, gap: t.spacing.xs }}>
            <Text variant="h3">{tr('aiNotice.title')}</Text>
            <Text variant="small" color="textSecondary">
              {tr('aiNotice.body')}
            </Text>
          </View>
        </View>
        <Button
          title={tr('aiNotice.ack')}
          variant="secondary"
          onPress={() => {
            haptics.selection();
            acknowledge();
          }}
        />
      </Card>
    </FadeInUp>
  );
}
