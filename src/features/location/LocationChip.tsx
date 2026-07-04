import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { Text } from '@/components/ui';
import { LocationPicker } from '@/features/location/LocationPicker';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useLocationStore } from '@/store/location-store';
import { useTheme } from '@/theme';

/** A tappable "📍 near <place> ▾" chip that opens the location picker (Planner + Discover). */
export function LocationChip() {
  const t = useTheme();
  const { t: tr } = useT();
  const override = useLocationStore((s) => s.override);
  const setOverride = useLocationStore((s) => s.setOverride);
  const clearOverride = useLocationStore((s) => s.clearOverride);
  const [open, setOpen] = useState(false);
  const label = override?.city || tr('location.yourLocation');

  return (
    <>
      <Pressable
        onPress={() => {
          haptics.selection();
          setOpen(true);
        }}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          maxWidth: '100%',
          gap: 6,
          paddingVertical: 7,
          paddingHorizontal: t.spacing.base,
          borderRadius: t.radius.pill,
          backgroundColor: t.colors.surfaceSecondary,
        }}
      >
        <Ionicons name="location" size={15} color={t.colors.primary} />
        <Text variant="small" style={{ fontWeight: '600', flexShrink: 1 }} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={t.colors.textSecondary} />
      </Pressable>

      <LocationPicker
        visible={open}
        onClose={() => setOpen(false)}
        onSelect={(loc) => {
          setOverride(loc);
          setOpen(false);
        }}
        onUseMyLocation={() => {
          clearOverride();
          setOpen(false);
        }}
        hasOverride={!!override}
      />
    </>
  );
}
