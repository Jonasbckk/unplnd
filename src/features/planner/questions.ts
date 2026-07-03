/**
 * The Planner conversation — one question at a time (18_PLANNER).
 * Order: Mood → Group → Budget → Transport → Time → Preferences.
 * Option VALUES are canonical (stored in DB, sent to the AI); display labels live in i18n.
 */
export type QuestionType = 'single' | 'multi' | 'slider';

export interface Question {
  key: 'mood' | 'group' | 'budget' | 'transport' | 'time' | 'preferences';
  type: QuestionType;
  options: string[];
  optional?: boolean;
}

export const QUESTIONS: Question[] = [
  {
    key: 'mood',
    type: 'single',
    options: [
      'Relaxed',
      'Romantic',
      'Party',
      'Drinks',
      'Food',
      'Nature',
      'Activities',
      'Road Trip',
      'Beach',
      'Stay In',
      'Culture',
      'Surprise Me',
    ],
  },
  { key: 'group', type: 'single', options: ['Solo', '2', '3–4', '5–8', '9+'] },
  { key: 'budget', type: 'slider', options: ['Free', '€20', '€50', '€100', 'Unlimited'] },
  { key: 'transport', type: 'single', options: ['Walking', 'Car', 'Bike', 'Public Transport', 'Uber / Taxi', 'Any'] },
  { key: 'time', type: 'slider', options: ['2h', '3h', '5h', 'Whole Evening'] },
  {
    key: 'preferences',
    type: 'multi',
    optional: true,
    options: [
      'Indoor',
      'Outdoor',
      'Dog Friendly',
      'Wheelchair Accessible',
      'Quiet',
      'Lively',
      'Hidden Gems',
      'Local Favorites',
      'Luxury',
      'Student Friendly',
    ],
  },
];
