import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Input, Text } from '@/components/ui';
import { formatAlbumDate } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { getAlbumPhotos, pickPhotos, uploadAlbumPhotos, type AlbumPhoto } from '@/features/albums/photos';
import { confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { publishPlan } from '@/lib/publish';
import { toast } from '@/store/toast-store';
import { optionLabel, useT } from '@/lib/i18n';
import { useTheme } from '@/theme';

/** Album detail — the story of an evening (Memory Album Specification). Emotion first. */
export default function AlbumDetail() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const album = useAlbumsStore((s) => s.albums.find((a) => a.id === id));
  const toggleFavorite = useAlbumsStore((s) => s.toggleFavorite);
  const updateNote = useAlbumsStore((s) => s.updateNote);
  const deleteAlbum = useAlbumsStore((s) => s.deleteAlbum);
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (id) void getAlbumPhotos(id).then(setPhotos);
  }, [id]);

  const addPhotos = useCallback(async () => {
    if (!album) return;
    const assets = await pickPhotos();
    if (assets.length === 0) return;
    setUploading(true);
    await uploadAlbumPhotos(album.id, assets, album.photoCount);
    const fresh = await getAlbumPhotos(album.id);
    setPhotos(fresh);
    setUploading(false);
    haptics.success();
    toast(tr('toast.photosAdded'));
  }, [album, tr]);

  const shareAlbum = useCallback(async () => {
    if (!album) return;
    const lines = album.timeline.map((s) => `${s.time}  ${s.title}`).join('\n');
    const header = `${album.title}${album.city ? ` — ${album.city}` : ''}`;
    try {
      await Share.share({ message: `${header}\n${formatAlbumDate(album.date)}\n\n${lines}\n\n— UNPLND` });
    } catch {
      // user dismissed or platform unsupported — nothing to do
    }
  }, [album]);

  const publish = useCallback(async () => {
    if (!album) return;
    if (photos.length === 0) {
      toast(tr('publish.needPhotos'));
      return;
    }
    const ok = await confirmDialog(
      tr('publish.confirmTitle'),
      tr('publish.confirmBody'),
      tr('publish.confirm'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    setPublishing(true);
    const result = await publishPlan(album.id);
    setPublishing(false);
    if (result.ok) {
      setPublished(true);
      haptics.success();
      toast(result.alreadyPublished ? tr('publish.already') : tr('publish.success'));
    } else {
      toast(result.reason === 'no_photos' ? tr('publish.needPhotos') : tr('publish.failed'));
    }
    // tr is stable per language; album + photo count are the real deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, photos.length]);

  const onDelete = useCallback(async () => {
    if (!album) return;
    const ok = await confirmDialog(
      tr('albums.deleteTitle'),
      tr('albums.deleteBody'),
      tr('albums.delete'),
      tr('common2.cancel'),
    );
    if (!ok) return;
    await deleteAlbum(album.id);
    haptics.success();
    toast(tr('toast.albumDeleted'));
    router.back();
    // tr is stable per language; album/router deps suffice
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [album, deleteAlbum, router]);

  if (!album) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="bodyLarge">{tr('albums.notFound')}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: t.spacing.xxl }}>
        <View style={{ backgroundColor: album.coverColor }}>
          <SafeAreaView edges={['top']}>
            <View style={{ padding: t.spacing.lg, minHeight: 200, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Pressable onPress={() => router.back()} hitSlop={8}>
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </Pressable>
                <View style={{ flexDirection: 'row', gap: t.spacing.base }}>
                  <Pressable onPress={() => toggleFavorite(album.id)} hitSlop={8}>
                    <Ionicons name={album.favorite ? 'heart' : 'heart-outline'} size={24} color="#FFFFFF" />
                  </Pressable>
                  <Pressable onPress={onDelete} hitSlop={8}>
                    <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <Text variant="displayMedium" color="onPrimary">
                  {album.title}
                </Text>
                <Text variant="body" color="onPrimary">
                  {formatAlbumDate(album.date)}
                  {album.city ? ` · ${album.city}` : ''}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View style={{ padding: t.spacing.lg, gap: t.spacing.lg }}>
          <View style={{ flexDirection: 'row', gap: t.spacing.sm }}>
            <Text variant="small" color="textSecondary">
              {album.weather}
            </Text>
            <Text variant="small" color="textSecondary">
              ·
            </Text>
            <Text variant="small" color="textSecondary">
              {optionLabel(album.mood)}
            </Text>
          </View>

          {editingNote ? (
            <Card style={{ backgroundColor: t.colors.surfaceSecondary, gap: t.spacing.md }}>
              <Input
                value={noteDraft}
                onChangeText={setNoteDraft}
                placeholder={tr('albums.notePlaceholder')}
                multiline
                style={{ height: 96, paddingTop: t.spacing.md, textAlignVertical: 'top' }}
              />
              <Button
                title={tr('albums.saveNote')}
                onPress={async () => {
                  await updateNote(album.id, noteDraft);
                  setEditingNote(false);
                  haptics.success();
                  toast(tr('toast.noteSaved'));
                }}
              />
            </Card>
          ) : album.note ? (
            <Card
              onPress={() => {
                setNoteDraft(album.note ?? '');
                setEditingNote(true);
              }}
              style={{ backgroundColor: t.colors.surfaceSecondary }}
            >
              <Text variant="bodyLarge" style={{ fontStyle: 'italic' }}>
                “{album.note}”
              </Text>
            </Card>
          ) : (
            <Button
              title={tr('albums.addNote')}
              variant="secondary"
              onPress={() => {
                setNoteDraft('');
                setEditingNote(true);
              }}
            />
          )}

          <View style={{ gap: t.spacing.sm }}>
            <Text variant="h3">{tr('albums.theEvening')}</Text>
            {album.timeline.map((stop, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: t.spacing.base, paddingVertical: t.spacing.sm }}>
                <Text variant="body" color="primary" style={{ width: 52, fontWeight: '600' }}>
                  {stop.time}
                </Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
                    <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>
                      {stop.title}
                    </Text>
                    {stop.memoryMoment && <Ionicons name="sparkles" size={15} color={t.colors.accentOrange} />}
                  </View>
                  <Text variant="small" color="textSecondary">
                    {stop.reason}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View style={{ gap: t.spacing.md }}>
            <Text variant="h3">{tr('albums.photosTitle')}</Text>
            {photos.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {photos.map((photo) => {
                  const size = (width - t.spacing.lg * 2 - t.spacing.sm * 2) / 3;
                  return (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.url }}
                      style={{ width: size, height: size, borderRadius: t.radius.sm }}
                      contentFit="cover"
                      transition={200}
                    />
                  );
                })}
              </View>
            ) : (
              <Text variant="small" color="textSecondary">
                {tr('albums.noPhotosYet')}
              </Text>
            )}
            <Button title={tr('albums.addPhotos')} variant="secondary" loading={uploading} onPress={addPhotos} />
          </View>

          <Button
            title={published ? tr('publish.done') : tr('publish.button')}
            loading={publishing}
            disabled={published}
            onPress={publish}
          />
          <Button title={tr('albums.share')} variant="secondary" onPress={shareAlbum} />
          <Button title={tr('albums.done')} variant="secondary" onPress={() => router.replace('/')} />
        </View>
      </ScrollView>
    </View>
  );
}
