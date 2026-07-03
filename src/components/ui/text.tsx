import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import type { ColorToken } from '@/theme/colors';
import type { TypographyVariant } from '@/theme/tokens';
import { useTheme } from '@/theme';

const HEADING_VARIANTS: TypographyVariant[] = [
  'displayLarge',
  'displayMedium',
  'h1',
  'h2',
  'h3',
];

export interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
  color?: ColorToken;
  center?: boolean;
}

/** Themed text. Headings default to Coffee Brown; body to primary text. Sentence case, never uppercase. */
export function Text({ variant = 'body', color, center, style, ...rest }: TextProps) {
  const t = useTheme();
  const resolvedColor: ColorToken =
    color ?? (HEADING_VARIANTS.includes(variant) ? 'textHeading' : 'textPrimary');

  return (
    <RNText
      style={[t.typography[variant], { color: t.colors[resolvedColor] }, center && { textAlign: 'center' }, style]}
      {...rest}
    />
  );
}
