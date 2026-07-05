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

/** A memory as a card — its cover: your photo, else a spot photo, else a tonal gradient. */
export function MemoryCard({ album, onPress, compact = false, width }: MemoryCardProps) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const cover = album.coverColor;
  const coverHeight = compact ? 108 : 150;
  const [userCover, setUserCover] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if ((album.photoCount ?? 0) === 0) {
      setUserCover(null);
      return;
    }
    let active = true;
    void getAlbumCoverUrl(album.id).then((url) => {
      if (active) setUserCover(url);
    });
    return () => {
      active = false;
    };
  }, [album.id, album.photoCount]);

  // Your uploaded cover wins; otherwise the first spot's venue photo.
  const spotPhoto = album.timeline?.find((s) => s.photoUrl)?.photoUrl ?? null;
  const imageUrl = userCover ?? spotPhoto;
  const showImage = !!imageUrl && !failed;

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
          {/* Base: tonal gradient (always there, so a failed image degrades gracefully). */}
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
          {showImage && (
            <>
              <Image
                source={{ uri: imageUrl! }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={220}
                onError={() => setFailed(true)}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', minHeight: 18 }}>
            {album.pending ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(0,0,0,0.35)',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                }}
              >
                <Ionicons name="cloud-offline-outline" size={11} color="#FFFFFF" />
                <Text variant="caption" style={{ color: '#FFFFFF' }}>
                  {i18n.t('albums.pendingBadge')}
                </Text>
              </View>
            ) : (
              <View />
            )}
            {album.favorite ? <Ionicons name="heart" size={18} color="#FFFFFF" /> : <View />}
          </View>
          <Text
            variant={compact ? 'h3' : 'h2'}
            color="onPrimary"
            numberOfLines={2}
            style={{ textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8 }}
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
