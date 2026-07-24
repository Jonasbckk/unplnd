import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { PressableScale, Text } from '@/components/ui';
import { useTheme } from '@/theme';

interface AnswerRowProps {
  label: string;
  value: string;
  onEdit: () => void;
}

/** A completed Planner answer — stays visible so the flow feels like a conversation. */
export function AnswerRow({ label, value, onEdit }: AnswerRowProps) {
  const t = useTheme();
  return (
    <PressableScale onPress={onEdit} accessibilityLabel={label} feedback="selection">
      {/* Layout lives on this inner row — the scale wrapper must stay layout-neutral. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: t.spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: t.colors.divider,
        }}
      >
        <View style={{ flexDirection: 'row', gap: t.spacing.sm, alignItems: 'baseline' }}>
          <Text variant="small" color="textSecondary">
            {label}
          </Text>
          <Text variant="body" color="textHeading" style={{ fontWeight: '600' }}>
            {value}
          </Text>
        </View>
        <Ionicons name="pencil-outline" size={14} color={t.colors.textSecondary} />
      </View>
    </PressableScale>
  );
}
