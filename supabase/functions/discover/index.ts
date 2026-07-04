// UNPLND — Discover Edge Function (Deno).
// Returns REAL, well-rated venues near the user for a category (21_DISCOVER).
// Reuses Google Places (New); the key stays server-side (31_SECURITY).
// Deploy: Dashboard → Edge Functions → new function "discover" → paste this file.
// Uses the existing GOOGLE_MAPS_API_KEY secret.

interface DiscoverRequest {
  latitude?: number;
  longitude?: number;
  category?: string;
  /** Free-text search, e.g. "great sushi restaurant" — uses Places Text Search instead of a category. */
  query?: string;
  language?: 'de' | 'en';
}

interface DiscoverPlace {
  id: string;
  name: string;
  type?: string;
  rating: number;
  ratingCount: number;
  priceLevel?: string;
  openNow?: boolean;
  hours?: string;
  address?: string;
  lat: number;
  lng: number;
  photoUrl?: string;
  distanceM: number;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLACES_BASE = 'https://places.googleapis.com/v1';
const RADIUS = 4000;

// Category key → Google place types. No category → a lively "near you" mix.
const CATEGORY_TYPES: Record<string, string[]> = {
  food: ['restaurant'],
  cafes: ['cafe', 'coffee_shop'],
  drinks: ['bar', 'pub', 'wine_bar'],
  nature: ['park', 'tourist_attraction', 'hiking_area'],
  culture: ['museum', 'art_gallery'],
  nightlife: ['night_club', 'bar'],
  activities: ['tourist_attraction', 'bowling_alley', 'amusement_center'],
};
const DEFAULT_TYPES = ['restaurant', 'bar', 'cafe', 'tourist_attraction'];

const JUNK_TYPES = ['fast_food_restaurant', 'meal_takeaway', 'meal_delivery'];
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

async function searchNearby(types: string[], lat: number, lng: number, key: string, language: string): Promise<any[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchNearby`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.currentOpeningHours,places.location,places.priceLevel,places.photos,places.formattedAddress',
    },
    body: JSON.stringify({
      includedTypes: types,
      excludedPrimaryTypes: JUNK_TYPES,
      maxResultCount: 20,
      rankPreference: 'POPULARITY',
      languageCode: language,
      regionCode: 'DE',
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS } },
    }),
  });
  if (!res.ok) {
    console.error('discover_places_error', res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const json = await res.json();
  return json?.places ?? [];
}

// Free-text search (Places Text Search) — for "I want a great sushi place" style discovery.
async function searchText(query: string, lat: number, lng: number, key: string, language: string): Promise<any[]> {
  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.primaryTypeDisplayName,places.rating,places.userRatingCount,places.currentOpeningHours,places.location,places.priceLevel,places.photos,places.formattedAddress',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 20,
      languageCode: language,
      regionCode: 'DE',
      rankPreference: 'RELEVANCE',
      locationBias: { circle: { center: { latitude: lat, longitude: lng }, radius: RADIUS } },
    }),
  });
  if (!res.ok) {
    console.error('discover_text_error', res.status, (await res.text()).slice(0, 300));
    return [];
  }
  const json = await res.json();
  return json?.places ?? [];
}

async function resolvePhoto(photoName: string, key: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `${PLACES_BASE}/${photoName}/media?maxHeightPx=400&maxWidthPx=600&skipHttpRedirect=true`,
      { headers: { 'X-Goog-Api-Key': key } },
    );
    if (!res.ok) return undefined;
    const json = await res.json();
    return json?.photoUri as string | undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!googleKey) {
    return Response.json({ places: [] }, { headers: CORS });
  }

  let body: DiscoverRequest;
  try {
    body = (await req.json()) as DiscoverRequest;
  } catch {
    return Response.json({ places: [] }, { status: 400, headers: CORS });
  }

  if (typeof body.latitude !== 'number' || typeof body.longitude !== 'number') {
    return Response.json({ places: [] }, { headers: CORS });
  }

  const lat = body.latitude;
  const lng = body.longitude;
  const language = body.language ?? 'de';
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  const types = (body.category && CATEGORY_TYPES[body.category]) || DEFAULT_TYPES;

  // Free-text query → Text Search (niche spots have fewer reviews, so a lower count bar);
  // otherwise the category Nearby search.
  const raw = query
    ? await searchText(query, lat, lng, googleKey, language)
    : await searchNearby(types, lat, lng, googleKey, language);
  const minCount = query ? 10 : 20;
  const today = (new Date().getUTCDay() + 6) % 7;

  const places: DiscoverPlace[] = raw
    .filter(
      (p: any) =>
        p?.id &&
        p?.location &&
        (p.rating ?? 0) >= 4.0 &&
        (p.userRatingCount ?? 0) >= minCount &&
        !CHAIN_BLOCKLIST.test(p.displayName?.text ?? ''),
    )
    .map((p: any) => {
      const hoursToday = p.currentOpeningHours?.weekdayDescriptions?.[today];
      return {
        id: p.id,
        name: p.displayName?.text ?? '',
        type: p.primaryTypeDisplayName?.text,
        rating: p.rating ?? 0,
        ratingCount: p.userRatingCount ?? 0,
        priceLevel: PRICE_MAP[p.priceLevel] || undefined,
        openNow: p.currentOpeningHours?.openNow,
        hours: typeof hoursToday === 'string' ? hoursToday.replace(/^[A-Za-zäöü]+:\s*/, '') : undefined,
        address: p.formattedAddress,
        lat: p.location.latitude,
        lng: p.location.longitude,
        photoName: p.photos?.[0]?.name as string | undefined,
        distanceM: Math.round(haversine(lat, lng, p.location.latitude, p.location.longitude)),
      };
    })
    .sort((a, b) => b.rating * Math.log10(b.ratingCount + 10) - a.rating * Math.log10(a.ratingCount + 10))
    .slice(0, 12)
    .map(({ photoName: _photoName, ...rest }) => rest);

  // Resolve one photo per place in parallel (best effort).
  await Promise.all(
    places.map(async (place) => {
      const photoName = (raw.find((p: any) => p.id === place.id) as any)?.photos?.[0]?.name;
      if (photoName) place.photoUrl = await resolvePhoto(photoName, googleKey);
    }),
  );

  return Response.json({ places }, { headers: CORS });
});
