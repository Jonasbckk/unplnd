import type { ComponentProps } from 'react';
import type { ImageSourcePropType } from 'react-native';
import type { Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface DemoStop {
  time: string;
  de: string;
  en: string;
  /** Fallback shown until a real photo is wired in for this stop. */
  icon: IoniconName;
  /** Curated bundled photo (require(...)). Optional so a plan renders before its images land. */
  image?: ImageSourcePropType;
}

/**
 * The four onboarding sample evenings — one per mood chip. Titles are intentionally generic
 * (no real venues): onboarding runs before location permission, so we never promise a specific
 * place. Show the result, never the technology (16_ONBOARDING).
 *
 * To add a photo to a stop, drop the file in `assets/onboarding/` and set
 * `image: require('../../../assets/onboarding/<name>.jpg')` on that stop.
 */
export const DEMO_PLANS: Record<string, DemoStop[]> = {
  'Stay In': [
    {
      time: '19:30',
      de: 'Zutaten fürs gemeinsame Kochen besorgen',
      en: 'Grab ingredients to cook together',
      icon: 'basket-outline',
    },
    {
      time: '20:30',
      de: 'Zusammen kochen & essen',
      en: 'Cook and eat together',
      icon: 'restaurant-outline',
    },
    {
      time: '22:00',
      de: 'Filmabend mit Decke und Snacks',
      en: 'Movie night with a blanket and snacks',
      icon: 'film-outline',
    },
  ],
  Romantic: [
    {
      time: '19:00',
      de: 'Abendessen in einer gemütlichen Trattoria',
      en: 'Dinner at a cozy trattoria',
      icon: 'restaurant-outline',
    },
    {
      time: '21:00',
      de: 'Sonnenuntergangs-Spaziergang am Fluss',
      en: 'Sunset walk along the river',
      icon: 'walk-outline',
    },
    {
      time: '22:30',
      de: 'Cocktails in der Rooftop-Bar',
      en: 'Cocktails at a rooftop bar',
      icon: 'wine-outline',
    },
  ],
  Activities: [
    {
      time: '18:30',
      de: 'Bouldern oder Minigolf',
      en: 'Bouldering or mini-golf',
      icon: 'barbell-outline',
    },
    {
      time: '20:30',
      de: 'Streetfood-Markt erkunden',
      en: 'Explore a street-food market',
      icon: 'fast-food-outline',
    },
    {
      time: '22:00',
      de: 'Absacker in einer Craft-Beer-Bar',
      en: 'Nightcap at a craft-beer bar',
      icon: 'beer-outline',
    },
  ],
  Party: [
    {
      time: '20:00',
      de: 'Vorglühen in einer Cocktailbar',
      en: 'Warm up at a cocktail bar',
      icon: 'wine-outline',
    },
    {
      time: '22:00',
      de: 'Live-Musik oder DJ-Set',
      en: 'Live music or a DJ set',
      icon: 'musical-notes-outline',
    },
    {
      time: '23:30',
      de: 'Tanzen im Club',
      en: 'Dancing at a club',
      icon: 'sparkles-outline',
    },
  ],
};
