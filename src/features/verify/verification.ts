import { useAuthStore } from '@/features/auth/auth-store';
import { supabase } from '@/lib/supabase';

export interface VerifyMetrics {
  eveningsCreated: number;
  published: number;
  ownPlans: number;
  streakDays: number;
  connections: number;
  ratingsReceived: number;
  topPlans: number;
}

export type MetricKey = keyof VerifyMetrics;

/** A published plan counts as a "top plan" once it reaches this many community stars. */
export const TOP_PLAN_STARS = 10;

export interface Tier {
  level: number;
  id: string;
  /** Badge tint. */
  color: string;
  requirements: Partial<Record<MetricKey, number>>;
}

/**
 * The five-tier verification ladder. Numbers follow the founder's reference image; they're plain
 * constants — tune freely here. Requirements are cumulative (a higher tier meets every lower one).
 */
export const TIERS: readonly Tier[] = [
  { level: 1, id: 'verified', color: '#4C9BE8', requirements: { eveningsCreated: 2, published: 1, streakDays: 2 } },
  { level: 2, id: 'explorer', color: '#48C4D3', requirements: { eveningsCreated: 6, published: 3, streakDays: 5 } },
  {
    level: 3,
    id: 'adventurer',
    color: '#9B7BE8',
    requirements: { eveningsCreated: 12, published: 6, ownPlans: 1, streakDays: 10 },
  },
  {
    level: 4,
    id: 'legend',
    color: '#E5A93C',
    requirements: {
      eveningsCreated: 25,
      published: 12,
      ownPlans: 3,
      streakDays: 21,
      connections: 15,
      ratingsReceived: 40,
    },
  },
  {
    level: 5,
    id: 'master',
    color: '#C56B9E',
    requirements: {
      eveningsCreated: 50,
      published: 25,
      ownPlans: 6,
      streakDays: 45,
      connections: 60,
      ratingsReceived: 150,
      topPlans: 3,
    },
  },
];

const ZERO: VerifyMetrics = {
  eveningsCreated: 0,
  published: 0,
  ownPlans: 0,
  streakDays: 0,
  connections: 0,
  ratingsReceived: 0,
  topPlans: 0,
};

/** Fetch the current user's real progress metrics (all derived from live data — no fakes). */
export async function getVerifyMetrics(): Promise<VerifyMetrics> {
  const uid = useAuthStore.getState().user?.id;
  if (!uid) return ZERO;

  const [albums, published, ownPlans, conns, starRows, profile] = await Promise.all([
    supabase.from('albums').select('id', { count: 'exact', head: true }).eq('owner_id', uid),
    supabase.from('published_plans').select('id', { count: 'exact', head: true }).eq('author_id', uid),
    supabase
      .from('published_plans')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', uid)
      .eq('is_custom', true),
    supabase
      .from('connections')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'accepted')
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`),
    supabase.from('published_plans').select('star_count').eq('author_id', uid),
    supabase.from('profiles').select('streak_days').eq('id', uid).maybeSingle(),
  ]);

  const stars = (starRows.data ?? []) as { star_count: number | null }[];
  const ratingsReceived = stars.reduce((sum, r) => sum + (r.star_count ?? 0), 0);
  const topPlans = stars.filter((r) => (r.star_count ?? 0) >= TOP_PLAN_STARS).length;

  return {
    eveningsCreated: albums.count ?? 0,
    published: published.count ?? 0,
    ownPlans: ownPlans.count ?? 0,
    streakDays: (profile.data?.streak_days as number | undefined) ?? 0,
    connections: conns.count ?? 0,
    ratingsReceived,
    topPlans,
  };
}

export function tierMet(m: VerifyMetrics, tier: Tier): boolean {
  return (Object.entries(tier.requirements) as [MetricKey, number][]).every(([k, v]) => m[k] >= v);
}

/** Highest fully-met tier level right now (0 = none). LIVE ONLY — display goes through the ratchet. */
export function currentTierLevel(m: VerifyMetrics): number {
  let level = 0;
  for (const tier of TIERS) if (tierMet(m, tier)) level = tier.level;
  return level;
}

/** A tier, once earned, is earned forever — a broken streak must never take a badge away. */
export function effectiveVerifyLevel(stored: number, live: number): number {
  return Math.max(stored, live, 0);
}

/**
 * The level to DISPLAY: the highest ever reached. Reads the stored level, ratchets it up when the
 * live metrics now exceed it (the DB trigger from 0037 refuses any decrease), and returns the max.
 */
export async function resolveVerifyLevel(m: VerifyMetrics): Promise<number> {
  const live = currentTierLevel(m);
  const uid = useAuthStore.getState().user?.id;
  if (!uid) return live;

  const { data } = await supabase.from('profiles').select('verify_level').eq('id', uid).maybeSingle();
  const stored = (data?.verify_level as number | undefined) ?? 0;
  const level = effectiveVerifyLevel(stored, live);
  if (live > stored) {
    // Best effort — if this write fails, the level is still shown; it just ratchets next time.
    void supabase.from('profiles').update({ verify_level: live }).eq('id', uid);
  }
  return level;
}

export function tierByLevel(level: number): Tier | undefined {
  return TIERS.find((t) => t.level === level);
}

/** The next tier to aim for (null once everything is unlocked). */
export function nextTier(m: VerifyMetrics): Tier | null {
  const lvl = currentTierLevel(m);
  return TIERS.find((t) => t.level === lvl + 1) ?? null;
}

export interface Progress {
  key: MetricKey;
  have: number;
  need: number;
  done: boolean;
}

export function tierProgress(m: VerifyMetrics, tier: Tier): Progress[] {
  return (Object.entries(tier.requirements) as [MetricKey, number][]).map(([key, need]) => ({
    key,
    have: m[key],
    need,
    done: m[key] >= need,
  }));
}
