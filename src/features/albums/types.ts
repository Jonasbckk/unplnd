import type { PlanStop } from '@/features/planner/types';

export type AlbumMood = 'Romantic' | 'Relaxed' | 'Party' | 'Cozy' | 'Adventure' | 'Luxury';

export interface Album {
  id: string;
  title: string;
  city: string;
  date: string; // ISO date
  mood: AlbumMood;
  weather: string; // e.g. "22°C · Clear sky"
  coverColor: string; // derived from mood, drives accents
  timeline: PlanStop[];
  photoCount: number;
  favorite: boolean;
  note?: string;
  /** The plans row this album came from — carries the user's self-rating (Feature C). */
  planId?: string;
}
