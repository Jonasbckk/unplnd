import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { dateLocale, i18n } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { shade } from '@/utils/color';
import { getAlbumCoverUrl } from './photos';
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

/** A memory as a card — its real cover photo (or a dimensional tonal cover), title, date. */
export function MemoryCard({ album, onPress, compact = false, width }: MemoryCardProps) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cover = album.coverColor;
  const coverHeight = compact ? 108 : 150;
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if ((album.photoCount ?? 0) === 0) {
      setCoverUrl(null);
      return;
    }
    let active = true;
    void getAlbumCoverUrl(album.id).then((url) => {
      if (active) setCoverUrl(url);
    });
    return () => {
      active = false;
    };
  }, [album.id, album.photoCount]);

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
          {coverUrl ? (
            <>
              <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={220} />
              {/* Scrim so the title always reads over the photo. */}
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <>
              {/* Tonal cover — a lit top-left falling to a deeper bottom-right gives real depth. */}
              <LinearGradient
                colors={[shade(cover, 0.16), cover, shade(cover, -0.22)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)']}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, height: coverHeight * 0.55 }}
              />
            </>
          )}
          <View style={{ alignItems: 'flex-end', minHeight: 18 }}>
            {album.favorite && <Ionicons name="heart" size={18} color="#FFFFFF" />}
          </View>
          <Text
            variant={compact ? 'h3' : 'h2'}
            color="onPrimary"
            numberOfLines={2}
            style={{ textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }}
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
