import { type ComponentProps } from 'react';
import { type Ionicons } from '@expo/vector-icons';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Canonical planner option value → rounded outlined icon (08_COMPONENTS: consistent stroke). */
const ICONS: Record<string, IoniconName> = {
  // Mood
  Relaxed: 'cafe-outline',
  Romantic: 'heart-outline',
  Party: 'sparkles-outline',
  Drinks: 'wine-outline',
  Food: 'restaurant-outline',
  Nature: 'leaf-outline',
  Activities: 'basketball-outline',
  'Road Trip': 'car-sport-outline',
  Beach: 'sunny-outline',
  'Stay In': 'home-outline',
  Culture: 'color-palette-outline',
  'Surprise Me': 'dice-outline',
  // Group
  Solo: 'person-outline',
  '2': 'people-outline',
  '3–4': 'people-outline',
  '5–8': 'people-outline',
  '9+': 'people-outline',
  // Transport
  Walking: 'walk-outline',
  Car: 'car-outline',
  Bike: 'bicycle-outline',
  'Public Transport': 'bus-outline',
  'Uber / Taxi': 'car-sport-outline',
  Any: 'shuffle-outline',
  // Preferences
  Indoor: 'home-outline',
  Outdoor: 'partly-sunny-outline',
  'Dog Friendly': 'paw-outline',
  'Wheelchair Accessible': 'accessibility-outline',
  Quiet: 'moon-outline',
  Lively: 'flame-outline',
  'Hidden Gems': 'sparkles-outline',
  'Local Favorites': 'star-outline',
  Luxury: 'diamond-outline',
  'Student Friendly': 'school-outline',
};

export function optionIcon(value: string): IoniconName {
  return ICONS[value] ?? 'ellipse-outline';
}
