import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { File, Paths } from 'expo-file-system';

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
  | { ok: true; transcript: string; reply: string; ready: boolean; request?: string; audioB64?: string }
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
  /** Base64 WAV of the spoken reply, synthesized server-side. */
  audioB64?: string;
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
        audioB64: data.audioB64,
      };
    }
    if (data?.error?.code === 'RATE_LIMITED') return { ok: false, kind: 'rate_limited' };
    return { ok: false, kind: 'failed' };
  } catch {
    return { ok: false, kind: 'failed' };
  }
}

// ---- Speaking the reply -------------------------------------------------------------------------
// Primary voice: the server synthesizes the reply (Gemini TTS, same key) and we play the WAV with
// expo-audio — which is ALREADY in the build, so the concierge talks today, no new native module.
// Fallback: expo-speech (device voice) — a native module that only exists from the next build on,
// so it's required defensively like the app icons and the tutorial player.

type SpeechModule = typeof import('expo-speech');
let speech: SpeechModule | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  speech = require('expo-speech') as SpeechModule;
} catch {
  speech = null;
}

export const canSpeak = speech !== null;

let player: AudioPlayer | null = null;

/** Hermes-safe base64 → bytes (atob isn't guaranteed there). */
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = Math.floor((clean.length * 3) / 4);
  const out = new Uint8Array(len);
  let o = 0;
  for (let i = 0; i + 3 < clean.length || (i + 1 < clean.length && o < len); i += 4) {
    const n =
      (B64.indexOf(clean[i]) << 18) |
      (B64.indexOf(clean[i + 1]) << 12) |
      ((B64.indexOf(clean[i + 2]) & 63) << 6) |
      (B64.indexOf(clean[i + 3]) & 63);
    if (o < len) out[o++] = (n >> 16) & 255;
    if (o < len && clean[i + 2] !== undefined) out[o++] = (n >> 8) & 255;
    if (o < len && clean[i + 3] !== undefined) out[o++] = n & 255;
  }
  return out;
}

/**
 * Read the concierge's line aloud: server WAV first (works on the current build), device voice as
 * fallback, silence as the last resort — the text is on screen either way.
 */
export async function speak(text: string, audioB64?: string): Promise<void> {
  stopSpeaking();
  if (audioB64) {
    try {
      // Recording mode mutes playback on iOS — switch back before playing.
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      const file = new File(Paths.cache, 'concierge-reply.wav');
      file.write(base64ToBytes(audioB64));
      player = createAudioPlayer({ uri: file.uri });
      player.play();
      return;
    } catch {
      // fall through to the device voice
    }
  }
  if (!speech) return;
  try {
    speech.stop();
    speech.speak(text, { language: i18n.locale === 'de' ? 'de-DE' : 'en-US', rate: 1.0 });
  } catch {
    // ignore
  }
}

export function stopSpeaking(): void {
  try {
    player?.pause();
    player?.remove();
  } catch {
    // ignore
  }
  player = null;
  try {
    speech?.stop();
  } catch {
    // ignore
  }
}
