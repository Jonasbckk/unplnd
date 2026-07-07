import type { StyleProp, TextStyle } from 'react-native';

import type { TypographyVariant } from '@/theme/tokens';
import { useTheme } from '@/theme';
import { Text } from './text';

export interface StatementTitleProps {
  /** The full title — its LAST word is rendered in the brand colour. */
  text: string;
  variant?: TypographyVariant;
  style?: StyleProp<TextStyle>;
}

/**
 * Statement headline (redesign v2): big heading with the last word in brand orange —
 * "Schon Pläne für später?", "Mehr erleben. Ohne Grenzen." Works across languages
 * because the split is positional, not translated.
 */
export function StatementTitle({ text, variant = 'displayMedium', style }: StatementTitleProps) {
  const t = useTheme();
  const words = text.trim().split(' ');
  const accentWord = words.pop() ?? '';
  const lead = words.join(' ');
  return (
    <Text variant={variant} style={[{ color: t.colors.textHeading }, style]}>
      {lead ? `${lead} ` : ''}
      <Text variant={variant} style={{ color: t.colors.primary }}>
        {accentWord}
      </Text>
    </Text>
  );
}
