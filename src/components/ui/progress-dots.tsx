import { View } from 'react-native';

import { useTheme } from '@/theme';

export interface ProgressDotsProps {
  count: number;
  index: number;
}

/** Minimal progress indicator — three dots, never "Step 2 of 14" (16_ONBOARDING). */
export function ProgressDots({ count, index }: ProgressDotsProps) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: t.spacing.sm, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === index ? 22 : 8,
            height: 8,
            borderRadius: t.radius.pill,
            backgroundColor: i === index ? t.colors.primary : t.colors.border,
          }}
        />
      ))}
    </View>
  );
}
