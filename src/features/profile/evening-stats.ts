import type { Album } from '@/features/albums/types';

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export interface ExtendedStats {
  favoriteCity: string | null;
  totalKm: number;
  venues: { restaurant: number; bar: number; club: number; cafe: number };
}

// Stops carry a free-text (AI) category — bucket by keyword (DE + EN), best-effort but from real data.
const RE = {
  club: /club|nightlife|disco|tanz|\bdance\b|\bparty\b/i,
  bar: /\bbar\b|cocktail|\bpub\b|drinks?|wein|wine|lounge|biergarten|aperit/i,
  cafe: /caf[eé]|kaffee|coffee|dessert|\beis\b|ice ?cream|bäckerei|bakery/i,
  restaurant: /restaurant|dinner|abendessen|essen|dining|brunch|lunch|steak|sushi|pizz|trattoria|bistro|food/i,
};

export function computeExtendedStats(albums: Album[]): ExtendedStats {
  const cityCounts = new Map<string, number>();
  for (const a of albums) if (a.city) cityCounts.set(a.city, (cityCounts.get(a.city) ?? 0) + 1);
  let favoriteCity: string | null = null;
  let best = 0;
  for (const [c, n] of cityCounts) {
    if (n > best) {
      best = n;
      favoriteCity = c;
    }
  }

  let meters = 0;
  for (const a of albums) {
    const stops = a.timeline ?? [];
    for (let i = 1; i < stops.length; i++) {
      const p = stops[i - 1];
      const q = stops[i];
      if (
        typeof p.lat === 'number' &&
        typeof p.lng === 'number' &&
        typeof q.lat === 'number' &&
        typeof q.lng === 'number'
      ) {
        meters += haversine(p.lat, p.lng, q.lat, q.lng);
      }
    }
  }

  const venues = { restaurant: 0, bar: 0, club: 0, cafe: 0 };
  for (const a of albums) {
    for (const s of a.timeline ?? []) {
      const text = `${s.category ?? ''} ${s.title ?? ''}`;
      if (RE.club.test(text)) venues.club++;
      else if (RE.bar.test(text)) venues.bar++;
      else if (RE.cafe.test(text)) venues.cafe++;
      else if (RE.restaurant.test(text)) venues.restaurant++;
    }
  }

  return { favoriteCity, totalKm: Math.round(meters / 1000), venues };
}
