import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, FadeInUp, Input, StarRating, Text } from '@/components/ui';
import { formatAlbumDate } from '@/features/albums/MemoryCard';
import { shade } from '@/utils/color';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { getAlbumPhotos, pickPhotos, type AlbumPhoto } from '@/features/albums/photos';
import { usePhotoQueue } from '@/features/albums/photo-queue';
import { choiceDialog, confirmDialog } from '@/lib/confirm';
import { haptics } from '@/lib/haptics';
import { isAlbumPublished, publishPlan } from '@/lib/publish';
import { getPlanRating, savePlanRating } from '@/lib/ratings';
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
  const [heroFailed, setHeroFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  useEffect(() => {
    if (id) void getAlbumPhotos(id).then(setPhotos);
  }, [id]);

  useEffect(() => {
    if (album?.planId) void getPlanRating(album.planId).then(setRating);
  }, [album?.planId]);

  const addPhotos = useCallback(async () => {
    if (!album) return;
    if (album.pending) {
      toast(tr('albums.pendingSync'));
      return;
    }
    const assets = await pickPhotos();
    if (assets.length === 0) return;
    setUploading(true);
    // Queue then flush: uploads now if online, waits for reconnect if not — never lost.
    usePhotoQueue.getState().enqueue(album.id, assets);
    await usePhotoQueue.getState().flush();
    const fresh = await getAlbumPhotos(album.id);
    setPhotos(fresh);
    setUploading(false);
    haptics.success();
    const stillQueued = usePhotoQueue.getState().jobs.some((j) => j.albumId === album.id);
    toast(stillQueued ? tr('albums.photosQueued') : tr('toast.photosAdded'));
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
    if (album.pending) {
      toast(tr('albums.pendingSync'));
      return;
    }
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
    // If this memory is published, ask whether to also remove the community version.
    if (await isAlbumPublished(album.id)) {
      const choice = await choiceDialog(
        tr('albums.deletePublishedTitle'),
        tr('albums.deletePublishedBody'),
        tr('albums.deleteBoth'),
        tr('albums.deleteMemoryOnly'),
        tr('common2.cancel'),
      );
      if (choice === 'cancel') return;
      await deleteAlbum(album.id, choice === 'primary');
    } else {
      const ok = await confirmDialog(
        tr('albums.deleteTitle'),
        tr('albums.deleteBody'),
        tr('albums.delete'),
        tr('common2.cancel'),
      );
      if (!ok) return;
      await deleteAlbum(album.id, false);
    }
    usePhotoQueue.getState().removeForAlbum(album.id); // drop any not-yet-uploaded photos
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

  // Hero: your uploaded photo, else the first spot's venue photo.
  const heroPhoto = photos[0]?.url ?? album.timeline.find((s) => s.photoUrl)?.photoUrl ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: t.spacing.xxl }}>
        <View style={{ overflow: 'hidden' }}>
          {/* Base tonal gradient — always present, so a failed image degrades gracefully. */}
          <LinearGradient
            colors={[shade(album.coverColor, 0.16), album.coverColor, shade(album.coverColor, -0.24)]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {heroPhoto && !heroFailed ? (
            <>
              <Image
                source={{ uri: heroPhoto }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={220}
                onError={() => setHeroFailed(true)}
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                style={StyleSheet.absoluteFill}
              />
            </>
          ) : (
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }}
            />
          )}
          <SafeAreaView edges={['top']}>
            <View style={{ padding: t.spacing.lg, minHeight: 224, justifyContent: 'space-between' }}>
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
                <Text
                  variant="displayMedium"
                  color="onPrimary"
                  style={{ textShadowColor: 'rgba(0,0,0,0.28)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 10 }}
                >
                  {album.title}
                </Text>
                <Text variant="body" color="onPrimary" style={{ opacity: 0.95 }}>
                  {formatAlbumDate(album.date)}
                  {album.city ? ` · ${album.city}` : ''}
                </Text>
                {album.pending ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(0,0,0,0.32)',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: t.radius.pill,
                      marginTop: 4,
                    }}
                  >
                    <Ionicons name="cloud-offline-outline" size={13} color="#FFFFFF" />
                    <Text variant="caption" color="onPrimary">
                      {tr('albums.pendingBadge')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </SafeAreaView>
        </View>

        <FadeInUp style={{ padding: t.spacing.lg, gap: t.spacing.lg }}>
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

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.md }}>
            <Text variant="small" color="textSecondary">
              {tr('albums.yourRating')}
            </Text>
            <StarRating
              value={rating}
              size={22}
              onChange={(v) => {
                haptics.selection();
                setRating(v);
                void savePlanRating(album.planId ?? null, v);
              }}
            />
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

          <View style={{ gap: t.spacing.md }}>
            <Text variant="h3">{tr('albums.theEvening')}</Text>
            <View>
              {album.timeline.map((stop, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: t.spacing.base }}>
                  {/* Connected rail — a dot per stop, joined by a line. */}
                  <View style={{ width: 14, alignItems: 'center' }}>
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: t.colors.primary,
                        marginTop: 3,
                        borderWidth: 2,
                        borderColor: t.colors.background,
                      }}
                    />
                    {i < album.timeline.length - 1 && (
                      <View style={{ flex: 1, width: 2, backgroundColor: t.colors.divider, marginVertical: 2 }} />
                    )}
                  </View>
                  <View style={{ flex: 1, paddingBottom: t.spacing.lg, flexDirection: 'row', gap: t.spacing.md }}>
                    <View style={{ flex: 1 }}>
                      <Text variant="small" color="primary" style={{ fontWeight: '700' }}>
                        {stop.time}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm, marginTop: 2 }}>
                        <Text variant="body" style={{ flex: 1, fontWeight: '600' }}>
                          {stop.title}
                        </Text>
                        {stop.memoryMoment && <Ionicons name="sparkles" size={15} color={t.colors.accentOrange} />}
                      </View>
                      <Text variant="small" color="textSecondary" style={{ marginTop: 2 }}>
                        {stop.reason}
                      </Text>
                    </View>
                    {stop.photoUrl ? (
                      <Image
                        source={{ uri: stop.photoUrl }}
                        style={{ width: 62, height: 62, borderRadius: t.radius.md, marginTop: 2 }}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ gap: t.spacing.md }}>
            <Text variant="h3">{tr('albums.photosTitle')}</Text>
            {photos.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm }}>
                {photos.map((photo) => {
                  const size = (width - t.spacing.lg * 2 - t.spacing.sm) / 2;
                  return (
                    <Image
                      key={photo.id}
                      source={{ uri: photo.url }}
                      style={{ width: size, height: size, borderRadius: t.radius.md }}
                      contentFit="cover"
                      transition={200}
                    />
                  );
                })}
              </View>
            ) : (
              <View style={{ gap: 4 }}>
                <Text variant="small" color="textSecondary">
                  {tr('albums.noPhotosYet')}
                </Text>
                <Text variant="small" color="textSecondary">
                  {tr('publish.needPhotosHint')}
                </Text>
              </View>
            )}
            <Button title={tr('albums.addPhotos')} variant="secondary" loading={uploading} onPress={addPhotos} />
          </View>

          {published ? (
            <>
              <Button title={tr('albums.share')} onPress={shareAlbum} />
              <Button title={tr('albums.done')} variant="secondary" onPress={() => router.replace('/')} />
            </>
          ) : photos.length > 0 ? (
            <>
              <Button title={tr('publish.button')} loading={publishing} onPress={publish} />
              <View style={{ flexDirection: 'row', gap: t.spacing.md }}>
                <View style={{ flex: 1 }}>
                  <Button title={tr('albums.share')} variant="secondary" onPress={shareAlbum} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button title={tr('albums.done')} variant="secondary" onPress={() => router.replace('/')} />
                </View>
              </View>
            </>
          ) : (
            <Button title={tr('albums.done')} onPress={() => router.replace('/')} />
          )}
        </FadeInUp>
      </ScrollView>
    </View>
  );
}
