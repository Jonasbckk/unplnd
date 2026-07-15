import type { Album } from '@/features/albums/types';
import type { PlanStop } from '@/features/planner/types';
import { cityCount, clusterPins, pinsFromAlbums, type MapPin, type Project } from './pins';

function stop(over: Partial<PlanStop> = {}): PlanStop {
  return { time: '19:30', category: 'Dinner', title: 'Ort', reason: '', ...over };
}

function album(over: Partial<Album> = {}): Album {
  return {
    id: 'a',
    title: 'Abend',
    city: 'Frankfurt',
    date: '2026-07-15T20:00:00.000Z',
    mood: 'Relaxed',
    weather: '',
    coverColor: '#000000',
    timeline: [],
    photoCount: 0,
    favorite: false,
    ...over,
  };
}

function pin(over: Partial<MapPin> = {}): MapPin {
  return { albumId: 'a', title: 'Abend', city: 'Frankfurt', date: '', lat: 50.11, lng: 8.68, ...over };
}

/** Straight lng/lat → x/y, so the maths under test stays the subject. */
const project: Project = (lng, lat) => [lng, lat];

describe('pins from albums', () => {
  it('takes the first stop that has real coordinates', () => {
    const a = album({ timeline: [stop(), stop({ lat: 50.11, lng: 8.68 }), stop({ lat: 52.5, lng: 13.4 })] });
    expect(pinsFromAlbums([a])).toEqual([
      expect.objectContaining({ albumId: 'a', lat: 50.11, lng: 8.68 }),
    ]);
  });

  it('skips an evening at home — no coordinates, no pin', () => {
    expect(pinsFromAlbums([album({ timeline: [stop({ title: 'Chillen auf dem Sofa' })] })])).toEqual([]);
  });

  it('skips an album with no timeline at all', () => {
    expect(pinsFromAlbums([album({ timeline: [] })])).toEqual([]);
  });

  it('ignores broken coordinates rather than placing a pin at null island', () => {
    const a = album({ timeline: [stop({ lat: Number.NaN, lng: 8.68 })] });
    expect(pinsFromAlbums([a])).toEqual([]);
  });
});

describe('clustering', () => {
  it('merges pins that land within the radius', () => {
    const clusters = clusterPins([pin({ lng: 10, lat: 10 }), pin({ albumId: 'b', lng: 12, lat: 10 })], project, 5);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].pins).toHaveLength(2);
  });

  it('keeps far-apart pins separate', () => {
    const clusters = clusterPins([pin({ lng: 10, lat: 10 }), pin({ albumId: 'b', lng: 80, lat: 10 })], project, 5);
    expect(clusters).toHaveLength(2);
  });

  it('places the bubble at the centre of its group', () => {
    const clusters = clusterPins([pin({ lng: 10, lat: 10 }), pin({ albumId: 'b', lng: 14, lat: 10 })], project, 8);
    expect(clusters[0].x).toBeCloseTo(12);
  });

  it('draws busier clusters last so they sit on top', () => {
    const clusters = clusterPins(
      [pin({ lng: 0, lat: 0 }), pin({ albumId: 'b', lng: 50, lat: 0 }), pin({ albumId: 'c', lng: 51, lat: 0 })],
      project,
      5,
    );
    expect(clusters[clusters.length - 1].pins).toHaveLength(2);
  });

  it('drops pins the projection cannot place', () => {
    expect(clusterPins([pin()], () => null, 5)).toEqual([]);
  });
});

describe('cityCount', () => {
  it('counts distinct cities and ignores blanks', () => {
    expect(cityCount([pin({ city: 'Frankfurt' }), pin({ city: 'Frankfurt' }), pin({ city: 'Rom' }), pin({ city: '' })])).toBe(2);
  });
});
