-- UNPLND — richer profiles: interests + prompt answers (a fuller "who I am").
-- Extends get_public_profile with the new safe fields. IDEMPOTENT — safe to re-run.

alter table public.profiles add column if not exists interests text[] not null default '{}';
alter table public.profiles add column if not exists prompts jsonb not null default '{}';

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
  is_founder boolean,
  interests text[],
  prompts jsonb,
  member_since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, display_name, photo_url, bio, profile_style, home_city, pinned_places,
         is_founder, interests, prompts, created_at
  from public.profiles
  where id = target;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated, anon;
