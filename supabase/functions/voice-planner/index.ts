// UNPLND — voice planner Edge Function (Deno).
//
// The spoken conversation BEFORE a plan exists: the user talks ("wir wollen essen und trinken
// holen, dann schönen spot abseits und chillen mit musik"), the concierge asks for whatever is
// still missing (where/when/budget), one short question per turn — and once it has enough, it
// hands back a compact free-text request the EXISTING generate-plan pipeline turns into a real
// evening. This function never invents venues; it only talks and condenses.
//
// Transcription + conversation both run on Gemini (multimodal: the recording goes in as inline
// audio — no separate speech-to-text service, no extra key). All keys stay server-side (31_SECURITY).

const GEMINI_MODEL = Deno.env.get('UNPLND_GEMINI_MODEL') ?? 'gemini-2.5-flash';

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
  /** What the user actually said (transcribed server-side). */
  transcript: string;
  /** The concierge's next line — shown and spoken by the app. */
  reply: string;
  /** True once everything needed is known; `request` then feeds generate-plan. */
  ready: boolean;
  request?: string;
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
      ? 'Sobald alles da ist (oder der Nutzer loslegen will): setze ready=true und fasse ALLES in request zusammen — ein dichter deutscher Satz mit jedem Detail (z. B. "Essen und Getränke holen, dann ruhiger Spot abseits mit Aussicht, chillen mit Musik im Auto, zu zweit, heute ab 20 Uhr, ca. 3 Stunden, 25 Euro pro Person, mit dem Auto"). In reply kündigst du kurz an, dass du jetzt planst.'
      : 'Once everything is known (or the user wants to start): set ready=true and condense EVERYTHING into request — one dense sentence with every detail. In reply, briefly say you are planning now.',
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) {
    return Response.json({ error: { code: 'NOT_CONFIGURED', message: 'GEMINI_API_KEY missing.' } }, { status: 500, headers: CORS });
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
    return Response.json(
      {
        transcript: typeof parsed.transcript === 'string' ? parsed.transcript : '',
        reply: parsed.reply,
        ready: Boolean(parsed.ready),
        request: typeof parsed.request === 'string' && parsed.request.trim() ? parsed.request : undefined,
      } satisfies VoiceReply,
      { headers: CORS },
    );
  } catch (e) {
    console.error('parse_error', String(e).slice(0, 200));
    return Response.json({ error: { code: 'FAILED', message: 'Generation failed.', retryable: true } }, { headers: CORS });
  }
});
