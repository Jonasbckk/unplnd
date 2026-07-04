import type { Album } from '@/features/albums/types';

export interface DnaTrait {
  mood: string;
  emoji: string;
  pct: number;
}

export interface EarnedBadge {
  key: string;
  emoji: string;
}

const TRAIT_EMOJI: Record<string, string> = {
  Romantic: '🌅',
  Party: '🎶',
  Relaxed: '☕',
  Cozy: '🛋️',
  Adventure: '🌿',
  Luxury: '✨',
};

/** Your "Evening DNA" — the share each mood makes up of your evenings (real data only). */
export function computeDNA(albums: Album[]): DnaTrait[] {
  const total = albums.length;
  if (total === 0) return [];
  const counts = new Map<string, number>();
  for (const a of albums) if (a.mood) counts.set(a.mood, (counts.get(a.mood) ?? 0) + 1);
  return [...counts.entries()]
    .map(([mood, n]) => ({ mood, emoji: TRAIT_EMOJI[mood] ?? '✨', pct: Math.round((n / total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

interface BadgeCtx {
  evenings: number;
  cities: number;
  photos: number;
  moods: Record<string, number>;
}

// Earned from real activity — stylish, not over-gamified.
const BADGE_DEFS: { key: string; emoji: string; test: (c: BadgeCtx) => boolean }[] = [
  { key: 'firstEvening', emoji: '✨', test: (c) => c.evenings >= 1 },
  { key: 'cityHopper', emoji: '🗺️', test: (c) => c.cities >= 3 },
  { key: 'sunsetCollector', emoji: '🌅', test: (c) => (c.moods.Romantic ?? 0) >= 3 },
  { key: 'nightExplorer', emoji: '🎉', test: (c) => (c.moods.Party ?? 0) >= 3 },
  { key: 'cafeExpert', emoji: '☕', test: (c) => (c.moods.Relaxed ?? 0) >= 3 },
  { key: 'memoryMaker', emoji: '📸', test: (c) => c.photos >= 12 },
  { key: 'regular', emoji: '🏆', test: (c) => c.evenings >= 5 },
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
  return BADGE_DEFS.filter((b) => b.test(ctx)).map((b) => ({ key: b.key, emoji: b.emoji }));
}
