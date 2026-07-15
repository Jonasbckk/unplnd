import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import type { Highlight } from './highlights';

/** How long one photo stays on screen before the story moves on. */
const PHOTO_MS = 5000;

/**
 * A shared evening, told as a story — progress bars on top, tap right/left to move.
 * Deliberately shows only what a shared evening may show: title, city, date. No addresses,
 * no coordinates (Memory Album Spec: "Location precision reduced when shared publicly").
 */
export function HighlightStory({ highlight, onClose }: { highlight: Highlight | null; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);

  const total = highlight?.photos.length ?? 0;

  useEffect(() => {
    setIndex(0);
  }, [highlight?.albumId]);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i + 1 < total) return i + 1;
      onClose();
      return i;
    });
  }, [total, onClose]);

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  // Fill the active bar, then move on. Reduce Motion keeps the auto-advance (it's the story, not
  // decoration) but skips the sweeping animation.
  useEffect(() => {
    if (!highlight) return;
    progress.value = 0;
    progress.value = withTiming(1, { duration: reduced ? 0 : PHOTO_MS, easing: Easing.linear });
    const timer = setTimeout(next, PHOTO_MS);
    return () => clearTimeout(timer);
  }, [highlight, index, reduced, next, progress]);

  const activeBar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  const dateLabel = highlight?.date ? new Date(highlight.date).toLocaleDateString() : '';

  return (
    <Modal visible={!!highlight} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {highlight ? (
          <>
            <Image
              source={{ uri: highlight.photos[index] }}
              style={StyleSheet.absoluteFillObject}
              contentFit="contain"
              transition={180}
              recyclingKey={highlight.photos[index]}
            />

            {/* Tap zones sit under the chrome: right = onward, left = back. */}
            <Pressable
              onPress={prev}
              accessibilityLabel={tr('highlights.prev')}
              style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.35 }}
            />
            <Pressable
              onPress={next}
              accessibilityLabel={tr('highlights.next')}
              style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.65 }}
            />

            <SafeAreaView edges={['top']} pointerEvents="box-none">
              <View style={{ paddingHorizontal: t.spacing.base, gap: t.spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: 4 }}>
                  {highlight.photos.map((p, i) => (
                    <View
                      key={p}
                      style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' }}
                    >
                      {i < index ? (
                        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
                      ) : i === index ? (
                        <Animated.View style={[{ height: '100%', backgroundColor: '#FFFFFF' }, activeBar]} />
                      ) : null}
                    </View>
                  ))}
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" style={{ color: '#FFFFFF', fontWeight: '700' }} numberOfLines={1}>
                      {highlight.title}
                    </Text>
                    <Text variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }} numberOfLines={1}>
                      {[highlight.city, dateLabel].filter(Boolean).join(' · ')}
                    </Text>
                  </View>
                  <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={tr('common2.close')}>
                    <Ionicons name="close" size={26} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </>
        ) : null}
      </View>
    </Modal>
  );
}
