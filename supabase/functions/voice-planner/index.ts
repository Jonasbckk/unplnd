// UNPLND — voice planner Edge Function (Deno).
//
// The spoken conversation BEFORE a plan exists: the user talks ("wir wollen asiatisch essen, wo
// nicht viel los ist, danach irgendwohin, wo keiner ist"), the concierge asks for whatever is
// still missing (where/when/budget), one short question per turn — and once it has enough, it
// hands back a request string the EXISTING generate-plan pipeline turns into a real evening.
// The request must carry EVERY qualifier the user said; the concierge never invents venues.
//
// Transcription + conversation + the spoken reply all run on Gemini with the ONE existing key:
// the recording goes in as inline audio, and the reply comes back as synthesized speech (PCM,
// wrapped into a WAV here) so the app can play it with expo-audio — no new native module, which
// means the voice works on the CURRENT build. All keys stay server-side (31_SECURITY).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GEMINI_MODEL = Deno.env.get('UNPLND_GEMINI_MODEL') ?? 'gemini-2.5-flash';
const GEMINI_TTS_MODEL = Deno.env.get('UNPLND_GEMINI_TTS_MODEL') ?? 'gemini-2.5-flash-preview-tts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Turn {
  role: 'user' | 'assistant';
  text: string;
}

interface VoiceRequest {
  /** Base64 m4a from expo-audio. Optional — a turn may also be typed. */
  audio?: string;
  /** Typed text instead of audio (fallback, and useful in the simulator). */
  text?: string;
  history?: Turn[];
  language?: 'de' | 'en';
  city?: string;
  /** "Weekday HH:MM" — so "heute abend" means something. */
  now?: string;
}

interface VoiceReply {
  transcript: string;
  reply: string;
  ready: boolean;
  request?: string;
  /** Base64 WAV of the spoken reply — absent when synthesis fails (text still shows). */
  audioB64?: string;
}

/**
 * Second opinion straight from RevenueCat: a purchase is live there SECONDS before our
 * webhook lands in profiles.premium. Needs the REVENUECAT_API_KEY secret (the sk_… secret
 * key); without it this returns false and the profiles flag alone decides.
 */
async function hasActiveEntitlement(userId: string): Promise<boolean> {
  const key = Deno.env.get('REVENUECAT_API_KEY');
  if (!key) return false;
  try {
    const res = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return false;
    const data = await res.json();
    const entitlements = data?.subscriber?.entitlements ?? {};
    const now = Date.now();
    return Object.values(entitlements).some((e) => {
      const expires = (e as { expires_date?: string | null }).expires_date;
      return expires == null || new Date(expires).getTime() > now;
    });
  } catch {
    return false;
  }
}

