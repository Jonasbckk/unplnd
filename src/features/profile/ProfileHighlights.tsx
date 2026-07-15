import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native';

import { Button, Card, Input, Text } from '@/components/ui';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { pickPhoto } from '@/features/albums/photos';
import { haptics } from '@/lib/haptics';
import { useT } from '@/lib/i18n';
import { useTheme } from '@/theme';
import { HighlightStory } from './HighlightStory';
import {
  addHighlight,
  getHighlightedAlbumIds,
  getProfileHighlights,
  removeHighlight,
  updateHighlight,
  uploadHighlightCover,
  type Highlight,
} from './highlights';

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
  const [editing, setEditing] = useState<Highlight | null>(null);
  const [name, setName] = useState('');
  // Launching the image picker while a modal is still on screen silently fails on iOS, so we run it
  // once the sheet is fully dismissed (same pattern as AttachSheet).
  const pendingRef = useRef<(() => void) | null>(null);

  const runAfterClose = (fn: () => void) => {
    pendingRef.current = fn;
    setEditing(null);
    if (Platform.OS !== 'ios') {
      setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = null;
        pending?.();
      }, 250);
    }
  };

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

  const openEditor = (h: Highlight) => {
    if (!editable) return;
    haptics.light();
    setName(h.title);
    setEditing(h);
  };

  const saveName = async () => {
    if (!editing) return;
    await updateHighlight(editing.albumId, { title: name });
    setEditing(null);
    await load();
  };

  const chooseCover = () => {
    const albumId = editing?.albumId;
    if (!albumId) return;
    runAfterClose(() => {
      void (async () => {
        const asset = await pickPhoto();
        if (!asset) return;
        const path = await uploadHighlightCover(albumId, asset);
        if (!path) return;
        await updateHighlight(albumId, { coverPath: path });
        haptics.success();
        await load();
      })();
    });
  };

  const unshare = async () => {
    if (!editing) return;
    await removeHighlight(editing.albumId);
    setEditing(null);
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
            onLongPress={() => openEditor(h)}
            accessibilityRole="button"
            accessibilityLabel={h.title}
            style={{ alignItems: 'center', gap: 6, width: CIRCLE }}
          >
            <Ring accent={accent}>
              <Image source={{ uri: h.cover }} style={{ width: '100%', height: '100%' }} contentFit="cover" cachePolicy="memory-disk" />
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

      {/* Edit — rename, pick a cover, or stop sharing. Own profile only. */}
      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
        onDismiss={() => {
          const pending = pendingRef.current;
          pendingRef.current = null;
          pending?.();
        }}
      >
        <View style={{ flex: 1, backgroundColor: t.colors.overlay, justifyContent: 'flex-end' }}>
          <View
            style={{
              backgroundColor: t.colors.background,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              padding: t.spacing.lg,
              gap: t.spacing.md,
            }}
          >
            <Text variant="h2">{tr('highlights.editTitle')}</Text>

            <Input value={name} onChangeText={setName} placeholder={editing?.title ?? ''} />

            <Button title={tr('highlights.chooseCover')} variant="secondary" onPress={chooseCover} />
            <Button title={tr('highlights.save')} onPress={() => void saveName()} />

            <Pressable onPress={() => void unshare()} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Text variant="small" style={{ color: t.colors.error, fontWeight: '600' }}>
                {tr('highlights.unshare')}
              </Text>
            </Pressable>

            <Pressable onPress={() => setEditing(null)} hitSlop={8} style={{ alignSelf: 'center' }}>
              <Text variant="small" color="textSecondary">
                {tr('common.close')}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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

            <Button title={tr('common.close')} onPress={() => setPicking(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}
