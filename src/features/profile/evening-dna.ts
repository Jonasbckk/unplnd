import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Album } from '@/features/albums/types';
import { optionIcon } from '@/features/planner/optionIcons';

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

/** Your "Evening DNA" — the share each mood makes up of your evenings (real data only).
 * Icons reuse the planner's canonical mood→icon map so a mood looks the same everywhere. */
export function computeDNA(albums: Album[]): DnaTrait[] {
  const total = albums.length;
  if (total === 0) return [];
  const counts = new Map<string, number>();
  for (const a of albums) {
    const mood = a.moodRaw ?? a.mood;
    if (mood) counts.set(mood, (counts.get(mood) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([mood, n]) => ({ mood, icon: optionIcon(mood), pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

/** Evening DNA from server-side mood counts — for another user's public profile (private albums stay private). */
export function computeDNAFromMoodCounts(moods: Record<string, number>): DnaTrait[] {
  const total = Object.values(moods).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return Object.entries(moods)
    .map(([mood, n]) => ({ mood, icon: optionIcon(mood), pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

export interface BadgeCtx {
  evenings: number;
  cities: number;
  photos: number;
  moods: Record<string, number>;
}

function buildCtx(albums: Album[]): BadgeCtx {
  const moods: Record<string, number> = {};
  const cities = new Set<string>();
  let photos = 0;
  for (const a of albums) {
    const mood = a.moodRaw ?? a.mood;
    if (mood) moods[mood] = (moods[mood] ?? 0) + 1;
    if (a.city) cities.add(a.city);
    photos += a.photoCount ?? 0;
  }
  return { evenings: albums.length, cities: cities.size, photos, moods };
}

export interface BadgeDef {
  key: string;
  icon: IoniconName;
  /** How many are needed to earn it. */
  target: number;
  /** Your current count toward it, from real activity. */
  value: (c: BadgeCtx) => number;
}

// Earned from real activity — stylish, not over-gamified. Order = collection order.
export const BADGE_DEFS: BadgeDef[] = [
  { key: 'firstEvening', icon: 'sparkles-outline', target: 1, value: (c) => c.evenings },
  { key: 'regular', icon: 'trophy-outline', target: 5, value: (c) => c.evenings },
  { key: 'cityHopper', icon: 'map-outline', target: 3, value: (c) => c.cities },
  { key: 'sunsetCollector', icon: 'partly-sunny-outline', target: 3, value: (c) => c.moods.Romantic ?? 0 },
  { key: 'nightExplorer', icon: 'moon-outline', target: 3, value: (c) => c.moods.Party ?? 0 },
  { key: 'cafeExpert', icon: 'cafe-outline', target: 3, value: (c) => c.moods.Relaxed ?? 0 },
  { key: 'memoryMaker', icon: 'images-outline', target: 12, value: (c) => c.photos },
];

export interface BadgeProgress {
  key: string;
  icon: IoniconName;
  /** Current progress, capped at target (so an earned badge reads target/target). */
  current: number;
  target: number;
  earned: boolean;
}

/** Every badge with its progress — earned and still-locked — for the collection view. */
export function computeAllBadges(albums: Album[]): BadgeProgress[] {
  return computeAllBadgesFromCtx(buildCtx(albums));
}

/** Badge progress from a pre-aggregated context — for another user's public profile. */
export function computeAllBadgesFromCtx(ctx: BadgeCtx): BadgeProgress[] {
  return BADGE_DEFS.map((b) => {
    const raw = b.value(ctx);
    return { key: b.key, icon: b.icon, current: Math.min(raw, b.target), target: b.target, earned: raw >= b.target };
  });
}

/** Only the earned badges. */
export function computeBadges(albums: Album[]): EarnedBadge[] {
  return computeAllBadges(albums)
    .filter((b) => b.earned)
    .map((b) => ({ key: b.key, icon: b.icon }));
}
