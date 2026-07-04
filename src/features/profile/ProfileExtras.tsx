import { View } from 'react-native';

import { Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { PROMPTS } from './profile-extras';

/** Interests (accent chips) + answered prompts (Q&A cards). Shown on own + public profiles. */
export function ProfileExtras({
  interests,
  prompts,
  accent,
}: {
  interests: string[];
  prompts: Record<string, string>;
  accent: string;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const answered = PROMPTS.filter((k) => prompts[k]);
  if (interests.length === 0 && answered.length === 0) return null;

  return (
    <View style={{ gap: t.spacing.lg }}>
      {interests.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
            <Text variant="h3">{tr('extras.interests')}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
            {interests.map((key) => (
              <View
                key={key}
                style={{
                  paddingHorizontal: t.spacing.base,
                  paddingVertical: t.spacing.sm,
                  borderRadius: t.radius.pill,
                  backgroundColor: accent + '1F',
                }}
              >
                <Text variant="small" style={{ color: accent, fontWeight: '600' }}>
                  {tr(`interests.${key}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {answered.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          {answered.map((key) => (
            <View
              key={key}
              style={{ backgroundColor: t.colors.surfaceSecondary, borderRadius: t.radius.card, padding: t.spacing.base, gap: 4 }}
            >
              <Text variant="small" color="textSecondary">
                {tr(`prompts.${key}`)}
              </Text>
              <Text variant="bodyLarge" style={{ fontWeight: '600' }}>
                {prompts[key]}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
