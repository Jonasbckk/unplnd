import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { MemoryCard } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { WorldMap, type FriendDot } from '@/features/map/WorldMap';
import { getLiveConnections, type LiveConnection } from '@/features/map/live';
import { cityCount, pinsFromAlbums, type PinCluster } from '@/features/map/pins';
import { useProfileStyle } from '@/features/profile/profile-styles';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** Fullscreen Memory Map — tap a pin to open that evening (22_PROFILE: "Tap a marker → Open Album"). */
export default function MapScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const accent = useProfileStyle().accent;
  const albums = useAlbumsStore((s) => s.albums);
  const [selected, setSelected] = useState<PinCluster | null>(null);
  const [live, setLive] = useState<LiveConnection[]>([]);
  const [friend, setFriend] = useState<LiveConnection | null>(null);

  // Connections sharing right now — server-side the RPC only ever returns accepted connections.
  useEffect(() => {
    let active = true;
    void getLiveConnections().then((rows) => {
      if (active) setLive(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const pins = useMemo(() => pinsFromAlbums(albums), [albums]);
  const cities = cityCount(pins);

  // The evenings behind the tapped bubble, newest first.
  const chosen = useMemo(() => {
    if (!selected) return [];
    const ids = new Set(selected.pins.map((p) => p.albumId));
    return albums.filter((a) => ids.has(a.id));
  }, [selected, albums]);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <WorldMap
        pins={pins}
        friends={live.map((l): FriendDot => ({ userId: l.userId, name: l.name, lat: l.lat, lng: l.lng }))}
        width={width}
        height={height}
        fitToPins
        interactive
        colors={{
          water: t.colors.background,
          land: t.colors.surfaceSecondary,
          border: t.colors.border,
          pin: accent,
          pinText: '#1a120c',
          friend: t.colors.accentOcean,
        }}
        onPressCluster={(c) => {
          haptics.light();
          setFriend(null);
          setSelected(c);
        }}
        onPressFriend={(f) => {
          haptics.light();
          setSelected(null);
          setFriend(live.find((l) => l.userId === f.userId) ?? null);
        }}
      />

      <SafeAreaView edges={['top']} style={{ position: 'absolute', left: 0, right: 0, top: 0 }} pointerEvents="box-none">
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: t.spacing.lg,
            paddingVertical: t.spacing.md,
          }}
        >
          <Text variant="h3">{tr('map.title')}</Text>
          <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel={tr('common.close')}>
            <Ionicons name="close" size={26} color={t.colors.textPrimary} />
          </Pressable>
        </View>

        <View
          style={{
            alignSelf: 'center',
            backgroundColor: t.colors.surface,
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: t.radius.pill,
            paddingHorizontal: t.spacing.base,
            paddingVertical: 6,
          }}
        >
          <Text variant="caption" color="textSecondary">
            {tr('map.summary', { cities, evenings: pins.length })}
          </Text>
        </View>
      </SafeAreaView>

      {chosen.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.colors.surface,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            paddingTop: t.spacing.md,
            paddingBottom: t.spacing.xl,
            gap: t.spacing.md,
          }}
        >
          <View style={{ width: 34, height: 4, borderRadius: 2, backgroundColor: t.colors.border, alignSelf: 'center' }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing.lg }}>
            <Text variant="body" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
              {chosen[0].city || tr('map.title')}
            </Text>
            <Pressable onPress={() => setSelected(null)} hitSlop={10} accessibilityLabel={tr('common.close')}>
              <Ionicons name="close" size={18} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: t.spacing.base, paddingHorizontal: t.spacing.lg }}
          >
            {chosen.map((album) => (
              <MemoryCard
                key={album.id}
                album={album}
                compact
                width={150}
                onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {friend && (
        <Animated.View
          entering={FadeInDown.duration(260)}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: t.colors.surface,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            paddingTop: t.spacing.md,
            paddingBottom: t.spacing.xl,
            paddingHorizontal: t.spacing.lg,
            gap: t.spacing.md,
          }}
        >
          <View style={{ width: 34, height: 4, borderRadius: 2, backgroundColor: t.colors.border, alignSelf: 'center' }} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: t.colors.accentOcean,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                {(friend.name || '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body" style={{ fontWeight: '600' }} numberOfLines={1}>
                {friend.name}
              </Text>
              <Text variant="caption" color="textSecondary" numberOfLines={1}>
                {[friend.city, tr('map.minutesAgo', { min: friend.minutesAgo })].filter(Boolean).join(' · ')}
              </Text>
            </View>
            <Pressable onPress={() => setFriend(null)} hitSlop={10} accessibilityLabel={tr('common.close')}>
              <Ionicons name="close" size={18} color={t.colors.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            onPress={() => router.push(`/user/${friend.userId}` as Href)}
            accessibilityRole="button"
            style={{
              backgroundColor: t.colors.primary,
              borderRadius: t.radius.md,
              paddingVertical: t.spacing.md,
              alignItems: 'center',
            }}
          >
            <Text variant="small" style={{ color: t.colors.onPrimary, fontWeight: '600' }}>
              {tr('map.openProfile')}
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}
