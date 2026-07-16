import { i18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { AppLocation } from '@/lib/location';
import { getWeather } from '@/lib/weather';
import type { GeneratedPlan, PlanStop, PlannerAnswers } from './types';

// The real-places pipeline (Google Places → AI curation → photos) needs more room than a
// plain AI call — especially on the Gemini free tier, which can be slow. Past this we fall
// back rather than keep users waiting (18A). 20s was too tight and hit the mock often.
const TIMEOUT_MS = 30000;

interface EdgeResponse {
  plan?: GeneratedPlan;
  /** Swap mode returns a single replacement stop instead of a whole plan. */
  stop?: PlanStop;
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
  | { ok: false; kind: 'no_options' | 'failed' | 'limit' };

/** A replacement stop, or an honest reason we couldn't find one. */
export type SwapResult = { ok: true; stop: PlanStop } | { ok: false; kind: 'no_options' | 'failed' };

/**
 * Replace ONE stop, keeping the rest of the evening. The whole point is that liking 2 of 3 stops
 * shouldn't force you to reroll all three — so we send the venues to keep and get one back.
 * Doesn't count against the daily plan limit (the server treats it as refining, not generating).
 */
export async function swapStop(
  answers: PlannerAnswers,
  location: AppLocation,
  plan: GeneratedPlan,
  index: number,
): Promise<SwapResult> {
  const target = plan.stops[index];
  if (!isSupabaseConfigured || !target) return { ok: false, kind: 'failed' };

  try {
    const nowDate = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const localNow = `${weekdays[nowDate.getDay()]} ${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    const { data } = await withTimeout(
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
          swap: {
            category: target.category,
            time: target.time,
            // Every venue currently in the evening — including the one being replaced.
            keepIds: plan.stops.map((s) => s.placeId).filter((id): id is string => Boolean(id)),
            // What the rest of the evening already costs, so the replacement fits the budget that's
            // LEFT instead of spending it a second time.
            otherPriceLevels: plan.stops
              .filter((_, i) => i !== index)
              .map((s) => s.priceLevel)
              .filter((p): p is string => Boolean(p)),
          },
        },
      }),
      TIMEOUT_MS,
    );

    if (data?.stop) return { ok: true, stop: data.stop };
    if (data?.error?.code === 'NO_OPTIONS') return { ok: false, kind: 'no_options' };
    return { ok: false, kind: 'failed' };
  } catch {
    return { ok: false, kind: 'failed' };
  }
}

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
    // These come back at HTTP 200 so we can tell them apart from a generic failure.
    if (data?.error?.code === 'NO_OPTIONS') return { ok: false, kind: 'no_options' };
    if (data?.error?.code === 'LIMIT_REACHED') return { ok: false, kind: 'limit' };
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
