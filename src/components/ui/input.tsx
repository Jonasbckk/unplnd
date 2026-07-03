import { forwardRef } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/theme';
import { Text } from './text';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

/** Themed text input — large, comfortable, readable (08_COMPONENTS). */
export const Input = forwardRef<TextInput, InputProps>(function Input({ label, error, style, ...rest }, ref) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      {label ? (
        <Text variant="small" color="textSecondary">
          {label}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={t.colors.textSecondary}
        style={[
          {
            height: 52,
            borderRadius: t.radius.md,
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: error ? t.colors.error : t.colors.border,
            paddingHorizontal: t.spacing.base,
            color: t.colors.textPrimary,
            fontSize: 16,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="small" color="error">
          {error}
        </Text>
      ) : null}
    </View>
  );
});
