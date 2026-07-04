import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input, Text } from '@/components/ui';
import type { AppLocation } from '@/lib/location';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { searchPlaces, type PlaceSuggestion } from '@/lib/place-search';
import { useTheme } from '@/theme';

/** Full-screen search sheet: type a city/address → pick a place to plan/discover for. */
export function LocationPicker({
  visible,
  onClose,
  onSelect,
  onUseMyLocation,
  hasOverride,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (loc: AppLocation) => void;
  onUseMyLocation: () => void;
  hasOverride: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounced search as the user types (autocomplete feel).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await searchPlaces(q);
      if (!cancelled) {
        setResults(r);
        setLoading(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setResults([]);
    }
  }, [visible]);

  const row: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.md,
    paddingVertical: t.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: t.colors.divider,
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: t.colors.background }}>
        <SafeAreaView edges={['top']} style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: t.spacing.lg,
              paddingTop: t.spacing.md,
              paddingBottom: t.spacing.sm,
            }}
          >
            <Text variant="h2">{tr('location.pickerTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={26} color={t.colors.textPrimary} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: t.spacing.lg }}>
            <Input
              value={query}
              onChangeText={setQuery}
              placeholder={tr('location.searchPlaceholder')}
              autoFocus
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: t.spacing.lg, paddingBottom: t.spacing.xl }}
            keyboardShouldPersistTaps="handled"
          >
            {hasOverride && (
              <Pressable
                onPress={() => {
                  haptics.selection();
                  onUseMyLocation();
                }}
                style={row}
              >
                <Ionicons name="navigate" size={18} color={t.colors.primary} />
                <Text variant="body" color="primary" style={{ fontWeight: '600' }}>
                  {tr('location.useMyLocation')}
                </Text>
              </Pressable>
            )}

            {loading && <ActivityIndicator color={t.colors.primary} style={{ marginTop: t.spacing.lg }} />}

            {results.map((r, i) => (
              <Pressable
                key={`${r.lat},${r.lng},${i}`}
                onPress={() => {
                  haptics.selection();
                  onSelect({ latitude: r.lat, longitude: r.lng, city: r.name });
                }}
                style={row}
              >
                <Ionicons name="location-outline" size={18} color={t.colors.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text variant="body" numberOfLines={1}>
                    {r.name}
                  </Text>
                  {r.address && r.address !== r.name && (
                    <Text variant="small" color="textSecondary" numberOfLines={1}>
                      {r.address}
                    </Text>
                  )}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
