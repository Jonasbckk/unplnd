import { File } from 'expo-file-system';

import { i18n } from '@/lib/i18n';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

/**
 * Client side of the voice concierge: ship the recording (or a typed line) plus the conversation
 * so far to the voice-planner Edge Function, get back transcript + reply + (eventually) the
 * condensed request that feeds the normal plan generation. All AI keys stay server-side.
 */

export interface VoiceTurn {
  role: 'user' | 'assistant';
  text: string;
}

export type VoiceStepResult =
  | { ok: true; transcript: string; reply: string; ready: boolean; request?: string }
  | { ok: false; kind: 'failed' | 'rate_limited' };

const TIMEOUT_MS = 30000;

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

interface VoiceEdgeResponse {
  transcript?: string;
  reply?: string;
  ready?: boolean;
  request?: string;
  error?: { code: string };
}

export async function voiceStep(input: {
  /** Local file URI of the m4a recording — mutually exclusive with `text`. */
  audioUri?: string;
  text?: string;
  history: VoiceTurn[];
  city?: string;
}): Promise<VoiceStepResult> {
  if (!isSupabaseConfigured) return { ok: false, kind: 'failed' };

  try {
    let audio: string | undefined;
    if (input.audioUri) {
      audio = await new File(input.audioUri).base64();
    }

    const nowDate = new Date();
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const localNow = `${weekdays[nowDate.getDay()]} ${String(nowDate.getHours()).padStart(2, '0')}:${String(nowDate.getMinutes()).padStart(2, '0')}`;

    const { data } = await withTimeout(
      supabase.functions.invoke<VoiceEdgeResponse>('voice-planner', {
        body: {
          audio,
          text: input.text,
          history: input.history,
          language: i18n.locale,
          city: input.city,
          now: localNow,
        },
      }),
      TIMEOUT_MS,
    );

    if (data?.reply) {
      return {
        ok: true,
        transcript: data.transcript ?? '',
        reply: data.reply,
        ready: Boolean(data.ready),
        request: data.request,
      };
    }
    if (data?.error?.code === 'RATE_LIMITED') return { ok: false, kind: 'rate_limited' };
    return { ok: false, kind: 'failed' };
  } catch {
    return { ok: false, kind: 'failed' };
  }
}

// ---- Speaking the reply -------------------------------------------------------------------------
// expo-speech is a native module: on a build that predates it, a top-level import would crash at
// module load (same story as the app icons and the tutorial player). Require defensively — until
// the next native build the concierge simply stays silent and the conversation runs as text.

type SpeechModule = typeof import('expo-speech');
let speech: SpeechModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  speech = require('expo-speech') as SpeechModule;
} catch {
  speech = null;
}

export const canSpeak = speech !== null;

/** Read the concierge's line aloud with the device voice. No-op when the module isn't in the build. */
export function speak(text: string): void {
  if (!speech) return;
  try {
    speech.stop();
    speech.speak(text, { language: i18n.locale === 'de' ? 'de-DE' : 'en-US', rate: 1.0 });
  } catch {
    // Silence is an acceptable failure mode — the text is on screen either way.
  }
}

export function stopSpeaking(): void {
  try {
    speech?.stop();
  } catch {
    // ignore
  }
}
