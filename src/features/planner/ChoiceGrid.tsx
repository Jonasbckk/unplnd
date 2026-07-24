import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { View } from 'react-native';

import { PressableScale, Text } from '@/components/ui';
import { optionLabel } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { optionIcon } from './optionIcons';

interface ChoiceGridProps {
  options: string[];
  /** Selected value (single) or list (multi). */
  selected: string | string[] | undefined;
  multi?: boolean;
  onSelect: (value: string) => void;
}

/** Icon choice cards — replaces plain text chips so selecting feels tactile & premium (16/18). */
export function ChoiceGrid({ options, selected, multi = false, onSelect }: ChoiceGridProps) {
  const t = useTheme();
  const [width, setWidth] = useState(0);
  const columns = 3;
  const gap = t.spacing.sm;
  const cardWidth = width > 0 ? (width - gap * (columns - 1)) / columns : 0;

  const isSelected = (option: string) =>
    Array.isArray(selected) ? selected.includes(option) : selected === option;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}
    >
      {width > 0 &&
        options.map((option) => {
          const sel = isSelected(option);
          return (
            <PressableScale
              key={option}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ selected: sel }}
              feedback="selection"
              onPress={() => onSelect(option)}
              style={{ width: cardWidth }}
            >
              <View
                style={{
                  alignItems: 'center',
                  gap: 8,
                  paddingVertical: t.spacing.base,
                  paddingHorizontal: t.spacing.xs,
                  borderRadius: t.radius.md,
                  backgroundColor: sel ? t.colors.primary : t.colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: sel ? t.colors.primary : t.colors.border,
                }}
              >
                <Ionicons name={optionIcon(option)} size={24} color={sel ? '#FFFFFF' : t.colors.primary} />
                <Text
                  variant="caption"
                  color={sel ? 'onPrimary' : 'textPrimary'}
                  center
                  numberOfLines={2}
                  style={{ fontWeight: '500' }}
                >
                  {optionLabel(option)}
                </Text>
              </View>
            </PressableScale>
          );
        })}
    </View>
  );
}
