import { router } from 'expo-router';

import { usePlannerStore } from './planner-store';

/** Quick categories on Home (17_HOME) mapped to Planner moods — each opens the Planner with a preset. */
export const QUICK_CATEGORIES: { label: string; mood: string }[] = [
  { label: 'Dinner', mood: 'Food' },
  { label: 'Drinks', mood: 'Drinks' },
  { label: 'Sunset', mood: 'Romantic' },
  { label: 'Nature', mood: 'Nature' },
  { label: 'Nightlife', mood: 'Party' },
  { label: 'Café', mood: 'Relaxed' },
  { label: 'Activities', mood: 'Activities' },
  { label: 'Movie Night', mood: 'Stay In' },
];

/** Open the Planner with a mood already answered — the conversation continues at question 2. */
export function startPlannerWithMood(mood: string) {
  const store = usePlannerStore.getState();
  store.reset();
  store.setSingle('mood', mood);
  router.navigate('/planner');
}
