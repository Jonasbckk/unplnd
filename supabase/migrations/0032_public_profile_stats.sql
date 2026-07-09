-- 0032: aggregate stats for a user's PUBLIC profile (Evening DNA + Badges of other people).
--
-- Albums are private (RLS: owner-only). To show someone else's Evening DNA + badge progress on
-- their public profile we expose ONLY non-identifying AGGREGATES (counts + mood distribution),
-- never the album content itself. SECURITY DEFINER so it can read across users; anyone signed in
-- (or anon) may call it, same as get_public_profile.

create or replace function public.get_public_profile_stats(target uuid)
returns table (evenings int, cities int, photos int, moods jsonb)
language sql
security definer
set search_path = public
stable
as $$
  with a as (
    select mood, city, photo_count from public.albums where user_id = target
  ),
  m as (
    select mood, count(*)::int as c from a where mood is not null group by mood
  )
  select
    (select count(*)::int from a),
    (select count(distinct city)::int from a where city is not null),
    (select coalesce(sum(photo_count), 0)::int from a),
    (select coalesce(jsonb_object_agg(mood, c), '{}'::jsonb) from m);
$$;

grant execute on function public.get_public_profile_stats(uuid) to authenticated, anon;
