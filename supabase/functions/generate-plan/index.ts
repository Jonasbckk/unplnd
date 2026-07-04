// UNPLND — plan generation Edge Function (Deno).
// Two-phase engine (14_TECH_STACK + 19_ROUTE):
//   Phase A: Google Places (New) finds REAL, well-rated venues near the user, per mood.
//   Phase B: the AI (Claude or Gemini) curates them into a story-arc evening.
// All keys live server-side only (31_SECURITY). We NEVER return a mock/generic plan: if no real
// plan can be built we return an honest NO_OPTIONS / failure the app turns into a message.
// Free users get UNPLND_DAILY_PLAN_LIMIT plans/day (premium is unlimited), enforced here.
// Secrets: GOOGLE_MAPS_API_KEY (+ ANTHROPIC_API_KEY or GEMINI_API_KEY). SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY are injected automatically.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface PlanRequest {
  mood?: string;
  group?: string;
  budget?: string;
  transport?: string;
  time?: string;
  preferences?: string[];
  /** Free-text request — when set, the AI first works out what to search for, then curates. */
  request?: string;
  city?: string;
  language?: 'de' | 'en';
  /** User's current LOCAL time as "Weekday HH:MM" (e.g. "Saturday 01:40"). Anchors the schedule to now. */
  now?: string;
  latitude?: number;
  longitude?: number;
  weather?: { condition: string; temperature: number; sunset?: string };
}

// One search: either Google place types (Nearby) or a free-text query (Text Search).
interface SearchGroup {
  category: string;
  types?: string[];
  textQuery?: string;
}

