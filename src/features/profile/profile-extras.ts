import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Icon per interest — shown on the chips everywhere. */
export const INTEREST_ICONS: Record<string, IoniconName> = {
  sushi: 'restaurant-outline',
  cocktails: 'wine-outline',
  livemusic: 'musical-notes-outline',
  hiking: 'walk-outline',
  art: 'color-palette-outline',
  coffee: 'cafe-outline',
  dancing: 'body-outline',
  brunch: 'egg-outline',
  rooftop: 'business-outline',
  cinema: 'film-outline',
  concerts: 'mic-outline',
  bars: 'beer-outline',
  nature: 'leaf-outline',
  museums: 'library-outline',
  streetfood: 'fast-food-outline',
  wine: 'wine-outline',
  games: 'game-controller-outline',
  sports: 'football-outline',
  photography: 'camera-outline',
  wellness: 'flower-outline',
};

/** Selectable interests (labels live in i18n under `interests.<key>`). */
export const INTERESTS = [
  'sushi',
  'cocktails',
  'livemusic',
  'hiking',
  'art',
  'coffee',
  'dancing',
  'brunch',
  'rooftop',
  'cinema',
  'concerts',
  'bars',
  'nature',
  'museums',
  'streetfood',
  'wine',
  'games',
  'sports',
  'photography',
  'wellness',
] as const;

/** Profile prompts the user can answer (questions live in i18n under `prompts.<key>`). */
export const PROMPTS = ['perfectEvening', 'takeMeTo', 'neighborhood', 'planStyle'] as const;

/** Pre-made answer options per prompt (no free text). Labels live in i18n under `promptOpts.<prompt>.<opt>`. */
export const PROMPT_OPTIONS: Record<string, string[]> = {
  perfectEvening: ['goodfood', 'rooftop', 'spontaneous', 'planned', 'livemusic', 'cozy', 'longnight'],
  takeMeTo: ['cocktailbar', 'hiddenrestaurant', 'rooftopview', 'livegig', 'cozycafe', 'dancefloor', 'nature'],
  neighborhood: ['busy', 'quiet', 'trendy', 'central', 'waterside', 'local'],
  planStyle: ['spontaneous', 'detailed', 'roughidea', 'letapp', 'together', 'surprise'],
};

export const MAX_INTERESTS = 10;
