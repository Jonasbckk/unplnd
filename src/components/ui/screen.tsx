import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  edges?: readonly Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  /** Enables pull-to-refresh on a scrolling screen. */
  onRefresh?: () => void;
  refreshing?: boolean;
}

/** Screen wrapper — warm background + safe area. Standard padding 24. */
export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['top'],
  contentStyle,
  onRefresh,
  refreshing = false,
}: ScreenProps) {
  const t = useTheme();
  const pad = padded ? { padding: t.spacing.lg } : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[pad, { paddingBottom: t.spacing.xxl }, contentStyle]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.colors.primary} colors={[t.colors.primary]} />
              ) : undefined
            }
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[{ flex: 1 }, pad, contentStyle]}>{children}</View>
        )}
      </SafeAreaView>
    </View>
  );
}
