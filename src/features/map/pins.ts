import type { Album } from '@/features/albums/types';

/** One evening, at the place it happened. */
export interface MapPin {
  albumId: string;
  title: string;
  city: string;
  date: string;
  lat: number;
  lng: number;
}

/** Pins that sit close together on screen, drawn as one bubble (22_PROFILE: "Clusters nearby memories"). */
export interface PinCluster {
  x: number;
  y: number;
  pins: MapPin[];
}

/** Project lng/lat to screen space; null when the point falls outside the projection. */
export type Project = (lng: number, lat: number) => [number, number] | null;

/**
 * One pin per evening, placed at its first stop with real coordinates.
 *
 * Coordinates come from Google Places via the plan's stops — nothing extra is tracked and nothing is
 * invented. Evenings spent at home have no coordinates at all, so they simply don't appear.
 */
export function pinsFromAlbums(albums: Album[]): MapPin[] {
  const pins: MapPin[] = [];
  for (const a of albums) {
    const stop = a.timeline?.find(
      (s) => typeof s.lat === 'number' && typeof s.lng === 'number' && Number.isFinite(s.lat) && Number.isFinite(s.lng),
    );
    if (!stop) continue;
    pins.push({
      albumId: a.id,
      title: a.title,
      city: a.city,
      date: a.date,
      lat: stop.lat as number,
      lng: stop.lng as number,
    });
  }
  return pins;
}

/**
 * Group pins within `radiusPx` of each other. Clustering happens in SCREEN space, not by distance on
 * the ground, so the map stays readable at any size: nine evenings in one city collapse to one
 * bubble instead of a pile of overlapping dots.
 */
export function clusterPins(pins: MapPin[], project: Project, radiusPx: number): PinCluster[] {
  const clusters: PinCluster[] = [];
  for (const pin of pins) {
    const point = project(pin.lng, pin.lat);
    if (!point) continue;
    const [x, y] = point;
    const near = clusters.find((c) => Math.hypot(c.x - x, c.y - y) <= radiusPx);
    if (near) {
      near.pins.push(pin);
      // Drift to the group's centre so the bubble sits among its memories, not on the first one.
      const n = near.pins.length;
      near.x = (near.x * (n - 1) + x) / n;
      near.y = (near.y * (n - 1) + y) / n;
    } else {
      clusters.push({ x, y, pins: [pin] });
    }
  }
  // Biggest last → drawn on top, so a busy city never hides behind a single pin.
  return clusters.sort((a, b) => a.pins.length - b.pins.length);
}

/** Distinct cities across the pins — the "12 Städte" line. */
export function cityCount(pins: MapPin[]): number {
  return new Set(pins.map((p) => p.city).filter(Boolean)).size;
}
