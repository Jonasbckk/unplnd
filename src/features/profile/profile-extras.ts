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

export const MAX_INTERESTS = 10;
