// UNPLND — place-search: turn a text query (city or address) into location suggestions WITH
// coordinates, so users can plan/discover for a place other than their GPS (location override).
// Google Places Text Search; the key stays server-side (31_SECURITY). Uses GOOGLE_MAPS_API_KEY.
// Deploy: Dashboard → Edge Functions → new function "place-search" → paste this file.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLACES_BASE = 'https://places.googleapis.com/v1';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!googleKey) return Response.json({ suggestions: [] }, { headers: CORS });

  let body: { query?: string; language?: string };
  try {
    body = (await req.json()) as { query?: string; language?: string };
  } catch {
    return Response.json({ suggestions: [] }, { status: 400, headers: CORS });
  }
  const query = typeof body.query === 'string' ? body.query.trim() : '';
  if (query.length < 2) return Response.json({ suggestions: [] }, { headers: CORS });

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': googleKey,
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 6,
      languageCode: body.language ?? 'de',
      regionCode: 'DE',
    }),
  });
  if (!res.ok) {
    console.error('place_search_error', res.status, (await res.text()).slice(0, 200));
    return Response.json({ suggestions: [] }, { headers: CORS });
  }

  const json = await res.json();
  const suggestions = (json?.places ?? [])
    .map((p: any) => ({
      name: p.displayName?.text ?? p.formattedAddress ?? '',
      address: p.formattedAddress ?? '',
      lat: p.location?.latitude,
      lng: p.location?.longitude,
    }))
    .filter((s: any) => typeof s.lat === 'number' && typeof s.lng === 'number');

  return Response.json({ suggestions }, { headers: CORS });
});
