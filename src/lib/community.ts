import { useAuthStore } from '@/features/auth/auth-store';
import type { PlanStop } from '@/features/planner/types';
import { getPlanningLocation } from '@/store/location-store';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export interface CommunityPlan {
  id: string;
  authorId: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  title: string;
  city: string | null;
  summary: string | null;
  photos: string[];
  starCount: number;
  selfRating: number | null;
  route: PlanStop[];
  createdAt: string;
  starred: boolean;
  distanceM: number | null;
}

export interface CommunityResult {
  plans: CommunityPlan[];
  needsLocation: boolean;
}

export interface PublicProfile {
  id: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  styleId: string | null;
  homeCity: string | null;
  pinnedPlaces: string[];
  isFounder: boolean;
  memberSince: string | null;
}

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const NEARBY_M = 40000; // 40 km counts as "in deiner Nähe"

/**
 * Community feed — published evenings, ranked **proximity → stars → recency** (founder decision).
 * published_plans is client-readable (RLS: non-hidden); the Google key isn't involved here.
 */
export async function getCommunityPlans(): Promise<CommunityResult> {
  const location = await getPlanningLocation();
  if (!isSupabaseConfigured) return { plans: [], needsLocation: false };

  const { data, error } = await supabase
    .from('published_plans')
    .select('id, author_id, author_name, author_avatar, title, city, summary, lat, lng, photos, star_count, self_rating, route, created_at')
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error || !data) return { plans: [], needsLocation: !location };

  const userId = useAuthStore.getState().user?.id;
  let starred = new Set<string>();
  let blocked = new Set<string>();
  if (userId) {
    const { data: mine } = await supabase.from('plan_stars').select('published_plan_id').eq('user_id', userId);
    starred = new Set((mine ?? []).map((s) => s.published_plan_id as string));
    const { data: bl } = await supabase.from('blocked_users').select('blocked_id').eq('blocker_id', userId);
    blocked = new Set((bl ?? []).map((b) => b.blocked_id as string));
  }

  const mapped: CommunityPlan[] = data.map((p: Record<string, unknown>) => {
    const lat = p.lat as number | null;
    const lng = p.lng as number | null;
    const distanceM =
      location && typeof lat === 'number' && typeof lng === 'number'
        ? Math.round(haversine(location.latitude, location.longitude, lat, lng))
        : null;
    return {
      id: p.id as string,
      authorId: (p.author_id as string | null) ?? null,
      authorName: (p.author_name as string | null) ?? null,
      authorAvatar: (p.author_avatar as string | null) ?? null,
      title: p.title as string,
      city: (p.city as string | null) ?? null,
      summary: (p.summary as string | null) ?? null,
      photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
      starCount: (p.star_count as number) ?? 0,
      selfRating: (p.self_rating as number | null) ?? null,
      route: Array.isArray(p.route) ? (p.route as PlanStop[]) : [],
      createdAt: p.created_at as string,
      starred: starred.has(p.id as string),
      distanceM,
    };
  });

  // Hide plans from users you've blocked.
  const plans = mapped.filter((p) => !p.authorId || !blocked.has(p.authorId));

  // Nearby first, then more stars, then more recent.
  plans.sort((a, b) => {
    const aNear = a.distanceM !== null && a.distanceM <= NEARBY_M;
    const bNear = b.distanceM !== null && b.distanceM <= NEARBY_M;
    if (aNear !== bNear) return aNear ? -1 : 1;
    if (b.starCount !== a.starCount) return b.starCount - a.starCount;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return { plans, needsLocation: false };
}

/** Fetch a single published plan by id (for the detail screen). */
export async function getCommunityPlan(id: string): Promise<CommunityPlan | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('published_plans')
    .select('id, author_id, author_name, author_avatar, title, city, summary, photos, star_count, self_rating, route, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;

  const userId = useAuthStore.getState().user?.id;
  let starred = false;
  if (userId) {
    const { data: mine } = await supabase
      .from('plan_stars')
      .select('id')
      .eq('published_plan_id', id)
      .eq('user_id', userId)
      .maybeSingle();
    starred = Boolean(mine);
  }

  const p = data as Record<string, unknown>;
  return {
    id: p.id as string,
    authorId: (p.author_id as string | null) ?? null,
    authorName: (p.author_name as string | null) ?? null,
    authorAvatar: (p.author_avatar as string | null) ?? null,
    title: p.title as string,
    city: (p.city as string | null) ?? null,
    summary: (p.summary as string | null) ?? null,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
    starCount: (p.star_count as number) ?? 0,
    selfRating: (p.self_rating as number | null) ?? null,
    route: Array.isArray(p.route) ? (p.route as PlanStop[]) : [],
    createdAt: p.created_at as string,
    starred,
    distanceM: null,
  };
}

/**
 * A user's public profile — SAFE fields only (name, avatar, bio, style, member-since) via the
 * get_public_profile function. Falls back to the denormalized author name/avatar from a published
 * plan if the migration isn't applied yet, so the feature degrades gracefully.
 */
export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.rpc('get_public_profile', { target: userId });
  const row = Array.isArray(data) ? data[0] : data;
  if (!error && row) {
    return {
      id: userId,
      name: (row.display_name as string | null) ?? null,
      avatar: (row.photo_url as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      styleId: (row.profile_style as string | null) ?? null,
      homeCity: (row.home_city as string | null) ?? null,
      pinnedPlaces: Array.isArray(row.pinned_places) ? (row.pinned_places as string[]) : [],
      isFounder: Boolean(row.is_founder),
      memberSince: (row.member_since as string | null) ?? null,
    };
  }
  // Fallback: derive name + avatar from the author's most recent published plan.
  const { data: pp } = await supabase
    .from('published_plans')
    .select('author_name, author_avatar')
    .eq('author_id', userId)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (pp) {
    return {
      id: userId,
      name: (pp.author_name as string | null) ?? null,
      avatar: (pp.author_avatar as string | null) ?? null,
      bio: null,
      styleId: null,
      homeCity: null,
      pinnedPlaces: [],
      isFounder: false,
      memberSince: null,
    };
  }
  return null;
}

/** Every non-hidden plan a user has published — the feed on their public profile. */
export async function getUserPublishedPlans(userId: string): Promise<CommunityPlan[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('published_plans')
    .select('id, author_id, author_name, author_avatar, title, city, summary, photos, star_count, self_rating, route, created_at')
    .eq('author_id', userId)
    .eq('hidden', false)
    .order('created_at', { ascending: false })
    .limit(60);
  if (error || !data) return [];

  const currentUserId = useAuthStore.getState().user?.id;
  let starred = new Set<string>();
  if (currentUserId) {
    const { data: mine } = await supabase.from('plan_stars').select('published_plan_id').eq('user_id', currentUserId);
    starred = new Set((mine ?? []).map((s) => s.published_plan_id as string));
  }

  return data.map((p: Record<string, unknown>) => ({
    id: p.id as string,
    authorId: (p.author_id as string | null) ?? null,
    authorName: (p.author_name as string | null) ?? null,
    authorAvatar: (p.author_avatar as string | null) ?? null,
    title: p.title as string,
    city: (p.city as string | null) ?? null,
    summary: (p.summary as string | null) ?? null,
    photos: Array.isArray(p.photos) ? (p.photos as string[]) : [],
    starCount: (p.star_count as number) ?? 0,
    selfRating: (p.self_rating as number | null) ?? null,
    route: Array.isArray(p.route) ? (p.route as PlanStop[]) : [],
    createdAt: p.created_at as string,
    starred: starred.has(p.id as string),
    distanceM: null,
  }));
}

/** Star / unstar a published plan (the star_count trigger keeps the total in sync). */
export async function toggleStar(planId: string, currentlyStarred: boolean): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  try {
    if (currentlyStarred) {
      await supabase.from('plan_stars').delete().eq('published_plan_id', planId).eq('user_id', userId);
    } else {
      await supabase.from('plan_stars').insert({ published_plan_id: planId, user_id: userId });
    }
  } catch {
    // Best effort — the optimistic UI already updated; a failed toggle self-corrects on refresh.
  }
}

/** Report a published plan for moderation (App-Store requirement for UGC). */
export async function reportPlan(planId: string, reason?: string): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId) return;
  try {
    await supabase
      .from('plan_reports')
      .insert({ published_plan_id: planId, reporter_id: userId, reason: reason ?? null });
  } catch {
    // Best effort.
  }
}

/** Block a user — you won't see their published plans anymore. */
export async function blockUser(authorId: string): Promise<void> {
  const userId = useAuthStore.getState().user?.id;
  if (!userId || authorId === userId) return;
  try {
    await supabase.from('blocked_users').insert({ blocker_id: userId, blocked_id: authorId });
  } catch {
    // Best effort (a duplicate block just no-ops via the unique constraint).
  }
}
