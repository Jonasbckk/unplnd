import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Text } from '@/components/ui';
import type { Album } from '@/features/albums/types';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

interface PlaceInfo {
  photoUrl?: string;
  category?: string;
}

/** Match each saved place title to a stop from the user's evenings, preferring one with a photo. */
function buildLookup(albums: Album[]): Map<string, PlaceInfo> {
  const map = new Map<string, PlaceInfo>();
  for (const a of albums) {
    for (const s of a.timeline) {
      const existing = map.get(s.title);
      if (!existing || (!existing.photoUrl && s.photoUrl)) {
        map.set(s.title, { photoUrl: s.photoUrl, category: s.category });
      }
    }
  }
  return map;
}

/**
 * Saved places as a photo grid. Each place reuses the cover photo of a stop from the user's
 * evenings; places without one fall back to an accent gradient with a pin. Tap the ✕ to remove.
 */
export function SavedPlaces({
  places,
  albums,
  accent,
  pinned,
  onTogglePin,
  onRemove,
}: {
  places: string[];
  albums: Album[];
  accent: string;
  /** Places pinned to the public profile — shown to anyone who opens your profile. */
  pinned: string[];
  onTogglePin: (place: string) => void;
  onRemove: (place: string) => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const lookup = useMemo(() => buildLookup(albums), [albums]);
  if (places.length === 0) return null;

  const remove = (place: string) => {
    haptics.light();
    onRemove(place);
  };

  const togglePin = (place: string) => {
    haptics.light();
    onTogglePin(place);
  };

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
        <Text variant="h3">{tr('profile.savedPlaces')}</Text>
      </View>
      <Text variant="caption" color="textSecondary">
        {tr('profile.pinHint')}
      </Text>

      <View
        style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.base }}
      >
        {places.map((place) => {
          const info = lookup.get(place);
          return (
            <View
              key={place}
              style={{ width: '48%', height: 120, borderRadius: t.radius.lg, overflow: 'hidden' }}
            >
              {info?.photoUrl ? (
                <Image
                  source={{ uri: info.photoUrl }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <LinearGradient
                  colors={[accent + 'DD', accent + '88']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="location" size={26} color="#FFFFFF" />
                </LinearGradient>
              )}

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.65)']}
                style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 64 }}
              />
              <Text
                variant="small"
                numberOfLines={2}
                style={{
                  position: 'absolute',
                  left: t.spacing.sm,
                  right: 42,
                  bottom: t.spacing.sm,
                  color: '#FFFFFF',
                  fontWeight: '700',
                }}
              >
                {place}
              </Text>

              <Pressable
                onPress={() => remove(place)}
                hitSlop={8}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={15} color="#FFFFFF" />
              </Pressable>

              <Pressable
                onPress={() => togglePin(place)}
                hitSlop={8}
                accessibilityLabel={tr('profile.pinToProfile')}
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 6,
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: pinned.includes(place) ? accent : 'rgba(0,0,0,0.4)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name={pinned.includes(place) ? 'pin' : 'pin-outline'} size={16} color="#FFFFFF" />
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}
