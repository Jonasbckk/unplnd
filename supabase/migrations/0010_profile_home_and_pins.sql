-- UNPLND — more profile personalization: home city + publicly pinned favorite places.
-- Extends get_public_profile with the new safe fields. Self-contained: also (re)adds the
-- 0009 columns with "if not exists", so running this alone is enough.
-- IDEMPOTENT — safe to re-run. Run once in the Supabase SQL Editor.

alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists profile_style text;
alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists pinned_places text[] not null default '{}';

-- Redefine the safe public read to include home_city + pinned_places (still nothing sensitive).
drop function if exists public.get_public_profile(uuid);
create function public.get_public_profile(target uuid)
returns table (
  id uuid,
  display_name text,
  photo_url text,
  bio text,
  profile_style text,
  home_city text,
  pinned_places text[],
  member_since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, display_name, photo_url, bio, profile_style, home_city, pinned_places, created_at
  from public.profiles
  where id = target;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated, anon;
