import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';
import { useTheme } from '@/theme';

export interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: number;
  style?: ViewStyle;
}

/** A tappable 1–5 star rating input. Tap a set star again to clear back to 0. */
export function StarRating({ value, onChange, size = 30, style }: StarRatingProps) {
  const t = useTheme();
  return (
    <View style={[{ flexDirection: 'row', gap: 8 }, style]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          hitSlop={4}
          accessibilityRole="button"
          accessibilityLabel={`${n}`}
          onPress={() => {
            haptics.light();
            onChange(n === value ? 0 : n);
          }}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? t.colors.accentOrange : t.colors.textSecondary}
          />
        </Pressable>
      ))}
    </View>
  );
}
