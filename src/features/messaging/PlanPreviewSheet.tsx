import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { getCommunityPlan, type CommunityPlan } from '@/lib/community';
import { useT } from '@/lib/i18n';
import type { SharedPlan } from '@/lib/messaging';
import { useTheme } from '@/theme';

/**
 * A quick expandable preview of a shared plan — photos + route, right inside the chat,
 * so you can peek without being pulled out to the community screen. "Open full plan" navigates.
 */
export function PlanPreviewSheet({
  plan,
  onClose,
  onOpenFull,
}: {
  plan: SharedPlan | null;
  onClose: () => void;
  onOpenFull: (sourceId: string) => void;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const { width } = useWindowDimensions();
  const [full, setFull] = useState<CommunityPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    if (!plan?.sourceId) {
      setFull(null);
      return;
    }
    let active = true;
    setLoading(true);
    setPhotoIndex(0);
    void getCommunityPlan(plan.sourceId).then((p) => {
      if (!active) return;
      setFull(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [plan?.sourceId]);

  const photos = full?.photos ?? (plan?.photo ? [plan.photo] : []);
  const title = full?.title ?? plan?.title ?? '';
  // Both route shapes (full PlanStop[] vs the lightweight shared {time,title}[]) fit this view.
  const route = (full?.route ?? plan?.route ?? []) as { time?: string; title: string; photoUrl?: string }[];

  return (
    <Modal visible={!!plan} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={{
            backgroundColor: t.colors.card,
            borderTopLeftRadius: t.radius.sheet,
            borderTopRightRadius: t.radius.sheet,
            overflow: 'hidden',
            maxHeight: '86%',
          }}
        >
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {photos.length > 0 ? (
              <View>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(e) => setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
                >
                  {photos.map((uri, i) => (
                    <Image key={i} source={{ uri }} style={{ width, height: 220 }} contentFit="cover" transition={200} />
                  ))}
                </ScrollView>
                {photos.length > 1 && (
                  <View
                    style={{
                      position: 'absolute',
                      bottom: t.spacing.md,
                      left: 0,
                      right: 0,
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {photos.map((_, i) => (
                      <View
                        key={i}
                        style={{
                          width: i === photoIndex ? 18 : 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: i === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                        }}
                      />
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            <View style={{ padding: t.spacing.lg, gap: t.spacing.md }}>
              <View
                style={{ alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: t.colors.border }}
              />

              <Text variant="h2">{title}</Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                {full ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="star" size={15} color={t.colors.accentOrange} />
                    <Text variant="small" color="textSecondary" style={{ fontWeight: '600' }}>
                      {full.starCount}
                    </Text>
                  </View>
                ) : null}
                {full?.city ? (
                  <Text variant="small" color="textSecondary">
                    {full.city}
                  </Text>
                ) : null}
              </View>

              {loading ? (
                <ActivityIndicator color={t.colors.primary} style={{ marginVertical: t.spacing.md }} />
              ) : (
                <>
                  {full?.summary ? (
                    <Text variant="body" color="textSecondary">
                      {full.summary}
                    </Text>
                  ) : null}

                  <View style={{ gap: t.spacing.sm }}>
                    {route.map((stop, i) => (
                      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
                        <Text variant="small" color="primary" style={{ width: 46, fontWeight: '700' }}>
                          {stop.time ?? ''}
                        </Text>
                        <Text variant="body" style={{ flex: 1, fontWeight: '500' }} numberOfLines={1}>
                          {stop.title}
                        </Text>
                        {stop.photoUrl ? (
                          <Image
                            source={{ uri: stop.photoUrl }}
                            style={{ width: 48, height: 48, borderRadius: t.radius.md }}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </>
              )}

              {plan?.sourceId ? (
                <Button title={tr('rsvp.openFull')} onPress={() => plan.sourceId && onOpenFull(plan.sourceId)} />
              ) : null}
              <Button title={tr('common2.cancel')} variant="secondary" onPress={onClose} />
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