interface StopOut {
  time: string;
  category: string;
  title: string;
  reason: string;
  memoryMoment?: boolean;
  placeId?: string;
  rating?: number;
  ratingCount?: number;
  priceLevel?: string; // "€" … "€€€€"
  openNow?: boolean;
  hours?: string;
  address?: string;
  lat?: number;
  lng?: number;
  photoUrl?: string;
  /** Unresolved Google photo names for on-demand gallery resolution (resolve-photos fn). */
  photoNames?: string[];
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANTHROPIC_MODEL = Deno.env.get('UNPLND_AI_MODEL') ?? 'claude-sonnet-5';
const GEMINI_MODEL = Deno.env.get('UNPLND_GEMINI_MODEL') ?? 'gemini-2.5-flash';
// Free-tier daily plan cap (premium is unlimited). Overridable via env without a code change.
const DAILY_FREE_LIMIT = Number(Deno.env.get('UNPLND_DAILY_PLAN_LIMIT') ?? '5');
const PLACES_BASE = 'https://places.googleapis.com/v1';

// ---------------- Google Places (Phase A) ----------------

interface Candidate {
  id: string;
  name: string;
  category: string; // internal search-group label (NOT sent to the AI — Google's real type is)
  typeName?: string; // Google's human-readable type, e.g. "Hookah Lounge", "Night Club"
  types?: string[];
  rating: number;
  ratingCount: number;
  priceLevel: string;
  openNow?: boolean;
  hours?: string;
  address?: string;
  lat: number;
  lng: number;
  photoNames?: string[];
  summary?: string;
  distanceM: number;
}

// Mood → the kinds of stops that make up that evening. The AI picks & sequences from the pool.
const SEARCH_PLANS: Record<string, SearchGroup[]> = {
  Party: [
    { category: 'Dinner', types: ['restaurant'] },
    { category: 'Bar', types: ['bar', 'pub'] },
    { category: 'Club', types: ['night_club'] },
    { category: 'Shop', types: ['supermarket', 'convenience_store'] },
  ],
  Drinks: [
    { category: 'Bar', types: ['bar', 'pub'] },
    { category: 'Wine Bar', types: ['wine_bar', 'bar'] },
    { category: 'Dessert', types: ['dessert_shop', 'ice_cream_shop', 'cafe'] },
  ],
  Food: [
    { category: 'Dinner', types: ['restaurant'] },
    { category: 'Dessert', types: ['dessert_shop', 'bakery', 'cafe'] },
    { category: 'Walk', types: ['park', 'tourist_attraction'] },
  ],
  Romantic: [
    { category: 'Dinner', types: ['fine_dining_restaurant', 'restaurant'] },
    { category: 'Memory', types: ['tourist_attraction', 'park'] },
    { category: 'Drinks', types: ['wine_bar', 'bar'] },
  ],
  Nature: [
    { category: 'Walk', types: ['park', 'hiking_area', 'tourist_attraction'] },
    { category: 'Memory', types: ['tourist_attraction'] },
    { category: 'Café', types: ['cafe', 'coffee_shop'] },
  ],
  Culture: [
    { category: 'Culture', types: ['museum', 'art_gallery'] },
    { category: 'Dinner', types: ['restaurant'] },
    { category: 'Show', types: ['movie_theater', 'performing_arts_theater'] },
  ],
  Relaxed: [
    { category: 'Café', types: ['cafe', 'coffee_shop'] },
    { category: 'Dinner', types: ['restaurant'] },
    { category: 'Walk', types: ['park', 'tourist_attraction'] },
  ],
  Activities: [
    { category: 'Activity', types: ['tourist_attraction', 'bowling_alley', 'amusement_center'] },
    { category: 'Dinner', types: ['restaurant'] },
    { category: 'Drinks', types: ['bar', 'pub'] },
  ],
};

const DEFAULT_PLAN: SearchGroup[] = [
  { category: 'Dinner', types: ['restaurant'] },
  { category: 'Drinks', types: ['bar', 'pub'] },
  { category: 'Memory', types: ['tourist_attraction', 'park'] },
];

function searchPlanFor(mood?: string): SearchGroup[] {
  return (mood && SEARCH_PLANS[mood]) || DEFAULT_PLAN;
}

// How far to SEARCH for options around the user.
function radiusFor(transport?: string): number {
  switch (transport) {
    case 'Walking':
      return 1500;
    case 'Bike':
      return 3500;
    case 'Public Transport':
      return 5000;
    case 'Car':
      return 8000;
    case 'Uber / Taxi':
      return 6500;
    default:
      return 3500;
  }
}

// How spread out the whole evening may be — keeps every stop in one area (no 13km detours).
function clusterRadiusFor(transport?: string): number {
  switch (transport) {
    case 'Walking':
      return 1800;
    case 'Bike':
      return 3500;
    case 'Public Transport':
      return 4500;
    case 'Car':
      return 6000;
    case 'Uber / Taxi':
      return 5000;
    default:
      return 3000;
  }
}

// Never belongs in a curated evening — fast-food primary types (excluded at the Places query).
const JUNK_TYPES = ['fast_food_restaurant', 'meal_takeaway', 'meal_delivery'];
// …and chains/takeaways that slip through typed as plain "restaurant" (filtered by name).
const CHAIN_BLOCKLIST =
  /\b(kfc|kentucky fried|mcdonald|burger king|subway|domino|pizza hut|call a pizza|starbucks|dunkin|five guys|popeyes|nordsee|fried chicken|chicken king)\b/i;

const PRICE_MAP: Record<string, string> = {
  PRICE_LEVEL_FREE: '€0',
  PRICE_LEVEL_INEXPENSIVE: '€',
  PRICE_LEVEL_MODERATE: '€€',
  PRICE_LEVEL_EXPENSIVE: '€€€',
  PRICE_LEVEL_VERY_EXPENSIVE: '€€€€',
};

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

async function searchNearby(
  types: string[],
  lat: number,
  lng: number,
  radius: number,
  key: string,
  language: string,
): Promise<any[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.currentOpeningHours,places.location,places.priceLevel,places.photos,places.editorialSummary,places.formattedAddress,places.types',
    },
    body: JSON.stringify({
      includedTypes: types,
      excludedPrimaryTypes: JUNK_TYPES,
      maxResultCount: 15,
      rankPreference: 'POPULARITY',
      languageCode: language,
      regionCode: 'DE',
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    }),
  });
  if (!res.ok) {
    console.error('places_error', res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const json = await res.json();
  return json?.places ?? [];
}

/** Google Places Text Search — for specific free-text wishes ("all you can eat buffet", "rooftop bar"). */
async function searchText(
  textQuery: string,
  lat: number,
  lng: number,
  radius: number,
  key: string,
  language: string,
): Promise<any[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryType,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.currentOpeningHours,places.location,places.priceLevel,places.photos,places.editorialSummary,places.formattedAddress,places.types',
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: 15,
      languageCode: language,
      regionCode: 'DE',
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    }),
  });
  if (!res.ok) {
    console.error('places_text_error', res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const json = await res.json();
  return json?.places ?? [];
}

/** Runs each search group (by place-type or free-text query), pools the best real venues near the user. */
async function findCandidates(req: PlanRequest, key: string, plan: SearchGroup[]): Promise<Candidate[]> {
  const lat = req.latitude!;
  const lng = req.longitude!;
  const radius = radiusFor(req.transport);
  const language = req.language ?? 'de';

  const groups = await Promise.all(
    plan.map((g) => {
      const places = g.textQuery
        ? searchText(g.textQuery, lat, lng, radius, key, language)
        : searchNearby(g.types ?? [], lat, lng, radius, key, language);
      return places.then((p) => ({ category: g.category, places: p }));
    }),
  );

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  for (const group of groups) {
    const mapped: Candidate[] = group.places
      .filter(
        (p: any) =>
          p?.id &&
          p?.location &&
          (p.rating ?? 0) >= 3.9 &&
          (p.userRatingCount ?? 0) >= 15 &&
          !CHAIN_BLOCKLIST.test(p.displayName?.text ?? ''),
      )
      .map((p: any) => {
        const today = p.currentOpeningHours?.weekdayDescriptions?.[(new Date().getUTCDay() + 6) % 7];
        return {
          id: p.id,
          name: p.displayName?.text ?? 'Unbekannt',
          category: group.category,
          typeName: p.primaryTypeDisplayName?.text,
          types: Array.isArray(p.types) ? p.types.slice(0, 4) : undefined,
          rating: p.rating ?? 0,
          ratingCount: p.userRatingCount ?? 0,
          priceLevel: PRICE_MAP[p.priceLevel] ?? '',
          openNow: p.currentOpeningHours?.openNow,
          hours: typeof today === 'string' ? today.replace(/^[A-Za-zäöü]+:\s*/, '') : undefined,
          address: p.formattedAddress,
          lat: p.location.latitude,
          lng: p.location.longitude,
          photoNames: Array.isArray(p.photos)
            ? p.photos.slice(0, 8).map((ph: any) => ph.name).filter(Boolean)
            : undefined,
          summary: p.editorialSummary?.text,
          distanceM: Math.round(haversine(lat, lng, p.location.latitude, p.location.longitude)),
        } as Candidate;
      });
    // Keep the top few per category by a rating × popularity score.
    mapped.sort((a, b) => b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10));
    for (const c of mapped.slice(0, 7)) {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        candidates.push(c);
      }
    }
  }
  // Keep the whole evening in one area — anchor on the strongest venue, drop far outliers
  // (fixes "Kloster Arnsburg 13km away sitting next to an in-town stop").
  const clustered = clusterCandidates(candidates, req.transport);

  // Shuffle so the AI sees a fresh order every call — plans stay varied (founder: "immer unterschiedlich").
  for (let i = clustered.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [clustered[i], clustered[j]] = [clustered[j], clustered[i]];
  }
  return clustered;
}

