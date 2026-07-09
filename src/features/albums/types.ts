import type { PlanStop } from '@/features/planner/types';

export type AlbumMood = 'Romantic' | 'Relaxed' | 'Party' | 'Cozy' | 'Adventure' | 'Luxury';

export interface Album {
  id: string;
  title: string;
  city: string;
  date: string; // ISO date
  mood: AlbumMood; // normalized to the 6 themed moods — drives coverColor/accents only
  /** The exact mood the user picked (may be outside AlbumMood, e.g. 'Beach', 'Road Trip').
   * Used for Evening DNA / stats so the profile tab matches the server-side public aggregate. */
  moodRaw?: string;
  weather: string; // e.g. "22°C · Clear sky"
  coverColor: string; // derived from mood, drives accents
  timeline: PlanStop[];
  photoCount: number;
  favorite: boolean;
  note?: string;
  /** The plans row this album came from — carries the user's self-rating (Feature C). */
  planId?: string;
  /** True while this album exists only locally and is waiting to sync to the server (offline). */
  pending?: boolean;
}
