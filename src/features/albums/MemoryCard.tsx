import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { dateLocale, i18n } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { shade } from '@/utils/color';
import type { Album } from './types';

export function formatAlbumDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale(), { day: 'numeric', month: 'short', year: 'numeric' });
}

interface MemoryCardProps {
  album: Album;
  onPress: () => void;
  /** Compact variant for horizontal scrollers (Home, Profile) — cover + title only. */
  compact?: boolean;
  width?: number;
}

/** A memory as a card — a dimensional cover (tonal gradient + gloss), title, date. Tap to open. */
export function MemoryCard({ album, onPress, compact = false, width }: MemoryCardProps) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cover = album.coverColor;
  const coverHeight = compact ? 108 : 150;

  return (
    <Animated.View style={[animatedStyle, width ? { width } : undefined]}>
      <Pressable
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: 120 });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: 180 });
        }}
        onPress={onPress}
        style={{ borderRadius: t.radius.card, overflow: 'hidden', backgroundColor: t.colors.card, ...t.shadows.md }}
      >
        <View style={{ height: coverHeight, justifyContent: 'space-between', padding: t.spacing.base }}>
          {/* Tonal cover — a lit top-left falling to a deeper bottom-right gives the block real depth. */}
          <LinearGradient
            colors={[shade(cover, 0.16), cover, shade(cover, -0.22)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Soft gloss along the top edge — subtle premium sheen. */}
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: coverHeight * 0.55 }}
          />
          <View style={{ alignItems: 'flex-end', minHeight: 18 }}>
            {album.favorite && <Ionicons name="heart" size={18} color="#FFFFFF" />}
          </View>
          <Text
            variant={compact ? 'h3' : 'h2'}
            color="onPrimary"
            numberOfLines={2}
            style={{ textShadowColor: 'rgba(0,0,0,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }}
          >
            {album.title}
          </Text>
        </View>
        {!compact && (
          <View style={{ padding: t.spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="small" color="textSecondary">
              {formatAlbumDate(album.date)}
              {album.city ? ` · ${album.city}` : ''}
            </Text>
            <Text variant="small" color="textSecondary">
              {i18n.t('albums.photos', { count: album.photoCount })}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
