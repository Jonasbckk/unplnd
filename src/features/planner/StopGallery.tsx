import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { Text } from '@/components/ui';
import type { PlanStop } from '@/features/planner/types';
import { useT } from '@/lib/i18n';
import { resolveStopPhotos } from '@/lib/photos';
import { useTheme } from '@/theme';

/**
 * Full-screen photo gallery for a single stop — tap the main image to see every photo Google
 * has of the venue, plus its rating, price and hours (19_ROUTE, founder request).
 */
export function StopGallery({ stop, onClose }: { stop: PlanStop | null; onClose: () => void }) {
  const t = useTheme();
  const { t: tr } = useT();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [resolved, setResolved] = useState<string[] | null>(null);

  // Resolve the venue's photos on demand — only once the gallery actually opens (cost-efficient).
  useEffect(() => {
    setIndex(0);
    setResolved(null);
    if (!stop?.photoNames?.length) return;
    let cancelled = false;
    void resolveStopPhotos(stop.photoNames).then((urls) => {
      if (!cancelled && urls.length) setResolved(urls);
    });
    return () => {
      cancelled = true;
    };
  }, [stop]);

  // While resolving, show the already-loaded main photo so the gallery opens instantly.
  const photos = resolved?.length ? resolved : stop?.photoUrl ? [stop.photoUrl] : [];
  const loading = !!stop?.photoNames?.length && resolved === null;

  return (
    <Modal visible={!!stop} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' }}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={{ position: 'absolute', top: 52, right: 20, zIndex: 2, padding: 6 }}
        >
          <Ionicons name="close" size={30} color="#FFFFFF" />
        </Pressable>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          {photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {photos.map((uri, i) => (
                <View key={i} style={{ width, alignItems: 'center', justifyContent: 'center' }}>
                  <Image source={{ uri }} style={{ width, height: '85%' }} contentFit="contain" transition={180} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="image-outline" size={40} color="#FFFFFF" />
            </View>
          )}
          {loading && (
            <View style={{ position: 'absolute', top: 64, alignSelf: 'center' }}>
              <ActivityIndicator color="#FFFFFF" />
            </View>
          )}
        </View>

        {photos.length > 1 && (
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {photos.map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: i === index ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: i === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  }}
                />
              ))}
            </View>
          </View>
        )}

        {stop && (
          <View style={{ padding: t.spacing.lg, paddingBottom: 40, gap: 6, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Text variant="h3" style={{ color: '#FFFFFF' }}>
              {stop.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: t.spacing.md }}>
              {typeof stop.rating === 'number' && stop.rating > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="star" size={13} color={t.colors.accentOrange} />
                  <Text variant="small" style={{ color: '#FFFFFF', fontWeight: '600' }}>
                    {stop.rating.toFixed(1)}
                  </Text>
                  {typeof stop.ratingCount === 'number' && (
                    <Text variant="small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      ({stop.ratingCount})
                    </Text>
                  )}
                </View>
              )}
              {stop.priceLevel && (
                <Text variant="small" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {stop.priceLevel}
                </Text>
              )}
              {typeof stop.openNow === 'boolean' && (
                <Text
                  variant="small"
                  style={{ color: stop.openNow ? t.colors.success : t.colors.error, fontWeight: '600' }}
                >
                  {stop.openNow ? tr('route.openNow') : tr('route.closed')}
                </Text>
              )}
            </View>
            {stop.hours && (
              <Text variant="small" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {stop.hours}
              </Text>
            )}
            {stop.address && (
              <Text variant="small" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {stop.address}
              </Text>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}
