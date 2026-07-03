import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

export interface SegmentedOption<T extends string> {
  label: string;
  value: T;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** iOS-style segmented control — used for small either/or choices (e.g. theme). */
export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedControlProps<T>) {
  const t = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: t.colors.surfaceSecondary,
        borderRadius: t.radius.md,
        padding: 4,
        gap: 4,
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              {
                flex: 1,
                height: 40,
                borderRadius: t.radius.sm,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: active ? t.colors.surface : 'transparent',
              },
              active ? t.shadows.sm : null,
            ]}
          >
            <Text variant="small" color={active ? 'textHeading' : 'textSecondary'} style={{ fontWeight: '600' }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
