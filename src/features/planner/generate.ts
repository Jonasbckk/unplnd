import { i18n, optionLabel } from '@/lib/i18n';
import type { GeneratedPlan, PlanStop, PlannerAnswers } from './types';

/**
 * Mock evening generator — the offline/failure fallback behind the AI service layer.
 * Follows the Experience Engine shape: Food → Activity → Memory Moment → Drinks (18B).
 * All copy comes from the i18n dictionaries so the fallback speaks the app language.
 */
const START_HOUR = 19;

interface MockStop {
  title: string;
  reason: string;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function fmt(h: number, m: number): string {
  return `${String(h % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function mockList(key: 'dinners' | 'activities' | 'moments' | 'drinks'): MockStop[] {
  return i18n.t(`mock.${key}`) as unknown as MockStop[];
}

export function generatePlan(answers: PlannerAnswers): GeneratedPlan {
  const stops: PlanStop[] = [];
  let hour = START_HOUR;
  let minute = 0;
  const add = (stop: Omit<PlanStop, 'time'>, durationMin: number) => {
    stops.push({ time: fmt(hour, minute), ...stop });
    const total = minute + durationMin;
    hour += Math.floor(total / 60);
    minute = total % 60;
  };

  add({ category: 'Dinner', ...pick(mockList('dinners')) }, 90);
  add({ category: 'Activity', ...pick(mockList('activities')) }, 75);
  add({ category: 'Memory', ...pick(mockList('moments')), memoryMoment: true }, 45);
  add({ category: 'Drinks', ...pick(mockList('drinks')) }, 60);

  const moodLabel = answers.mood ? optionLabel(answers.mood) : '✨';
  const estimatedCost =
    answers.budget === 'Free' ? '€0' : answers.budget === 'Unlimited' ? '€120' : answers.budget ?? '€50';

  return {
    title: i18n.t('mock.title', { mood: moodLabel }),
    summary: i18n.t('mock.summary'),
    stops,
    estimatedCost,
    duration: answers.time ? optionLabel(answers.time) : '4h',
    score: 82 + Math.floor(Math.random() * 13),
  };
}
