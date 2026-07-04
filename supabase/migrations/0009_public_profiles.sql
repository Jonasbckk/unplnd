-- UNPLND — public author profiles + more profile personalization.
-- Lets other users open the profile of whoever published a plan, and adds a bio.
-- profiles stays select-own (private); ONLY these safe fields are exposed, via a
-- security-definer function that returns nothing else (never premium/settings/email).
-- IDEMPOTENT — safe to re-run. Run once in the Supabase SQL Editor.

-- New personalization fields.
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists profile_style text;

-- Safe public read: name, avatar, bio, chosen style, member-since — and nothing more.
drop function if exists public.get_public_profile(uuid);
create function public.get_public_profile(target uuid)
returns table (
  id uuid,
  display_name text,
  photo_url text,
  bio text,
  profile_style text,
  member_since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, display_name, photo_url, bio, profile_style, created_at
  from public.profiles
  where id = target;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated, anon;