function clusterCandidates(candidates: Candidate[], transport?: string): Candidate[] {
  if (candidates.length <= 3) return candidates;
  const clusterR = clusterRadiusFor(transport);
  const ranked = [...candidates].sort(
    (a, b) => b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10),
  );
  const anchor = ranked.find((c) => c.category !== 'Shop') ?? ranked[0];
  const near = candidates.filter((c) => haversine(anchor.lat, anchor.lng, c.lat, c.lng) <= clusterR);
  const categories = new Set(near.map((c) => c.category));
  // Only tighten if we still have enough variety to build a full evening.
  return near.length >= 3 && categories.size >= 2 ? near : candidates;
}

/** Resolves one displayable photo URL per place (keyless googleusercontent link). */
async function resolvePhoto(photoName: string, key: string, maxPx = 600): Promise<string | undefined> {
  try {
    const res = await fetch(
      `${PLACES_BASE}/${photoName}/media?maxHeightPx=${maxPx}&maxWidthPx=${maxPx}&skipHttpRedirect=true`,
      { headers: { 'X-Goog-Api-Key': key } },
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.photoUri as string | undefined;
  } catch {
    return undefined;
  }
}

// ---------------- Prompts ----------------

function baseRules(language: 'de' | 'en'): string[] {
  const lang =
    language === 'de'
      ? '- Write ALL user-facing text (title, summary, reasons) in natural, punchy GERMAN using the informal "du".'
      : '- Write all user-facing text in English.';
  return [
    'You are the planning engine behind UNPLND, a premium app that plans unforgettable evenings.',
    'You write like a sharp, funny local friend who actually knows the city — never like an assistant or a travel brochure.',
    lang,
    '- Build a realistic evening of 3 to 5 stops that tells a story: comfort → exploration → peak moment → warm ending.',
    '- Exactly ONE stop is the memorable highlight — mark it memory_moment=true.',
    '- Respect the budget strictly (target 80–95%, never exceed). Respect available time and transport (keep legs realistic).',
    '- Adapt to the weather: rain → indoor-first; a clear evening → make the most of the golden hour.',
    '- VOICE: witty, a little cheeky and provocative, Gen-Z energy — but sharp, tasteful and professional; never cringe, try-hard, or vulgar. Roast the boring option, hype the great one.',
    '- Each stop\'s "reason" is ONE punchy line that sells the spot with real personality and a concrete detail — not a numb description. The title and summary carry the same voice: a headline that makes you grin.',
    '- BANNED clichés — never use these or anything like them: "das Tanzbein schwingen", "genieße den Sonnenuntergang", "die Seele baumeln lassen", "unvergesslicher Abend", "wir tanzen bis in die Nacht", "dance the night away", "enjoy the sunset before…", "unforgettable evening". Be specific and bold instead.',
    '- Never mention AI, algorithms, or ratings-as-numbers inside the reason.',
  ];
}

function curationSystemPrompt(language: 'de' | 'en'): string {
  return [
    ...baseRules(language),
    '- You are given a list of REAL nearby venues (id, name, type, rating, price, hours, distance).',
    "- EVERY stop MUST use a place_id copied EXACTLY from the list, and its title MUST be that venue's exact name. Never output an empty, partial, or made-up place_id, and never add a venue from your own knowledge.",
    '- If you cannot back a stop with a venue from the list, leave it out — 3 real stops beat 4 with a guess.',
    '- Describe and categorize each venue by what it ACTUALLY is, using its "type" and name — never claim it is something it is not (e.g. a hookah/shisha lounge is NOT a dance club; do not write about dancing there). Set each stop\'s category from its real type.',
    '- Use each venue AT MOST ONCE — never repeat a place in the same evening.',
    '- Skip generic fast-food chains and takeaways — a fried-chicken counter is not an evening destination; prefer places with character. A supermarket works ONLY as a quick pre-party drinks run, never as a real stop.',
    '- The arc should feel like a real night out: a proper sit-down dinner or nice drinks early, the highlight in the middle/peak, a relaxed close — not junk food dropped in the middle.',
    '- OPENING HOURS ARE A HARD CONSTRAINT: each venue has "hours_today" (open–close today) and "open_now" (true = open at the CURRENT time, Google-accurate). Only schedule a stop when the venue is actually open at that stop\'s time. If the plan starts around NOW (evening/night), every venue MUST be open_now=true. NEVER schedule a venue that is closed at the stop\'s time — e.g. at 03:00 a restaurant with hours 11:00–22:00 is CLOSED; drop it. If fewer than 3 venues are genuinely open, return no_options instead of scheduling closed ones.',
    "- START TIME — anchor the plan to the user's current local time (given below): if it is still daytime (before ~17:00), plan for THIS EVENING and start around 18:00–19:00; if it is already evening or night (17:00 onward, incl. after midnight), the user wants to head out soon — start the first stop within ~30–45 min of NOW. NEVER place a stop in the past. If it is very late and little is open, make a shorter, honest plan with only what is genuinely open at that hour.",
    '- Sequence for a tight route: keep consecutive stops close together (use the distances), and order them so the arc makes geographic and opening-hours sense — no long detours back and forth.',
    '- Be clever and money-smart when it fits the mood: e.g. for a budget party, a quick stop at a supermarket to grab drinks before the club is a great move.',
    '- VARIETY: make each plan fresh. Do not just pick the single highest-rated options — curate a characterful, non-obvious mix, and choose differently each time you are asked.',
    '- Before finalizing, RE-READ the plan and verify: no venue repeats, no fast-food chains, every description matches the venue\'s real type, the stops flow geographically and by opening hours, and there are zero clichés. Fix anything that fails.',
    '- NO FILLER: if — after honestly checking the current time and every venue\'s hours_today — you cannot assemble at least 3 stops that are genuinely OPEN and make sense together, do NOT invent or force anything. Instead return {"no_options": true} with an empty "stops" array. But check for real first: depending on the area, late-night bars, clubs and eateries may well be open — if enough are, build the plan as normal.',
  ].join('\n');
}

function curationUserPrompt(req: PlanRequest, candidates: Candidate[]): string {
  const compact = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.typeName ?? c.types?.[0] ?? c.category, // Google's real classification
    rating: c.rating,
    reviews: c.ratingCount,
    price: c.priceLevel || '?',
    hours_today: c.hours ?? 'unknown', // today's open–close — a HARD constraint on stop times
    open_now: c.openNow, // true = open at the CURRENT time (Google-accurate)
    distance_m: c.distanceM,
    about: c.summary ?? undefined,
  }));
  const parts: string[] = [];
  if (req.request) {
    parts.push(`The user asked, in their own words: "${req.request}" — honor this request above everything else.`);
  }
  parts.push(`Current local time: ${req.now ?? 'unknown'} — schedule from here; never put a stop in the past.`);
  parts.push(`City: ${req.city ?? ''}`);
  if (req.mood) parts.push(`Mood: ${req.mood}`);
  parts.push(`Group: ${req.group ?? '2'}`);
  parts.push(`Budget: ${req.budget ?? '€50'}`);
  parts.push(`Transport: ${req.transport ?? 'Walking'}`);
  parts.push(`Available time: ${req.time ?? 'Whole evening'}`);
  if (req.preferences?.length) parts.push(`Preferences: ${req.preferences.join(', ')}`);
  if (req.weather) {
    parts.push(
      `Weather: ${req.weather.condition}, ${req.weather.temperature}°C${req.weather.sunset ? `, sunset ${req.weather.sunset}` : ''}`,
    );
  }
  parts.push('');
  parts.push('Real nearby venues to choose from (JSON):');
  parts.push(JSON.stringify(compact));
  parts.push('');
  parts.push('Plan this evening now using these venues.');
  return parts.join('\n');
}

