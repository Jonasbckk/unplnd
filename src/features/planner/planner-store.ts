import { create } from 'zustand';

import type { GeneratedPlan, PlannerAnswers } from './types';

type SingleKey = 'mood' | 'group' | 'budget' | 'transport' | 'time';

interface PlannerState {
  answers: PlannerAnswers;
  plan?: GeneratedPlan;
  setSingle: (key: SingleKey, value: string) => void;
  togglePreference: (value: string) => void;
  /** Set the free-text request (the "just tell us" path). */
  setRequest: (text: string) => void;
  setPlan: (plan: GeneratedPlan) => void;
  reset: () => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  answers: { preferences: [] },
  plan: undefined,
  // Tapping a chip means the structured path — clear any stale free-text request.
  setSingle: (key, value) => set((s) => ({ answers: { ...s.answers, [key]: value, request: undefined } })),
  togglePreference: (value) =>
    set((s) => {
      const has = s.answers.preferences.includes(value);
      return {
        answers: {
          ...s.answers,
          request: undefined,
          preferences: has
            ? s.answers.preferences.filter((p) => p !== value)
            : [...s.answers.preferences, value],
        },
      };
    }),
  setRequest: (text) => set((s) => ({ answers: { ...s.answers, request: text } })),
  setPlan: (plan) => set({ plan }),
  reset: () => set({ answers: { preferences: [] }, plan: undefined }),
}));

export const REQUIRED_KEYS: SingleKey[] = ['mood', 'group', 'budget', 'transport', 'time'];

/** True once every required question has an answer. */
export function isPlanReady(answers: PlannerAnswers): boolean {
  return REQUIRED_KEYS.every((key) => Boolean(answers[key]));
}
