import { i18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppLocation } from '@/lib/location';
import { getWeather } from '@/lib/weather';
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
/** A plan, or an honest failure the UI turns into a message — we never show a mock (founder decision). */
export type GenerateResult =
  | { ok: true; plan: GeneratedPlan }
  | { ok: false; kind: 'no_options' | 'failed' };

export async function generateEvening(answers: PlannerAnswers, location: AppLocation): Promise<GenerateResult> {
  if (!isSupabaseConfigured) {
    if (__DEV__) console.warn('[UNPLND] Supabase not configured — cannot generate a plan.');
    return { ok: false, kind: 'failed' };
  }

  try {
    const weather = await getWeather(location.latitude, location.longitude).catch(() => null);
    // The user's real local time, so the plan starts from "now" — not a hardcoded 19:00.
    const nowDate = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const localNow = `${weekdays[nowDate.getDay()]} ${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;
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
          now: localNow,
          weather: weather
            ? { condition: weather.conditionEn, temperature: weather.temperature, sunset: weather.sunset }
            : undefined,
        },
      }),
      TIMEOUT_MS,
    );

    if (data?.plan) return { ok: true, plan: data.plan };
    // NO_OPTIONS comes back at HTTP 200 so we can tell "nothing open" apart from a real failure.
    if (data?.error?.code === 'NO_OPTIONS') return { ok: false, kind: 'no_options' };
    if (__DEV__) {
      console.warn('[UNPLND] Plan fehlgeschlagen:', error?.message ?? data?.error?.code ?? 'unbekannt');
    }
    return { ok: false, kind: 'failed' };
  } catch (e) {
    if (__DEV__) {
      const msg = (e as Error)?.message;
      console.warn(
        '[UNPLND] Plan fehlgeschlagen:',
        msg === 'timeout' ? `Zeitüberschreitung nach ${TIMEOUT_MS / 1000}s` : (msg ?? 'Netzwerk-/Serverfehler'),
      );
    }
    return { ok: false, kind: 'failed' };
  }
}