// ---------------- AI callers ----------------

interface RawStop {
  place_id?: string;
  time: string;
  category: string;
  title: string;
  reason: string;
  memory_moment?: boolean;
}
interface RawPlan {
  title: string;
  summary: string;
  estimated_cost: string;
  duration: string;
  stops: RawStop[];
  /** The AI sets this when nothing suitable is open at the requested time — then stops is empty. */
  no_options?: boolean;
}

function planTool(withPlaceId: boolean) {
  const stopProps: Record<string, unknown> = {
    time: { type: 'string', description: 'HH:MM' },
    category: { type: 'string' },
    title: { type: 'string' },
    reason: { type: 'string' },
    memory_moment: { type: 'boolean' },
  };
  const required = ['time', 'category', 'title', 'reason'];
  if (withPlaceId) {
    stopProps.place_id = { type: 'string', description: 'The exact id of the chosen venue from the list.' };
    required.unshift('place_id');
  }
  return {
    name: 'evening_plan',
    description: 'Return the finished evening plan.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        summary: { type: 'string' },
        estimated_cost: { type: 'string' },
        duration: { type: 'string' },
        no_options: { type: 'boolean', description: 'True if nothing suitable is open now — then stops is empty.' },
        stops: {
          type: 'array',
          minItems: 0,
          maxItems: 5,
          items: { type: 'object', properties: stopProps, required },
        },
      },
      required: ['title', 'summary', 'estimated_cost', 'duration', 'stops'],
    },
  };
}

