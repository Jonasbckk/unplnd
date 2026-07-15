import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Card, Screen, Text, useCountUp } from '@/components/ui';
import { MemoryCard } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { BadgesCollection } from '@/features/profile/BadgesCollection';
import { EveningDNA } from '@/features/profile/EveningDNA';
import { MemoryMap } from '@/features/map/MemoryMap';
import { ProfileHighlights } from '@/features/profile/ProfileHighlights';
import { PublishedPlansGrid } from '@/features/profile/PublishedPlansGrid';
import { SavedPlaces } from '@/features/profile/SavedPlaces';
import { ProfileBanner } from '@/features/profile/ProfileBanner';
import { ProfileExtras } from '@/features/profile/ProfileExtras';
import { useProfileStyle } from '@/features/profile/profile-styles';
import { maybeCelebrateTier } from '@/features/celebrate/celebrate-store';
import { VerifyBadge } from '@/features/verify/VerifyBadge';
import { getVerifyMetrics, resolveVerifyLevel, tierByLevel, type VerifyMetrics } from '@/features/verify/verification';
import { getPublicProfile, getUserPublishedPlans, type CommunityPlan } from '@/lib/community';
import { getPendingCount } from '@/lib/connections';
import { haptics } from '@/lib/haptics';
import { setPinnedPlaces } from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function Stat({
  icon,
  value,
  label,
  color,
}: {
  icon: IoniconName;
  value: string | number;
  label: string;
  color: string;
}) {
  const t = useTheme();
  const counted = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <View style={{ alignItems: 'center', gap: 4, flex: 1 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: t.radius.pill,
          backgroundColor: color + '26',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text variant="h2" color="textHeading" numberOfLines={1}>
        {typeof value === 'number' ? counted : value}
      </Text>
      <Text variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Section title with a short accent bar — ties each section to the chosen profile style. */
function SectionHeading({ title, accent }: { title: string; accent: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.sm }}>
      <View style={{ width: 4, height: 18, borderRadius: 2, backgroundColor: accent }} />
      <Text variant="h3">{title}</Text>
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** A compact profile tile — accent icon circle + full label, two per row. Springs on tap, fades in. */
function MenuTile({
  icon,
  label,
  accent,
  badge,
  index,
  onPress,
}: {
  icon: IoniconName;
  label: string;
  accent: string;
  badge?: number;
  index: number;
  onPress: () => void;
}) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    // Layout animation (entering) on the wrapper, transform (press spring) on the inner
    // Pressable — mixing both on one animated node makes Reanimated warn.
    <Animated.View entering={FadeInDown.duration(320).delay(140 + index * 55)} style={{ width: '48%' }}>
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      style={[
        {
          width: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          backgroundColor: t.colors.card,
          borderWidth: 1,
          borderColor: t.colors.border,
          borderRadius: t.radius.lg,
          paddingVertical: t.spacing.md,
          paddingHorizontal: t.spacing.md,
        },
        pressStyle,
      ]}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: accent + '26',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={19} color={accent} />
        {badge && badge > 0 ? (
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              paddingHorizontal: 4,
              backgroundColor: t.colors.error,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text variant="caption" style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 10 }}>
              {badge}
            </Text>
          </View>
        ) : null}
      </View>
      <Text variant="small" style={{ flex: 1, fontWeight: '600' }} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
    </Animated.View>
  );
}

