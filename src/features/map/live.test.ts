import { isFresh, minutesSince, roundCoord } from './live';

describe('live location privacy + freshness', () => {
  it('rounds coordinates to ~1 km — the exact address never leaves the phone', () => {
    expect(roundCoord(50.1109221)).toBe(50.11);
    expect(roundCoord(8.6821267)).toBe(8.68);
    expect(roundCoord(-33.8675)).toBe(-33.87);
  });

  it('fresh within the hour, stale after', () => {
    const now = new Date('2026-07-15T22:00:00.000Z');
    expect(isFresh('2026-07-15T21:30:00.000Z', now)).toBe(true);
    expect(isFresh('2026-07-15T20:59:00.000Z', now)).toBe(false);
  });

  it('an unparseable timestamp is never fresh', () => {
    expect(isFresh('nope', new Date())).toBe(false);
  });

  it('minutesSince rounds sensibly and never goes negative', () => {
    const now = new Date('2026-07-15T22:00:00.000Z');
    expect(minutesSince('2026-07-15T21:43:00.000Z', now)).toBe(17);
    expect(minutesSince('2026-07-15T22:05:00.000Z', now)).toBe(0);
  });
});
