import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ComponentProps } from 'react';

import { usePlannerStore } from './planner-store';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

/** Quick categories on Home (17_HOME) mapped to Planner moods — each opens the Planner with a preset. */
export const QUICK_CATEGORIES: { label: string; mood: string; icon: IoniconName }[] = [
  { label: 'Dinner', mood: 'Food', icon: 'restaurant-outline' },
  { label: 'Drinks', mood: 'Drinks', icon: 'wine-outline' },
  { label: 'Sunset', mood: 'Romantic', icon: 'heart-outline' },
  { label: 'Nature', mood: 'Nature', icon: 'leaf-outline' },
  { label: 'Nightlife', mood: 'Party', icon: 'musical-notes-outline' },
  { label: 'Café', mood: 'Relaxed', icon: 'cafe-outline' },
  { label: 'Activities', mood: 'Activities', icon: 'bicycle-outline' },
  { label: 'Movie Night', mood: 'Stay In', icon: 'film-outline' },
];

/** Open the Planner with a mood already answered — the conversation continues at question 2. */
export function startPlannerWithMood(mood: string) {
  const store = usePlannerStore.getState();
  store.reset();
  store.setSingle('mood', mood);
  router.navigate('/planner');
}
