import type { Album } from '@/features/albums/types';
import { CHALLENGES, challengeOfWeek, isoWeek, weekStart, weeklyChallenge } from './challenges';

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

const byKey = (k: string) => {
  const c = CHALLENGES.find((x) => x.key === k);
  if (!c) throw new Error(`no challenge ${k}`);
  return c;
};

describe('weekly challenge rotation', () => {
  it('weekStart is the Monday 00:00 of that week', () => {
    const ws = weekStart(new Date(2026, 6, 15)); // Wed 15 Jul 2026
    expect(ws.getDay()).toBe(1);
    expect(ws.getDate()).toBe(13);
    expect(ws.getHours()).toBe(0);
  });

  it('1 Jan 2026 (a Thursday) is ISO week 1', () => {
    expect(isoWeek(new Date(2026, 0, 1))).toBe(1);
  });

  it('the ISO week increments week over week', () => {
    expect(isoWeek(new Date(2026, 6, 22))).toBe(isoWeek(new Date(2026, 6, 15)) + 1);
  });

  it('stays the same all week, then changes the next week', () => {
    const mon = new Date(2026, 6, 13);
    const sun = new Date(2026, 6, 19);
    expect(challengeOfWeek(sun).key).toBe(challengeOfWeek(mon).key);
    expect(challengeOfWeek(new Date(2026, 6, 20)).key).not.toBe(challengeOfWeek(mon).key);
  });
});

describe('weekly challenge completion (real data only)', () => {
  it('newPlace: only a city you have not been to before counts', () => {
    const c = byKey('newPlace');
    expect(c.done([album({ city: 'Berlin' })], [album({ city: 'Frankfurt' })])).toBe(true);
    expect(c.done([album({ city: 'Frankfurt' })], [album({ city: 'Frankfurt' })])).toBe(false);
  });

  it('photos: needs at least 3 photos in one evening', () => {
    const c = byKey('photos');
    expect(c.done([album({ photoCount: 3 })], [])).toBe(true);
    expect(c.done([album({ photoCount: 2 })], [])).toBe(false);
  });

  it('note: a blank note does not count', () => {
    const c = byKey('note');
    expect(c.done([album({ note: '   ' })], [])).toBe(false);
    expect(c.done([album({ note: 'Schön war es' })], [])).toBe(true);
  });

  it('cozy: matches the evening mood', () => {
    const c = byKey('cozy');
    expect(c.done([album({ mood: 'Cozy' })], [])).toBe(true);
    expect(c.done([album({ mood: 'Party' })], [])).toBe(false);
  });

  it('no evenings this week → nothing is fulfilled', () => {
    const now = new Date(2026, 6, 15);
    const { challenge, done } = weeklyChallenge([], now);
    expect(challenge.key).toBe(challengeOfWeek(now).key);
    expect(done).toBe(false);
  });

  it('an evening from an earlier week cannot fulfil this week', () => {
    const now = new Date(2026, 6, 15);
    // Dated well before this week's Monday → counted as "earlier", never as this week.
    const old = album({ date: '2026-06-01T20:00:00.000Z', photoCount: 9, note: 'alt', mood: 'Cozy', city: 'Rom' });
    expect(weeklyChallenge([old], now).done).toBe(false);
  });

  it('survives an unparseable album date', () => {
    expect(() => weeklyChallenge([album({ date: 'nope' })], new Date(2026, 6, 15))).not.toThrow();
  });
});
