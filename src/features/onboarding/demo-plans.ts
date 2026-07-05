import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface DemoStop {
  time: string;
  de: string;
  en: string;
  /** Fallback shown if a stop has no photo yet. */
  icon: IoniconName;
  /** Curated bundled photo (require(...)). Optional so a plan renders before its images land. */
  image?: ImageSourcePropType;
}

export interface DemoMeta {
  /** Per-mood accent that tints the preview gradient, route line and navigate button. */
  accent: string;
  /** Playful (not real) total route distance — this is a teaser, not a live plan. */
  distanceKm: string;
}

/** Visual identity per mood, so each sample evening feels distinct (onboarding flourish only). */
export const DEMO_META: Record<string, DemoMeta> = {
  'Stay In': { accent: '#D4884A', distanceKm: '0,8 km' },
  Romantic: { accent: '#C56B87', distanceKm: '2,4 km' },
  Activities: { accent: '#5E9179', distanceKm: '3,6 km' },
  Party: { accent: '#9265C4', distanceKm: '4,2 km' },
};

/**
 * The four onboarding sample evenings — one per mood chip. Titles are intentionally generic
 * (no real venues): onboarding runs before location permission, so we never promise a specific
 * place. Show the result, never the technology (16_ONBOARDING).
 *
 * Photos live in `assets/onboarding/` (see the README there for the filename → stop mapping).
 */
export const DEMO_PLANS: Record<string, DemoStop[]> = {
  'Stay In': [
    {
      time: '19:30',
      de: 'Zutaten fürs gemeinsame Kochen besorgen',
      en: 'Grab ingredients to cook together',
      icon: 'basket-outline',
      image: require('../../../assets/onboarding/zuhause-1.jpg'),
    },
    {
      time: '20:30',
      de: 'Zusammen kochen & essen',
      en: 'Cook and eat together',
      icon: 'restaurant-outline',
      image: require('../../../assets/onboarding/zuhause-2.jpg'),
    },
    {
      time: '22:00',
      de: 'Filmabend mit Decke und Snacks',
      en: 'Movie night with a blanket and snacks',
      icon: 'film-outline',
      image: require('../../../assets/onboarding/zuhause-3.jpg'),
    },
  ],
  Romantic: [
    {
      time: '19:00',
      de: 'Abendessen in einer gemütlichen Trattoria',
      en: 'Dinner at a cozy trattoria',
      icon: 'restaurant-outline',
      image: require('../../../assets/onboarding/romantic-1.jpg'),
    },
    {
      time: '21:00',
      de: 'Sonnenuntergangs-Spaziergang am Fluss',
      en: 'Sunset walk along the river',
      icon: 'walk-outline',
      image: require('../../../assets/onboarding/romantic-2.jpg'),
    },
    {
      time: '22:30',
      de: 'Cocktails in der Rooftop-Bar',
      en: 'Cocktails at a rooftop bar',
      icon: 'wine-outline',
      image: require('../../../assets/onboarding/romantic-3.jpg'),
    },
  ],
  Activities: [
    {
      time: '18:30',
      de: 'Bouldern oder Minigolf',
      en: 'Bouldering or mini-golf',
      icon: 'barbell-outline',
      image: require('../../../assets/onboarding/activity-1.jpg'),
    },
    {
      time: '20:30',
      de: 'Streetfood-Markt erkunden',
      en: 'Explore a street-food market',
      icon: 'fast-food-outline',
      image: require('../../../assets/onboarding/activity-2.jpg'),
    },
    {
      time: '22:00',
      de: 'Absacker in einer Craft-Beer-Bar',
      en: 'Nightcap at a craft-beer bar',
      icon: 'beer-outline',
      image: require('../../../assets/onboarding/activity-3.jpg'),
    },
  ],
  Party: [
    {
      time: '20:00',
      de: 'Vorglühen in einer Cocktailbar',
      en: 'Warm up at a cocktail bar',
      icon: 'wine-outline',
      image: require('../../../assets/onboarding/party-1.jpg'),
    },
    {
      time: '22:00',
      de: 'Live-Musik oder DJ-Set',
      en: 'Live music or a DJ set',
      icon: 'musical-notes-outline',
      image: require('../../../assets/onboarding/party-2.jpg'),
    },
    {
      time: '23:30',
      de: 'Tanzen im Club',
      en: 'Dancing at a club',
      icon: 'sparkles-outline',
      image: require('../../../assets/onboarding/party-3.jpg'),
    },
  ],
};
