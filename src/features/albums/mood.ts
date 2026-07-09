import type { AlbumMood } from './types';

/** The six themed album moods — the palette the whole app tints memories with. */
export const ALBUM_MOODS: readonly AlbumMood[] = ['Romantic', 'Relaxed', 'Party', 'Cozy', 'Adventure', 'Luxury'];

/** Collapse any planner mood (there are 16+) to the six themed album moods (unknown → 'Relaxed'). */
export function normalizeAlbumMood(mood?: string): AlbumMood {
  return ALBUM_MOODS.includes(mood as AlbumMood) ? (mood as AlbumMood) : 'Relaxed';
}

/**
 * Re-bucket raw mood counts (e.g. from the public-profile stats RPC, which returns the exact picked
 * moods) into the six themed moods — so someone else's Evening DNA looks the same clean way as the
 * owner's own profile tab (whose albums are already normalized on load), not a long raw list.
 */
export function normalizeMoodCounts(raw: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [mood, n] of Object.entries(raw)) {
    const key = normalizeAlbumMood(mood);
    out[key] = (out[key] ?? 0) + n;
  }
  return out;
}