/** Thrown when an AI provider returns 429 (rate limit). Callers fail fast instead of retrying,
 * which would only burn more free-tier quota against the same cap and deepen the outage. */
class RateLimitError extends Error {
  constructor(provider: string) {
    super(`${provider}_rate_limited`);
    this.name = 'RateLimitError';
  }
}

async function callAnthropic(system: string, user: string, tool: object, apiKey: string): Promise<RawPlan | null> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: user }],
      tools: [tool],
      tool_choice: { type: 'tool', name: (tool as { name: string }).name },
    }),
  });
  if (!res.ok) {
    console.error('anthropic_error', res.status, (await res.text()).slice(0, 300));
    if (res.status === 429) throw new RateLimitError('anthropic');
    return null;
  }
  const json = await res.json();
  const toolUse = json?.content?.find((c: { type: string }) => c.type === 'tool_use');
  return (toolUse?.input as RawPlan) ?? null;
}

function geminiSchema(withPlaceId: boolean) {
  const props: Record<string, unknown> = {
    time: { type: 'STRING' },
    category: { type: 'STRING' },
    title: { type: 'STRING' },
    reason: { type: 'STRING' },
    memory_moment: { type: 'BOOLEAN' },
  };
  const required = ['time', 'category', 'title', 'reason'];
  if (withPlaceId) {
    props.place_id = { type: 'STRING' };
    required.unshift('place_id');
  }
  return {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      summary: { type: 'STRING' },
      estimated_cost: { type: 'STRING' },
      duration: { type: 'STRING' },
      no_options: { type: 'BOOLEAN' },
      stops: { type: 'ARRAY', items: { type: 'OBJECT', properties: props, required } },
    },
    required: ['title', 'summary', 'estimated_cost', 'duration', 'stops'],
  };
}

