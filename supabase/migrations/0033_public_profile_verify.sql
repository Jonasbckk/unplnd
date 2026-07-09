-- 0033: extend get_public_profile_stats with the metrics needed to show someone's VERIFICATION tier
-- on their public profile. Tier logic stays in the app (src/features/verify/verification.ts) — the RPC
-- only returns the raw counts, some of which (streak_days, connections) are RLS-protected and can't be
-- read directly across users. SECURITY DEFINER, same aggregate-only exposure as 0032 (no private rows).
--
-- Changing the return signature requires a drop first (create-or-replace can't alter it).

drop function if exists public.get_public_profile_stats(uuid);

create function public.get_public_profile_stats(target uuid)
returns table (
  evenings int,
  cities int,
  photos int,
  moods jsonb,
  published int,
  own_plans int,
  streak_days int,
  connections int,
  ratings int,
  top_plans int
)
language sql
security definer
set search_path = public
stable
as $$
  with a as (
    select mood, city, photo_count from public.albums where owner_id = target
  ),
  m as (
    select mood, count(*)::int as c from a where mood is not null group by mood
  ),
  p as (
    select is_custom, coalesce(star_count, 0) as star_count from public.published_plans where author_id = target
  )
  select
    (select count(*)::int from a),
    (select count(distinct city)::int from a where city is not null),
    (select coalesce(sum(photo_count), 0)::int from a),
    (select coalesce(jsonb_object_agg(mood, c), '{}'::jsonb) from m),
    (select count(*)::int from p),
    (select count(*)::int from p where is_custom),
    (select coalesce((select streak_days from public.profiles where id = target), 0)::int),
    (select count(*)::int from public.connections
       where status = 'accepted' and (requester_id = target or addressee_id = target)),
    (select coalesce(sum(star_count), 0)::int from p),
    (select count(*)::int from p where star_count >= 10);  -- TOP_PLAN_STARS
$$;

grant execute on function public.get_public_profile_stats(uuid) to authenticated, anon;
