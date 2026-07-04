import { Ionicons } from '@expo/vector-icons';
import { type ComponentProps, type ReactNode } from 'react';
import { View } from 'react-native';

import { useTheme } from '@/theme';
import { FadeInUp } from './motion';
import { Text } from './text';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  body?: string;
  action?: ReactNode;
}

/** Warm, consistent empty state — a soft icon medallion, a hopeful line, and an optional action. */
export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  const t = useTheme();
  return (
    <FadeInUp
      style={{
        alignItems: 'center',
        gap: t.spacing.md,
        paddingVertical: t.spacing.xxl,
        paddingHorizontal: t.spacing.lg,
      }}
    >
      <View
        style={{
          width: 84,
          height: 84,
          borderRadius: t.radius.pill,
          backgroundColor: t.colors.surfaceSecondary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={38} color={t.colors.primary} />
      </View>
      <Text variant="h2" center>
        {title}
      </Text>
      {body ? (
        <Text variant="bodyLarge" color="textSecondary" center>
          {body}
        </Text>
      ) : null}
      {action ? <View style={{ alignSelf: 'stretch', marginTop: t.spacing.sm }}>{action}</View> : null}
    </FadeInUp>
  );
}
