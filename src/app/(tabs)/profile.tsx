import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useState, type ComponentProps } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Card, Screen, Text, useCountUp } from '@/components/ui';
import { MemoryCard } from '@/features/albums/MemoryCard';
import { useAlbumsStore } from '@/features/albums/albums-store';
import { useAuthStore } from '@/features/auth/auth-store';
import { useFavoritesStore } from '@/features/favorites/favorites-store';
import { EveningDNA } from '@/features/profile/EveningDNA';
import { ProfileBanner } from '@/features/profile/ProfileBanner';
import { ProfileExtras } from '@/features/profile/ProfileExtras';
import { useProfileStyle } from '@/features/profile/profile-styles';
import { maybeCelebrateTier } from '@/features/celebrate/celebrate-store';
import { VerifyBadge } from '@/features/verify/VerifyBadge';
import { currentTierLevel, getVerifyMetrics, tierByLevel } from '@/features/verify/verification';
import { getPublicProfile } from '@/lib/community';
import { getPendingCount } from '@/lib/connections';
import { haptics } from '@/lib/haptics';
import { setPinnedPlaces } from '@/lib/profile';
import { optionLabel, useT } from '@/lib/i18n';
import { useAppStore } from '@/store/app-store';
import { useTheme } from '@/theme';

function mostCommon(items: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item) continue;
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best: string | undefined;
  let bestCount = 0;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

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
    <AnimatedPressable
      entering={FadeInDown.duration(320).delay(140 + index * 55)}
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 220 });
      }}
      style={[
        {
          width: '48%',
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
          backgroundColor: t.colors.surfaceSecondary,
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
  const [verifyLevel, setVerifyLevel] = useState(0);
  const showVerifyBadge = useAppStore((s) => s.showVerifyBadge);
  const verifyTier = tierByLevel(verifyLevel);

  useEffect(() => {
    void loadAlbums();
    void loadFavorites();
  }, [loadAlbums, loadFavorites]);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return;
    let active = true;
    void getPendingCount().then((n) => {
      if (active) setPending(n);
    });
    void getPublicProfile(userId).then((p) => {
      if (active) setIsFounder(Boolean(p?.isFounder));
    });
    void getVerifyMetrics().then((m) => {
      if (!active) return;
      const lvl = currentTierLevel(m);
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
  const avatarUrl = meta?.avatar_url;
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
  const favoriteMoodValue = mostCommon(albums.map((a) => a.mood));
  const favoriteMood = favoriteMoodValue ? optionLabel(favoriteMoodValue) : '—';

  return (
    <Screen scroll contentStyle={{ gap: t.spacing.lg }}>
      <ProfileBanner style={style}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base }}>
          <Pressable
            onPress={() => router.push('/profile-edit' as Href)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: t.spacing.base, flex: 1 }}
          >
            <View style={{ width: 64, height: 64 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: t.radius.pill,
                  backgroundColor: accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  borderWidth: 2,
                  borderColor: style.onGradient,
                }}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
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
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="h1" style={{ color: style.onGradient }} numberOfLines={1}>
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
              <Text variant="small" style={{ color: style.onGradient, opacity: 0.85 }}>
                {tr('profile.memberSince', { year: memberSince })}
              </Text>
              {bio ? (
                <Text variant="small" style={{ color: style.onGradient, opacity: 0.85, marginTop: 2 }} numberOfLines={2}>
                  {bio}
                </Text>
              ) : null}
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/settings')} hitSlop={8}>
            <Ionicons name="settings-outline" size={24} color={style.onGradient} />
          </Pressable>
        </View>
      </ProfileBanner>

      <Animated.View entering={FadeInUp.duration(400).delay(60)}>
        <Card style={{ backgroundColor: accent + '1F' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', gap: t.spacing.xs }}>
            <Stat icon="images-outline" value={memories} label={tr('profile.memories')} color={accent} />
            <Stat icon="navigate-outline" value={cities} label={tr('profile.cities')} color={accent} />
            <Stat icon="heart-outline" value={favorites.length} label={tr('profile.saved')} color={accent} />
            <Stat icon="sparkles-outline" value={favoriteMood} label={tr('profile.topMood')} color={accent} />
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

      <Animated.View entering={FadeInUp.duration(400).delay(240)}>
        <EveningDNA albums={albums} accent={accent} />
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

      {favorites.length > 0 && (
        <View style={{ gap: t.spacing.md }}>
          <SectionHeading title={tr('profile.savedPlaces')} accent={accent} />
          <Text variant="caption" color="textSecondary">
            {tr('profile.pinHint')}
          </Text>
          <Card padded={false} style={{ paddingHorizontal: t.spacing.base, backgroundColor: accent + '14' }}>
            {favorites.map((place, i) => (
              <View
                key={place}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: t.spacing.md,
                  paddingVertical: t.spacing.md,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: t.colors.divider,
                }}
              >
                <Ionicons name="location-outline" size={18} color={accent} />
                <Text variant="body" style={{ flex: 1 }} numberOfLines={1}>
                  {place}
                </Text>
                <Pressable hitSlop={8} onPress={() => onTogglePin(place)}>
                  <Ionicons
                    name={pinned.includes(place) ? 'pin' : 'pin-outline'}
                    size={18}
                    color={pinned.includes(place) ? accent : t.colors.textSecondary}
                  />
                </Pressable>
                <Pressable
                  hitSlop={8}
                  onPress={() => {
                    haptics.light();
                    void toggleFavorite(place);
                  }}
                >
                  <Ionicons name="heart" size={18} color={accent} />
                </Pressable>
              </View>
            ))}
          </Card>
        </View>
      )}

      <Animated.View entering={FadeInUp.duration(400).delay(380)}>
        <ProfileExtras interests={interests} prompts={prompts} accent={accent} />
      </Animated.View>
    </Screen>
  );
}