/** Profile — a personal story, not an account page (22_PROFILE). */
export default function ProfileScreen() {
  const t = useTheme();
  const { t: tr } = useT();
  const router = useRouter();
  const albums = useAlbumsStore((s) => s.albums);
  const loadAlbums = useAlbumsStore((s) => s.loadAlbums);
  const user = useAuthStore((s) => s.user);
  const favorites = useFavoritesStore((s) => s.places);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const loadFavorites = useFavoritesStore((s) => s.loadFavorites);
  const style = useProfileStyle();
  const accent = style.accent;

  const [pending, setPending] = useState(0);
  const [isFounder, setIsFounder] = useState(false);
  const [dbAvatar, setDbAvatar] = useState<string | null>(null);
  const [verifyLevel, setVerifyLevel] = useState(0);
  const [metrics, setMetrics] = useState<VerifyMetrics | null>(null);
  const [myPlans, setMyPlans] = useState<CommunityPlan[]>([]);
  const showVerifyBadge = useAppStore((s) => s.showVerifyBadge);
  const verifyTier = tierByLevel(verifyLevel);

  // Re-fetch on every focus (not just mount) so a memory finished or a plan published
  // elsewhere shows the moment you return to the tab — Expo Router keeps tabs mounted.
  useFocusEffect(
    useCallback(() => {
      void loadAlbums();
      void loadFavorites();
      const userId = user?.id;
      if (!userId) return;
      let active = true;
      void getPendingCount().then((n) => {
        if (active) setPending(n);
      });
      void getUserPublishedPlans(userId).then((pl) => {
        if (active) setMyPlans(pl);
      });
      // Server truth for avatar + founder flag — refreshed on every focus, so a new
      // profile photo shows the moment you come back to the tab.
      void getPublicProfile(userId).then((p) => {
        if (!active) return;
        setIsFounder(Boolean(p?.isFounder));
        setDbAvatar(p?.avatar ?? null);
        if (!p?.avatar) console.warn('[profile] server returned no avatar for', userId);
        // Self-heal: older builds could leave '' or a local file path in the auth meta,
        // hiding the photo on screens that read only the meta (e.g. profile edit).
        // Copy the server truth back once, then refresh the cached auth user.
        const metaUrl = (useAuthStore.getState().user?.user_metadata as { avatar_url?: string } | undefined)
          ?.avatar_url;
        if (p?.avatar && !(metaUrl ?? '').startsWith('http')) {
          void supabase.auth
            .updateUser({ data: { avatar_url: p.avatar } })
            .then(() => useAuthStore.getState().refreshUser());
        }
      });
      return () => {
        active = false;
      };
    }, [user?.id, loadAlbums, loadFavorites]),
  );

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;
    void getVerifyMetrics().then(async (m) => {
      if (!active) return;
      setMetrics(m);
      // Ratcheted: the highest tier ever reached — a broken streak never takes the badge away.
      const lvl = await resolveVerifyLevel(m);
      if (!active) return;
      setVerifyLevel(lvl);
      maybeCelebrateTier(lvl);
    });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const meta = user?.user_metadata as
    | {
        display_name?: string;
        avatar_url?: string;
        bio?: string;
        home_city?: string;
        pinned_places?: string[];
        interests?: string[];
        prompts?: Record<string, string>;
      }
    | undefined;
  const name = meta?.display_name ?? user?.email?.split('@')[0] ?? 'You';
  // profiles.photo_url is the server truth (exactly what the public preview renders) —
  // it wins; valid auth-meta only bridges the first frames while the fetch is in flight.
  const metaAvatar = meta?.avatar_url?.startsWith('http') ? meta.avatar_url : null;
  const avatarUrl = dbAvatar ?? metaAvatar;
  const [avatarFailedUri, setAvatarFailedUri] = useState<string | null>(null);
  const bio = meta?.bio;
  const homeCity = meta?.home_city;
  const interests = meta?.interests ?? [];
  const prompts = meta?.prompts ?? {};
  const [pinned, setPinned] = useState<string[]>(() => meta?.pinned_places ?? []);

  const onTogglePin = (place: string) => {
    haptics.light();
    setPinned((cur) => {
      const next = cur.includes(place) ? cur.filter((p) => p !== place) : [place, ...cur].slice(0, 6);
      void setPinnedPlaces(next);
      return next;
    });
  };

  const memberSince = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const memories = albums.length;
  const cities = new Set(albums.map((a) => a.city).filter(Boolean)).size;
  const shareProfile = () => {
    const uid = user?.id;
    void Share.share({ message: uid ? `${name} auf UNPLND\nunplnd://user/${uid}` : `${name} auf UNPLND` });
  };

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <ProfileBanner style={style}>
        <View style={{ gap: t.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: t.spacing.sm }}>
            <Pressable
              onPress={shareProfile}
              hitSlop={6}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="share-outline" size={19} color={style.onGradient} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={6}
              style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="settings-outline" size={19} color={style.onGradient} />
            </Pressable>
          </View>
          <Pressable
            onPress={() => router.push('/profile-edit' as Href)}
            style={{ flexDirection: 'row', alignItems: 'flex-start', gap: t.spacing.base }}
          >
            <View style={{ width: 80, height: 80 }}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: t.radius.pill,
                  backgroundColor: accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: style.onGradient,
                }}
              >
                {avatarUrl && avatarUrl !== avatarFailedUri ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    onError={() => {
                      console.warn('[profile] avatar failed to load:', avatarUrl);
                      setAvatarFailedUri(avatarUrl);
                    }}
                  />
                ) : (
                  <Text variant="h1" color="onPrimary">
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderRadius: t.radius.pill,
                  backgroundColor: accent,
                  borderWidth: 2,
                  borderColor: style.onGradient,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="pencil" size={11} color={t.colors.onPrimary} />
              </View>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="h1" style={{ color: style.onGradient, flexShrink: 1 }} numberOfLines={1}>
                  {name}
                </Text>
                {showVerifyBadge && verifyTier ? (
                  <VerifyBadge color={verifyTier.color} size={22} animated={false} />
                ) : null}
              </View>
              {isFounder && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    alignSelf: 'flex-start',
                    backgroundColor: 'rgba(255,255,255,0.22)',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: t.radius.pill,
                    marginTop: 3,
                  }}
                >
                  <Ionicons name="ribbon" size={12} color={style.onGradient} />
                  <Text variant="caption" style={{ color: style.onGradient, fontWeight: '700' }}>
                    {tr('profile.founderBadge')}
                  </Text>
                </View>
              )}
              {homeCity ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 }}>
                  <Ionicons name="location" size={12} color={style.onGradient} />
                  <Text variant="small" style={{ color: style.onGradient, opacity: 0.9 }} numberOfLines={1}>
                    {tr('profile.fromCity', { city: homeCity })}
                  </Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                <Ionicons name="calendar-outline" size={13} color={style.onGradient} style={{ opacity: 0.9 }} />
                <Text variant="small" style={{ color: style.onGradient, opacity: 0.9 }}>
                  {tr('profile.memberSince', { year: memberSince })}
                </Text>
              </View>
              {bio ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 5, marginTop: 2 }}>
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color={style.onGradient} style={{ marginTop: 2, opacity: 0.85 }} />
                  <Text variant="small" style={{ color: style.onGradient, opacity: 0.85, flex: 1 }} numberOfLines={3}>
                    {bio}
                  </Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </ProfileBanner>

      <Animated.View entering={FadeInUp.duration(400).delay(60)}>
        <Card style={{ backgroundColor: accent + '1F', paddingVertical: t.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: t.spacing.xs }}>
            <Stat icon="people-outline" value={metrics?.connections ?? 0} label={tr('profile.connections')} color={accent} />
            <Stat icon="images-outline" value={memories} label={tr('profile.memories')} color={accent} />
            <Stat icon="business-outline" value={cities} label={tr('profile.cities')} color={accent} />
            <Stat icon="flame-outline" value={metrics?.streakDays ?? 0} label={tr('profile.streakStat')} color={accent} />
          </View>
        </Card>
      </Animated.View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: t.spacing.sm }}>
        <MenuTile
          index={0}
          icon="people-outline"
          label={tr('profile.connections')}
          accent={accent}
          badge={pending}
          onPress={() => router.push('/connections' as Href)}
        />
        <MenuTile
          index={1}
          icon="chatbubbles-outline"
          label={tr('profile.messages')}
          accent={accent}
          onPress={() => router.push('/messages' as Href)}
        />
        <MenuTile
          index={2}
          icon="color-palette-outline"
          label={tr('profile.style')}
          accent={accent}
          onPress={() => router.push('/profile-style' as Href)}
        />
        <MenuTile
          index={3}
          icon="shield-checkmark-outline"
          label={tr('profile.verify')}
          accent={accent}
          onPress={() => router.push('/verify' as Href)}
        />
        <MenuTile
          index={4}
          icon="apps-outline"
          label={tr('appIcon.title')}
          accent={accent}
          onPress={() => router.push('/app-icon' as Href)}
        />
        {albums.length > 0 && (
          <MenuTile
            index={4}
            icon="stats-chart-outline"
            label={tr('profile.statsShort')}
            accent={accent}
            /* '/stats' is a real route; cast only because the dev server's typed-route file
               regenerates on next `expo start`. */
            onPress={() => router.push('/stats' as Href)}
          />
        )}
      </View>

      {user?.id && (
        <Animated.View entering={FadeInUp.duration(400).delay(210)}>
          <ProfileHighlights userId={user.id} accent={accent} editable />
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(400).delay(240)}>
        <EveningDNA albums={albums} accent={accent} />
      </Animated.View>

      {albums.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400).delay(270)}>
          <BadgesCollection albums={albums} accent={accent} />
        </Animated.View>
      )}

      {/* 22_PROFILE's open animation is "Stats count up → Map appears → Albums slide in". */}
      <Animated.View entering={FadeInUp.duration(400).delay(285)}>
        <MemoryMap accent={accent} onOpen={() => router.push('/map' as Href)} />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400).delay(300)}>
        {albums.length > 0 ? (
        <View style={{ gap: t.spacing.md }}>
          <SectionHeading title={tr('profile.recentMemories')} accent={accent} />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: t.spacing.base }}>
            {albums.slice(0, 5).map((album) => (
              <MemoryCard
                key={album.id}
                album={album}
                compact
                width={160}
                onPress={() => router.push({ pathname: '/album/[id]', params: { id: album.id } })}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text variant="body" color="textSecondary">
          {tr('profile.emptyStory')}
        </Text>
      )}
      </Animated.View>

      {myPlans.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400).delay(330)}>
          <PublishedPlansGrid
            plans={myPlans}
            accent={accent}
            onOpen={(id) => router.push(`/community/${id}` as Href)}
          />
        </Animated.View>
      )}

      {favorites.length > 0 && (
        <Animated.View entering={FadeInUp.duration(400).delay(360)}>
          <SavedPlaces
            places={favorites}
            albums={albums}
            accent={accent}
            pinned={pinned}
            onTogglePin={onTogglePin}
            onRemove={(place) => void toggleFavorite(place)}
          />
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.duration(400).delay(380)}>
        <ProfileExtras interests={interests} prompts={prompts} accent={accent} />
      </Animated.View>
    </Screen>
  );
}