function systemPrompt(language: 'de' | 'en', city?: string, now?: string): string {
  const german = language !== 'en';
  return [
    german
      ? 'Du bist der UNPLND-Concierge: du planst mit dem Nutzer einen echten Abend, im Gespräch. Locker, warm, Du-Form, wie ein guter Freund mit Geschmack — nie wie ein Formular.'
      : "You are the UNPLND concierge: you plan a real evening with the user, in conversation. Relaxed, warm, like a friend with taste — never like a form.",
    german
      ? 'Deine Antworten werden LAUT VORGELESEN: maximal 2 kurze Sätze, keine Listen, keine Emojis, keine Sonderzeichen.'
      : 'Your replies are READ ALOUD: at most 2 short sentences, no lists, no emojis, no special characters.',
    german
      ? 'Du brauchst am Ende: WAS (Stimmung/Aktivitäten), WER (allein/zu zweit/Gruppe), WANN/WIE LANGE, BUDGET pro Person, TRANSPORT. Frage NUR nach dem, was noch fehlt — eine Frage pro Antwort, die wichtigste zuerst. Was der Nutzer schon gesagt hat, fragst du NIE erneut.'
      : 'You need: WHAT (mood/activities), WHO, WHEN/HOW LONG, BUDGET per person, TRANSPORT. Ask ONLY for what is missing — one question per reply. Never re-ask what the user already said.',
    german
      ? 'Wenn der Nutzer vage bleibt oder "egal" sagt, entscheide selbst sinnvoll und frag nicht nach.'
      : 'If the user is vague or says "whatever", decide sensibly yourself instead of asking again.',
    german
      ? 'Sobald alles da ist (oder der Nutzer loslegen will): setze ready=true und fasse ALLES in request zusammen — ein dichter deutscher Satz. Der request MUSS JEDE Eigenschaft und Einschränkung des Nutzers übernehmen, möglichst wörtlich: "asiatisch essen, wo nicht viel los ist, keine Gaststätte" bleibt GENAU SO drin, "danach irgendwohin, wo keiner ist" wird z. B. zu "danach ein ruhiger, abgelegener Spot ohne Menschen". NIEMALS verallgemeinern ("essen gehen") oder Details weglassen — jede Eigenschaft wird später zu einem passenden Ort. Dazu: wer, wann, wie lange, Budget pro Person, Transport.'
      : 'Once everything is known (or the user wants to start): set ready=true and condense EVERYTHING into request — one dense sentence. The request MUST carry EVERY qualifier and constraint, as literally as possible ("asian food somewhere quiet, not a pub" stays exactly that; "then somewhere with nobody around" becomes "then a quiet secluded spot away from people"). NEVER generalize or drop details — each qualifier becomes a matching venue later. Plus: who, when, how long, budget per person, transport.',
    german
      ? 'In reply kündigst du bei ready=true kurz an, dass du jetzt planst.'
      : 'In reply, when ready=true, briefly say you are planning now.',
    'Erfinde NIE konkrete Orte oder Namen von Locations — das übernimmt die Planung danach. Du sammelst nur, was der Nutzer will.',
    city ? `Der Nutzer ist in ${city}.` : '',
    now ? `Aktuelle lokale Zeit: ${now}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

const REPLY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    transcript: { type: 'STRING', description: "The user's words from the audio, verbatim. Empty if text was provided instead." },
    reply: { type: 'STRING' },
    ready: { type: 'BOOLEAN' },
    request: { type: 'STRING' },
  },
  required: ['transcript', 'reply', 'ready'],
};

// ---------------- speech synthesis ----------------

/** Wrap raw 16-bit mono PCM in a 44-byte WAV header so expo-audio can play it. */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  v.setUint32(16, 16, true); // PCM chunk size
  v.setUint16(20, 1, true); // PCM format
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true); // byte rate (16-bit mono)
  v.setUint16(32, 2, true); // block align
  v.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  v.setUint32(40, pcm.length, true);
  const out = new Uint8Array(44 + pcm.length);
  out.set(new Uint8Array(header), 0);
  out.set(pcm, 44);
  return out;
}

function bytesToB64(bytes: Uint8Array): string {
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/** The reply as spoken audio (base64 WAV). Null on any failure — the text carries the turn alone. */
async function synthesize(text: string, geminiKey: string): Promise<string | null> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_TTS_MODEL}:generateContent?key=${geminiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
      }),
    });
    if (!response.ok) {
      console.error('tts_error', response.status, (await response.text()).slice(0, 200));
      return null;
    }
    const data = await response.json();
    const part = data?.candidates?.[0]?.content?.parts?.[0];
    const b64 = part?.inlineData?.data ?? part?.inline_data?.data;
    if (!b64) return null;
    // Gemini TTS returns raw PCM, 16-bit mono. Default rate is 24 kHz; trust the mime when present.
    const mime: string = part?.inlineData?.mimeType ?? part?.inline_data?.mime_type ?? '';
    const rateMatch = mime.match(/rate=(\d+)/);
    const rate = rateMatch ? Number(rateMatch[1]) : 24000;
    const pcm = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return bytesToB64(pcmToWav(pcm, rate));
  } catch (e) {
    console.error('tts_error', String(e).slice(0, 200));
    return null;
  }
}

// ---------------- handler ----------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    return Response.json({ error: { code: 'NOT_CONFIGURED', message: 'GEMINI_API_KEY missing.' } }, { status: 500, headers: CORS });
  }

  // The concierge is premium (25_MONETIZATION) — enforced HERE, not just in the client screen,
  // so a free user can't reach Gemini by calling the function directly.
  // Identity fails CLOSED: the app always sends the user's session JWT, so "no resolvable
  // user" (e.g. the extractable anon key used as bearer) is an abuse pattern, not a hiccup.
  // Only the profile lookup fails open — a DB blip must never silence a paying user.
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authHeader = req.headers.get('Authorization');
  if (supaUrl && anonKey && serviceKey && authHeader) {
    const asUser = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const userId = await asUser.auth
      .getUser()
      .then(({ data }) => data.user?.id ?? null)
      .catch(() => null);
    if (!userId) {
      return Response.json({ error: { code: 'UNAUTHORIZED', message: 'Sign in required.' } }, { status: 401, headers: CORS });
    }
    try {
      const admin = createClient(supaUrl, serviceKey);
      const { data: profile } = await admin.from('profiles').select('premium, is_founder').eq('id', userId).single();
      if (profile && !profile.premium && !profile.is_founder && !(await hasActiveEntitlement(userId))) {
        return Response.json(
          { error: { code: 'PREMIUM_REQUIRED', message: 'The concierge is part of Premium.' } },
          { status: 403, headers: CORS },
        );
      }
    } catch {
      // fail open — never let a DB hiccup silence a paying user's concierge
    }
  }

  let body: VoiceRequest;
  try {
    body = (await req.json()) as VoiceRequest;
  } catch {
    return Response.json({ error: { code: 'BAD_REQUEST', message: 'Invalid JSON.' } }, { status: 400, headers: CORS });
  }
  if (!body.audio && !body.text?.trim()) {
    return Response.json({ error: { code: 'BAD_REQUEST', message: 'audio or text required.' } }, { status: 400, headers: CORS });
  }

  const language = body.language ?? 'de';

  // Conversation so far + the new turn. History is plain text; only the newest turn is audio.
  const contents: unknown[] = [];
  for (const turn of body.history ?? []) {
    contents.push({ role: turn.role === 'user' ? 'user' : 'model', parts: [{ text: turn.text }] });
  }
  contents.push({
    role: 'user',
    parts: body.audio
      ? [
          { inline_data: { mime_type: 'audio/mp4', data: body.audio } },
          { text: language === 'de' ? '(Antworte auf diese Sprachnachricht.)' : '(Reply to this voice message.)' },
        ]
      : [{ text: body.text as string }],
  });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt(language, body.city, body.now) }] },
      contents,
      generationConfig: {
        response_mime_type: 'application/json',
        response_schema: REPLY_SCHEMA,
        temperature: 0.7,
      },
    }),
  });

  if (response.status === 429) {
    return Response.json({ error: { code: 'RATE_LIMITED', message: 'Try again shortly.', retryable: true } }, { headers: CORS });
  }
  if (!response.ok) {
    console.error('gemini_error', response.status, (await response.text()).slice(0, 300));
    return Response.json({ error: { code: 'FAILED', message: 'Generation failed.', retryable: true } }, { headers: CORS });
  }

  try {
    const data = await response.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(raw) as VoiceReply;
    if (typeof parsed.reply !== 'string' || parsed.reply.length === 0) throw new Error('empty reply');

    // Speak the reply server-side; on failure the text still carries the turn.
    const audioB64 = await synthesize(parsed.reply, geminiKey);

    return Response.json(
      {
        transcript: typeof parsed.transcript === 'string' ? parsed.transcript : '',
        reply: parsed.reply,
        ready: Boolean(parsed.ready),
        request: typeof parsed.request === 'string' && parsed.request.trim() ? parsed.request : undefined,
        audioB64: audioB64 ?? undefined,
      } satisfies VoiceReply,
      { headers: CORS },
    );
  } catch (e) {
    console.error('parse_error', String(e).slice(0, 200));
    return Response.json({ error: { code: 'FAILED', message: 'Generation failed.', retryable: true } }, { headers: CORS });
  }
});
