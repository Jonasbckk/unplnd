import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { INTEREST_ICONS, PROMPT_ICONS, PROMPT_OPTIONS, PROMPTS } from './profile-extras';

/** An interest as an icon + label chip. Display mode (accent tint) or selectable (edit). */
export function InterestChip({
  interestKey,
  accent,
  selected,
  onPress,
}: {
  interestKey: string;
  accent: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const icon = INTEREST_ICONS[interestKey] ?? 'ellipse-outline';
  const isEdit = !!onPress;
  const bg = isEdit ? (selected ? accent : t.colors.surfaceSecondary) : accent + '1F';
  const fg = isEdit ? (selected ? '#FFFFFF' : t.colors.textPrimary) : accent;

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: t.spacing.base,
        paddingVertical: t.spacing.sm,
        borderRadius: t.radius.pill,
        backgroundColor: bg,
      }}
    >
      <Ionicons name={icon} size={14} color={fg} />
      <Text variant="small" style={{ color: fg, fontWeight: '600' }}>
        {tr(`interests.${interestKey}`)}
      </Text>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

/** Interests (icon chips) + answered prompts (Q&A cards). Shown on own + public profiles. */
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
  const reduced = useReducedMotion();
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
              <InterestChip key={key} interestKey={key} accent={accent} />
            ))}
          </View>
        </View>
      )}

      {answered.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
            <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
            <Text variant="h3">{tr('extras.aboutMe')}</Text>
          </View>

          {answered.map((key, i) => {
            const raw = prompts[key];
            const answer = PROMPT_OPTIONS[key]?.includes(raw) ? tr(`promptOpts.${key}.${raw}`) : raw;
            return (
              <Animated.View
                key={key}
                entering={reduced ? undefined : FadeInDown.duration(320).delay(i * 70)}
                style={{
                  backgroundColor: accent + '0F',
                  borderRadius: t.radius.card,
                  borderWidth: 1,
                  borderColor: accent + '2E',
                  padding: t.spacing.base,
                  overflow: 'hidden',
                }}
              >
                {/* These answers are personal statements — let them read like one. */}
                <Text
                  style={{ position: 'absolute', right: 12, top: -26, fontSize: 96, fontWeight: '800', color: accent + '14' }}
                  accessibilityElementsHidden
                  importantForAccessibility="no"
                >
                  {'”'}
                </Text>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: t.radius.pill,
                      backgroundColor: accent + '24',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name={PROMPT_ICONS[key] ?? 'chatbubble-outline'} size={12} color={accent} />
                  </View>
                  <Text variant="caption" color="textSecondary">
                    {tr(`prompts.${key}`)}
                  </Text>
                </View>

                <Text variant="h3" style={{ marginTop: 6 }}>
                  {answer}
                </Text>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
}
