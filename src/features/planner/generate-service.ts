import { i18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppLocation } from '@/lib/location';
import { getWeather } from '@/lib/weather';
import { generatePlan } from './generate';
import type { GeneratedPlan, PlannerAnswers } from './types';

// The real-places pipeline (Google Places → AI curation → photos) needs more room than a
// plain AI call — especially on the Gemini free tier, which can be slow. Past this we fall
// back rather than keep users waiting (18A). 20s was too tight and hit the mock often.
const TIMEOUT_MS = 30000;

interface EdgeResponse {
  plan?: GeneratedPlan;
  error?: { code: string; message: string; retryable: boolean };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * The AI service layer (14_TECH_STACK): the app only talks to this function, never to a provider.
 * Location is REQUIRED — callers gate on it (no default-city plans). Falls back to the local
 * generator only on AI/service failure, never on missing location (18A).
 */
export async function generateEvening(answers: PlannerAnswers, location: AppLocation): Promise<GeneratedPlan> {
  if (!isSupabaseConfigured) {
    return generatePlan(answers);
  }

  try {
    const weather = await getWeather(location.latitude, location.longitude).catch(() => null);
    const { data, error } = await withTimeout(
      supabase.functions.invoke<EdgeResponse>('generate-plan', {
        body: {
          mood: answers.mood,
          group: answers.group,
          budget: answers.budget,
          transport: answers.transport,
          time: answers.time,
          preferences: answers.preferences,
          request: answers.request,
          city: location.city,
          latitude: location.latitude,
          longitude: location.longitude,
          language: i18n.locale,
          weather: weather
            ? { condition: weather.conditionEn, temperature: weather.temperature, sunset: weather.sunset }
            : undefined,
        },
      }),
      TIMEOUT_MS,
    );

    if (error || !data?.plan) {
      if (__DEV__) {
        // Dev-only: surface WHY we fell back so we can tell timeout vs Google/AI failure apart.
        // Never shown to users (Constitution: no exposed errors).
        console.warn(
          '[UNPLND] Planner fiel auf Mock zurück:',
          error?.message ?? data?.error?.message ?? 'Edge Function lieferte keinen Plan (kein data.plan)',
        );
      }
      return generatePlan(answers);
    }
    return data.plan;
  } catch (e) {
    if (__DEV__) {
      const msg = (e as Error)?.message;
      console.warn(
        '[UNPLND] Planner fiel auf Mock zurück:',
        msg === 'timeout' ? `Zeitüberschreitung nach ${TIMEOUT_MS / 1000}s` : (msg ?? 'Netzwerk-/Serverfehler'),
      );
    }
    return generatePlan(answers);
  }
}
