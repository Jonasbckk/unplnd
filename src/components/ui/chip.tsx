import { Pressable } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';
import { Text } from './text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}

/** Rounded pill chip — used for moods, categories, filters. */
export function Chip({ label, selected = false, onPress }: ChipProps) {
  const t = useTheme();
  return (
    <Pressable
      onPress={
        onPress
          ? () => {
              haptics.selection();
              onPress();
            }
          : undefined
      }
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: t.spacing.base,
        paddingVertical: t.spacing.md,
        borderRadius: t.radius.pill,
        backgroundColor: selected ? t.colors.primary : t.colors.surfaceSecondary,
      }}
    >
      <Text variant="small" color={selected ? 'onPrimary' : 'textPrimary'} style={{ fontWeight: '500' }}>
        {label}
      </Text>
    </Pressable>
  );
}