async function callGemini(system: string, user: string, schema: object, apiKey: string): Promise<RawPlan | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        maxOutputTokens: 4096,
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });
  if (!res.ok) {
    console.error('gemini_error', res.status, (await res.text()).slice(0, 500));
    if (res.status === 429) throw new RateLimitError('gemini');
    return null;
  }
  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p: { text?: string }) => p.text ?? '').join('') : undefined;
  if (!text) return null;
  try {
    return JSON.parse(text) as RawPlan;
  } catch {
    return null;
  }
}

function validate(plan: RawPlan | null): plan is RawPlan {
  if (!plan?.title || !plan.summary || !Array.isArray(plan.stops)) return false;
  if (plan.stops.length < 3 || plan.stops.length > 5) return false;
  return plan.stops.every((s) => s.time && s.title && s.reason && s.category);
}

// ---------------- Free-text intent extraction ----------------

interface IntentSearch {
  category: string;
  types?: string[];
  text_query?: string;
}
interface Intent {
  searches?: IntentSearch[];
  group?: string;
  budget?: string;
  transport?: string;
  time?: string;
}

function extractSystemPrompt(city?: string): string {
  return [
    `You turn a user's free-text request into a search plan for a maps-based evening planner${city ? ` in ${city}` : ''}.`,
    'Return 2–4 searches, in the order the evening should flow. For each search give EITHER "types" (Google Place types) OR a "text_query" for specific wishes.',
    'Common place types: cafe, coffee_shop, restaurant, bar, pub, wine_bar, night_club, bakery, dessert_shop, ice_cream_shop, park, tourist_attraction, museum, art_gallery, movie_theater, bowling_alley, amusement_center, supermarket.',
    'Use text_query for specific things that are not a clean type — e.g. "all you can eat buffet", "rooftop bar", "escape room", "sushi", "vegan brunch".',
    'If the user names specific kinds of stops or an order (e.g. cafés first, then all-you-can-eat), make ONE search per stop, in that order.',
    'If the user is vague (e.g. "we are bored, two of us"), infer a fun, varied evening: an activity, food, and drinks.',
    'Fill group, budget, transport, time ONLY if the user clearly stated them; otherwise leave them empty.',
  ].join('\n');
}

function extractUserPrompt(req: PlanRequest): string {
  const parts = [`User request: "${req.request ?? ''}"`];
  if (req.city) parts.push(`City: ${req.city}`);
  parts.push('Return the search plan now.');
  return parts.join('\n');
}

const EXTRACT_TOOL = {
  name: 'search_plan',
  description: 'Turn the user request into a venue search plan.',
  input_schema: {
    type: 'object',
    properties: {
      searches: {
        type: 'array',
        minItems: 2,
        maxItems: 4,
        items: {
          type: 'object',
          properties: {
            category: { type: 'string', description: 'Short label, e.g. "Café", "Dinner", "Bar", "Activity".' },
            types: { type: 'array', items: { type: 'string' } },
            text_query: { type: 'string' },
          },
          required: ['category'],
        },
      },
      group: { type: 'string' },
      budget: { type: 'string' },
      transport: { type: 'string' },
      time: { type: 'string' },
    },
    required: ['searches'],
  },
};

