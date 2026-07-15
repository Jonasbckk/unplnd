import type { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import type { Album } from '@/features/albums/types';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface Challenge {
  key: string;
  icon: IoniconName;
  /**
   * Fulfilled? `week` = this week's evenings, `earlier` = every evening before this week.
   * Derived from REAL albums only — nothing is ever self-reported (Constitution: no fake data).
   */
  done: (week: Album[], earlier: Album[]) => boolean;
}

/**
 * One invitation per week — a nudge toward a single real evening.
 *
 * Deliberately NOT a points system: the docs put Challenges in "Future Features" with
 * "No level/XP/points system", and the Constitution forbids vanity metrics and fake urgency.
 * So: no XP, no levels, no leaderboard, no countdown pressure — just this week's idea, and a
 * quiet "done" once a real evening fulfils it. Themes stay quality/emotion-led ("Quality over
 * quantity"), which is why there is no "plan N evenings this week" entry.
 *
 * Every entry must be verifiable from real album data.
 */
export const CHALLENGES: readonly Challenge[] = [
  {
    key: 'newPlace',
    icon: 'map-outline',
    done: (week, earlier) => {
      const seen = new Set(earlier.map((a) => a.city).filter(Boolean));
      return week.some((a) => Boolean(a.city) && !seen.has(a.city));
    },
  },
  { key: 'photos', icon: 'camera-outline', done: (week) => week.some((a) => a.photoCount >= 3) },
  { key: 'multiStop', icon: 'git-branch-outline', done: (week) => week.some((a) => a.timeline.length >= 3) },
  { key: 'note', icon: 'create-outline', done: (week) => week.some((a) => (a.note ?? '').trim().length > 0) },
  { key: 'adventure', icon: 'compass-outline', done: (week) => week.some((a) => a.mood === 'Adventure') },
  { key: 'cozy', icon: 'home-outline', done: (week) => week.some((a) => a.mood === 'Cozy') },
];

/** Monday 00:00 (local) of the week containing `d` — the week boundary we count evenings against. */
export function weekStart(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Mon = 0 … Sun = 6
  return x;
}

/** ISO-8601 week number (1–53) — the rotation index, so the invitation genuinely changes each week. */
export function isoWeek(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7) + 3); // Thursday of this ISO week
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() - ((firstThursday.getUTCDay() + 6) % 7) + 3);
  return 1 + Math.round((t.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000));
}

/** This week's invitation — same for everyone, derived from the calendar (no server state needed). */
export function challengeOfWeek(now: Date): Challenge {
  return CHALLENGES[isoWeek(now) % CHALLENGES.length];
}

export interface WeeklyChallengeState {
  challenge: Challenge;
  done: boolean;
}

/** This week's invitation plus whether a real evening already fulfilled it. */
export function weeklyChallenge(albums: Album[], now: Date): WeeklyChallengeState {
  const start = weekStart(now).getTime();
  const week: Album[] = [];
  const earlier: Album[] = [];
  for (const a of albums) {
    const at = new Date(a.date).getTime();
    if (Number.isNaN(at)) continue;
    (at >= start ? week : earlier).push(a);
  }
  const challenge = challengeOfWeek(now);
  return { challenge, done: challenge.done(week, earlier) };
}
