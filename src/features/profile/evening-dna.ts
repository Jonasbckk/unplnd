import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Album } from '@/features/albums/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface DnaTrait {
  mood: string;
  icon: IoniconName;
  pct: number;
}

export interface EarnedBadge {
  key: string;
  icon: IoniconName;
}

const TRAIT_ICON: Record<string, IoniconName> = {
  Romantic: 'partly-sunny-outline',
  Party: 'musical-notes-outline',
  Relaxed: 'cafe-outline',
  Cozy: 'home-outline',
  Adventure: 'compass-outline',
  Luxury: 'diamond-outline',
};

/** Your "Evening DNA" — the share each mood makes up of your evenings (real data only). */
export function computeDNA(albums: Album[]): DnaTrait[] {
  const total = albums.length;
  if (total === 0) return [];
  const counts = new Map<string, number>();
  for (const a of albums) if (a.mood) counts.set(a.mood, (counts.get(a.mood) ?? 0) + 1);
  return [...counts.entries()]
    .map(([mood, n]) => ({ mood, icon: TRAIT_ICON[mood] ?? 'sparkles-outline', pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

interface BadgeCtx {
  evenings: number;
  cities: number;
  photos: number;
  moods: Record<string, number>;
}

// Earned from real activity — stylish, not over-gamified.
const BADGE_DEFS: { key: string; icon: IoniconName; test: (c: BadgeCtx) => boolean }[] = [
  { key: 'firstEvening', icon: 'sparkles-outline', test: (c) => c.evenings >= 1 },
  { key: 'cityHopper', icon: 'map-outline', test: (c) => c.cities >= 3 },
  { key: 'sunsetCollector', icon: 'partly-sunny-outline', test: (c) => (c.moods.Romantic ?? 0) >= 3 },
  { key: 'nightExplorer', icon: 'moon-outline', test: (c) => (c.moods.Party ?? 0) >= 3 },
  { key: 'cafeExpert', icon: 'cafe-outline', test: (c) => (c.moods.Relaxed ?? 0) >= 3 },
  { key: 'memoryMaker', icon: 'images-outline', test: (c) => c.photos >= 12 },
  { key: 'regular', icon: 'trophy-outline', test: (c) => c.evenings >= 5 },
];

export function computeBadges(albums: Album[]): EarnedBadge[] {
  const moods: Record<string, number> = {};
  const cities = new Set<string>();
  let photos = 0;
  for (const a of albums) {
    if (a.mood) moods[a.mood] = (moods[a.mood] ?? 0) + 1;
    if (a.city) cities.add(a.city);
    photos += a.photoCount ?? 0;
  }
  const ctx: BadgeCtx = { evenings: albums.length, cities: cities.size, photos, moods };
  return BADGE_DEFS.filter((b) => b.test(ctx)).map((b) => ({ key: b.key, icon: b.icon }));
}