const EXTRACT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    searches: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          category: { type: 'STRING' },
          types: { type: 'ARRAY', items: { type: 'STRING' } },
          text_query: { type: 'STRING' },
        },
        required: ['category'],
      },
    },
    group: { type: 'STRING' },
    budget: { type: 'STRING' },
    transport: { type: 'STRING' },
    time: { type: 'STRING' },
  },
  required: ['searches'],
};

async function extractIntent(req: PlanRequest, anthropicKey?: string, geminiKey?: string): Promise<Intent | null> {
  const sys = extractSystemPrompt(req.city);
  const usr = extractUserPrompt(req);
  const raw = anthropicKey
    ? await callAnthropic(sys, usr, EXTRACT_TOOL, anthropicKey)
    : geminiKey
      ? await callGemini(sys, usr, EXTRACT_SCHEMA, geminiKey)
      : null;
  return (raw as unknown as Intent) ?? null;
}

function toSearchGroups(intent: Intent): SearchGroup[] {
  return (intent.searches ?? [])
    .filter((s) => s && s.category && ((s.types && s.types.length > 0) || s.text_query))
    .map((s) => ({ category: s.category, types: s.types, textQuery: s.text_query }));
}

// ---------------- Handler ----------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');

  // Request-scoped so a reused isolate can never leak this between invocations.
  let rateLimited = false;
  const rateLimitedResponse = () =>
    Response.json(
      {
        error: {
          code: 'RATE_LIMITED',
          message: 'The planner is very popular right now. Give it a moment and try again.',
          retryable: true,
        },
      },
      { status: 429, headers: CORS },
    );
  // Honest outcome, not a crash — returned at HTTP 200 so the client can read the code and show
  // "nothing suitable is open right now" instead of a generic error. We never return a mock plan.
  const noOptionsResponse = () =>
    Response.json(
      { error: { code: 'NO_OPTIONS', message: 'Nothing suitable is open right now.', retryable: false } },
      { headers: CORS },
    );
  const generationFailedResponse = () =>
    Response.json(
      { error: { code: 'PLAN_GENERATION_FAILED', message: 'We couldn’t craft this one. Try again?', retryable: true } },
      { status: 502, headers: CORS },
    );
  const limitReachedResponse = () =>
    Response.json(
      { error: { code: 'LIMIT_REACHED', message: 'Daily free plan limit reached.', retryable: false, limit: DAILY_FREE_LIMIT } },
      { headers: CORS },
    );
  const runAI = (system: string, user: string, withPlaceId: boolean): Promise<RawPlan | null> => {
    const call = anthropicKey
      ? callAnthropic(system, user, planTool(withPlaceId), anthropicKey)
      : geminiKey
        ? callGemini(system, user, geminiSchema(withPlaceId), geminiKey)
        : Promise.resolve<RawPlan | null>(null);
    // On a rate limit, fail fast — retrying only burns more free-tier quota against the same cap.
    return call.catch((e) => {
      if (e instanceof RateLimitError) {
        rateLimited = true;
        return null;
      }
      throw e;
    });
  };

  if (!anthropicKey && !geminiKey) {
    return Response.json(
      { error: { code: 'SERVER_ERROR', message: 'Something went wrong. Let’s try that again.', retryable: true } },
      { status: 500, headers: CORS },
    );
  }

  let body: PlanRequest;
  try {
    body = (await req.json()) as PlanRequest;
  } catch {
    return Response.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Something went wrong.', retryable: true } },
      { status: 400, headers: CORS },
    );
  }
  const language = body.language ?? 'de';

  // ---- Daily free-plan limit: DAILY_FREE_LIMIT/day per user (premium is unlimited). Enforced
  //      via the service role so it can't be faked from the client. Fails OPEN on any hiccup. ----
  const supaUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;
  let admin: ReturnType<typeof createClient> | null = null;
  if (supaUrl && serviceKey && anonKey && authHeader) {
    try {
      const asUser = createClient(supaUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
      const { data: u } = await asUser.auth.getUser();
      userId = u.user?.id ?? null;
      admin = createClient(supaUrl, serviceKey);
      if (userId) {
        const { data: profile } = await admin.from('profiles').select('premium').eq('id', userId).single();
        if (!profile?.premium) {
          const startOfDay = new Date();
          startOfDay.setUTCHours(0, 0, 0, 0);
          const { count } = await admin
            .from('plan_generations')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', startOfDay.toISOString());
          if ((count ?? 0) >= DAILY_FREE_LIMIT) return limitReachedResponse();
        }
      }
    } catch (e) {
      console.error('limit_check_error', String(e).slice(0, 200));
    }
  }

  // ---- Phase A + B: real places, when we have Google + a location ----
  const canSearchReal = Boolean(googleKey) && typeof body.latitude === 'number' && typeof body.longitude === 'number';
  let candidates: Candidate[] = [];
  if (canSearchReal) {
    try {
      if (body.request && body.request.trim()) {
        // Free-text path: the AI works out WHAT to search for, then we search it.
        const intent = await extractIntent(body, anthropicKey, geminiKey);
        const groups = intent ? toSearchGroups(intent) : [];
        if (groups.length >= 2) {
          // Adopt any constraints the user stated in their own words (don't override explicit ones).
          body.group = body.group ?? intent?.group;
          body.budget = body.budget ?? intent?.budget;
          body.transport = body.transport ?? intent?.transport;
          body.time = body.time ?? intent?.time;
          candidates = await findCandidates(body, googleKey, groups);
        }
      } else {
        candidates = await findCandidates(body, googleKey, searchPlanFor(body.mood));
      }
    } catch (e) {
      if (e instanceof RateLimitError) rateLimited = true;
      else console.error('candidates_error', String(e).slice(0, 200));
    }
  }

  if (rateLimited) return rateLimitedResponse();

  if (candidates.length >= 3) {
    const byId = new Map(candidates.map((c) => [c.id, c]));
    let plan = await runAI(curationSystemPrompt(language), curationUserPrompt(body, candidates), true);
    if (!validate(plan) && !rateLimited) {
      plan = await runAI(curationSystemPrompt(language), curationUserPrompt(body, candidates), true);
    }
    if (rateLimited) return rateLimitedResponse();
    if (plan?.no_options) return noOptionsResponse();
    if (validate(plan)) {
      const usedIds = new Set<string>();
      const stops: StopOut[] = [];
      for (const s of plan.stops) {
        const c = s.place_id ? byId.get(s.place_id) : undefined;
        // Never repeat the same venue in one evening.
        if (c && usedIds.has(c.id)) continue;
        if (c) usedIds.add(c.id);
        stops.push({
          time: s.time,
          category: s.category,
          title: c?.name ?? s.title,
          reason: s.reason,
          memoryMoment: Boolean(s.memory_moment),
          placeId: c?.id,
          rating: c?.rating,
          ratingCount: c?.ratingCount,
          priceLevel: c?.priceLevel || undefined,
          openNow: c?.openNow,
          hours: c?.hours,
          address: c?.address,
          lat: c?.lat,
          lng: c?.lng,
        });
      }
      if (!stops.some((s) => s.memoryMoment) && stops.length > 1) stops[stops.length - 2].memoryMoment = true;

      // Resolve photos for the chosen venues in parallel (best effort).
      await Promise.all(
        stops.map(async (s) => {
          const c = s.placeId ? byId.get(s.placeId) : undefined;
          // Resolve only the MAIN photo now (shown on the card); the rest resolve on demand when
          // the user opens the gallery (resolve-photos fn) — so we only pay for photos people view.
          if (c?.photoNames?.length) {
            s.photoUrl = await resolvePhoto(c.photoNames[0], googleKey!, 800);
            s.photoNames = c.photoNames;
          }
        }),
      );

      // Count this successful generation against the user's daily limit (best effort).
      if (admin && userId) {
        try {
          await admin.from('plan_generations').insert({ user_id: userId });
        } catch (e) {
          console.error('record_generation_error', String(e).slice(0, 200));
        }
      }

      const score = Math.min(97, 82 + (stops.some((s) => s.memoryMoment) ? 6 : 0) + stops.length * 2);
      return Response.json(
        {
          plan: {
            title: plan.title,
            summary: plan.summary,
            stops,
            estimatedCost: plan.estimated_cost,
            duration: plan.duration,
            score,
          },
        },
        { headers: CORS },
      );
    }
  }

  // No real plan could be built. Be honest — we NEVER return a mock or a generic no-names plan
  // (founder decision). If we searched real venues but nothing fit, that's "no options"; if we
  // couldn't search at all (misconfig / no location), that's a technical failure.
  return canSearchReal ? noOptionsResponse() : generationFailedResponse();
});
