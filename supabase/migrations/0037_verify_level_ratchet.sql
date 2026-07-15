-- 0037: verification tiers are earned FOREVER.
--
-- Tiers were computed live from current metrics everywhere — but tier 1 requires a 2-day streak,
-- so a broken streak (founder: a holiday) silently took an earned badge away. Once earned, a tier
-- must never be lost.
--
-- profiles.verify_level stores the highest tier ever reached. A trigger enforces the ratchet
-- server-side: updates can only ever raise it (clamped 0..5), never lower it — so no client bug
-- (or clever client) can take a badge away again.

alter table public.profiles
  add column if not exists verify_level int not null default 0;

create or replace function public.ratchet_verify_level()
returns trigger
language plpgsql
as $$
begin
  new.verify_level := greatest(coalesce(old.verify_level, 0), least(greatest(coalesce(new.verify_level, 0), 0), 5));
  return new;
end;
$$;

drop trigger if exists trg_ratchet_verify_level on public.profiles;
create trigger trg_ratchet_verify_level
before update of verify_level on public.profiles
for each row
execute function public.ratchet_verify_level();

-- Expose the earned level on public profiles too (their badge must not flicker with their streak
-- either). Return-signature change → drop + recreate.
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
  top_plans int,
  verify_level int
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
    (select count(*)::int from p where star_count >= 10),  -- TOP_PLAN_STARS
    (select coalesce((select verify_level from public.profiles where id = target), 0)::int);
$$;

grant execute on function public.get_public_profile_stats(uuid) to authenticated, anon;
