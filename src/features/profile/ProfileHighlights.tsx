import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { HighlightStory } from './HighlightStory';
import { addHighlight, getHighlightedAlbumIds, getProfileHighlights, removeHighlight, type Highlight } from './highlights';

const CIRCLE = 68;

function Ring({ children, accent, dashed }: { children: React.ReactNode; accent: string; dashed?: boolean }) {
  return (
    <View
      style={{
        width: CIRCLE,
        height: CIRCLE,
        borderRadius: CIRCLE / 2,
        borderWidth: 2,
        borderColor: accent,
        borderStyle: dashed ? 'dashed' : 'solid',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/**
 * Highlights — the evenings someone chose to share, as tappable covers (27_SOCIAL_VISION:
 * "Recent Albums (if shared)"). On your own profile you can add and remove them; sharing is
 * always an explicit act and can be undone at any time ("Privacy controls for every section").
 */
export function ProfileHighlights({
  userId,
  accent,
  editable = false,
}: {
  userId: string;
  accent: string;
  /** Own profile → show the picker. */
  editable?: boolean;
}) {
  const t = useTheme();
  const { t: tr } = useT();
  const albums = useAlbumsStore((s) => s.albums);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [open, setOpen] = useState<Highlight | null>(null);
  const [picking, setPicking] = useState(false);
  const [shared, setShared] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setHighlights(await getProfileHighlights(userId));
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openPicker = async () => {
    haptics.light();
    setShared(await getHighlightedAlbumIds());
    setPicking(true);
  };

  const toggle = async (albumId: string) => {
    haptics.selection();
    const isShared = shared.has(albumId);
    const ok = isShared ? await removeHighlight(albumId) : await addHighlight(albumId, shared.size);
    if (!ok) return;
    setShared((cur) => {
      const nextSet = new Set(cur);
      if (isShared) nextSet.delete(albumId);
      else nextSet.add(albumId);
      return nextSet;
    });
    await load();
  };

  // Only evenings with photos can be told as a story.
  const shareable = albums.filter((a) => a.photoCount > 0);
  if (!editable && highlights.length === 0) return null;

  return (
    <View style={{ gap: t.spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
        <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
        <Text variant="h3">{tr('highlights.title')}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.base }}>
        {editable && (
          <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={tr('highlights.add')} style={{ alignItems: 'center', gap: 6, width: CIRCLE }}>
            <Ring accent={accent + '80'} dashed>
              <Ionicons name="add" size={26} color={accent} />
            </Ring>
            <Text variant="caption" color="textSecondary" numberOfLines={1}>
              {tr('highlights.add')}
            </Text>
          </Pressable>
        )}

        {highlights.map((h) => (
          <Pressable
            key={h.albumId}
            onPress={() => {
              haptics.light();
              setOpen(h);
            }}
            accessibilityRole="button"
            accessibilityLabel={h.title}
            style={{ alignItems: 'center', gap: 6, width: CIRCLE }}
          >
            <Ring accent={accent}>
              <Image source={{ uri: h.photos[0] }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
            </Ring>
            <Text variant="caption" numberOfLines={1}>
              {h.title}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {editable && highlights.length === 0 ? (
        <Text variant="small" color="textSecondary">
          {tr('highlights.emptyOwn')}
        </Text>
      ) : null}

      <HighlightStory highlight={open} onClose={() => setOpen(null)} />

      {/* Picker — your evenings, tap to share or unshare. */}
      <Modal visible={picking} transparent animationType="fade" onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: t.colors.background,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              padding: t.spacing.lg,
              gap: t.spacing.md,
              maxHeight: '80%',
            }}
          >
            <Text variant="h2">{tr('highlights.pickTitle')}</Text>
            <Text variant="small" color="textSecondary">
              {tr('highlights.pickBody')}
            </Text>

            {shareable.length === 0 ? (
              <Text variant="body" color="textSecondary">
                {tr('highlights.needPhotos')}
              </Text>
            ) : (
              <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ gap: t.spacing.sm }}>
                {shareable.map((a) => {
                  const on = shared.has(a.id);
                  return (
                    <Card
                      key={a.id}
                      padded={false}
                      onPress={() => void toggle(a.id)}
                      accessibilityLabel={a.title}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: t.spacing.md,
                        paddingVertical: t.spacing.md,
                        paddingHorizontal: t.spacing.base,
                        backgroundColor: on ? accent + '14' : t.colors.surface,
                        borderWidth: 1,
                        borderColor: on ? accent + '40' : t.colors.border,
                      }}
                    >
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: a.coverColor, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="images-outline" size={16} color="#FFFFFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text variant="small" style={{ fontWeight: '600' }} numberOfLines={1}>
                          {a.title}
                        </Text>
                        <Text variant="caption" color="textSecondary" numberOfLines={1}>
                          {[a.city, tr('highlights.photoCount', { count: a.photoCount })].filter(Boolean).join(' · ')}
                        </Text>
                      </View>
                      <Ionicons
                        name={on ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={on ? accent : t.colors.textSecondary}
                      />
                    </Card>
                  );
                })}
              </ScrollView>
            )}

            <Button title={tr('common2.close')} onPress={() => setPicking(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
