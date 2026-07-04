// UNPLND — resolve Google Place photo names → displayable URLs, ON DEMAND (Deno).
// Called only when a user opens a stop's photo gallery, so we pay for photos people actually
// look at (not every photo of every plan). The Google key stays server-side (31_SECURITY).
// Deploy: Dashboard → Edge Functions → new function "resolve-photos" → paste this file.
// Uses the existing GOOGLE_MAPS_API_KEY secret.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLACES_BASE = 'https://places.googleapis.com/v1';

async function resolvePhoto(photoName: string, key: string, maxPx = 1080): Promise<string | undefined> {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const googleKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
  if (!googleKey) return Response.json({ urls: [] }, { headers: CORS });

  let body: { names?: unknown };
  try {
    body = (await req.json()) as { names?: unknown };
  } catch {
    return Response.json({ urls: [] }, { status: 400, headers: CORS });
  }

  // Cap at 8 so one gallery can never fan out into a huge bill.
  const names = Array.isArray(body.names)
    ? body.names.filter((n): n is string => typeof n === 'string' && n.length > 0).slice(0, 8)
    : [];

  const urls = (await Promise.all(names.map((n) => resolvePhoto(n, googleKey)))).filter(
    (u): u is string => Boolean(u),
  );

  return Response.json({ urls }, { headers: CORS });
});
