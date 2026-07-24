-- UNPLND 0040 — the Creator programme (42_ROADMAP_V2: "Creator Partnerships — Selected local
-- creators curate experiences. No influencer feed. Quality first.")
--
-- Shape: anyone may APPLY (one short pitch), founders review in-app, approval sets a
-- profiles.is_creator flag that renders as a badge everywhere the CEO ribbon does.
-- Deliberately the is_founder pattern (boolean + public-profile RPC), not a new role system.
-- IDEMPOTENT — safe to re-run.

alter table public.profiles add column if not exists is_creator boolean not null default false;

-- is_creator is an entitlement like premium/is_founder — extend the 0039 guard so a client
-- can't just update({ is_creator: true }) itself. Our review RPC below runs as definer
-- (current_user = postgres) and passes through.
-- Invoker semantics, same as 0039 — definer would pin current_user to 'postgres'
-- and turn the guard into a no-op.
create or replace function public.protect_entitlement_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'UPDATE' then
      new.premium := old.premium;
      new.is_founder := old.is_founder;
      new.is_creator := old.is_creator;
    else
      new.premium := false;
      new.is_founder := false;
      new.is_creator := false;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_entitlements on public.profiles;
create trigger trg_protect_entitlements
  before update of premium, is_founder, is_creator on public.profiles
  for each row
  execute function public.protect_entitlement_columns();

-- ---------------------------------------------------------------------------
-- Applications: one per user, resubmittable after a decline.
-- ---------------------------------------------------------------------------
create table if not exists public.creator_applications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 20 and 600),
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.creator_applications enable row level security;

drop policy if exists creator_apps_select_own on public.creator_applications;
create policy creator_apps_select_own on public.creator_applications
  for select using (user_id = auth.uid());

drop policy if exists creator_apps_insert_own on public.creator_applications;
create policy creator_apps_insert_own on public.creator_applications
  for insert with check (user_id = auth.uid());

-- Re-apply after a decline: the user may rewrite their pitch, which resets it to pending.
drop policy if exists creator_apps_update_own on public.creator_applications;
create policy creator_apps_update_own on public.creator_applications
  for update using (user_id = auth.uid() and status = 'declined')
  with check (user_id = auth.uid() and status = 'pending' and reviewed_at is null);

-- ---------------------------------------------------------------------------
-- Founder review — SECURITY DEFINER RPCs, gated on is_founder (0028 pattern).
-- ---------------------------------------------------------------------------
create or replace function public.get_creator_applications()
returns table (user_id uuid, display_name text, photo_url text, message text, created_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select a.user_id, p.display_name, p.photo_url, a.message, a.created_at
  from public.creator_applications a
  join public.profiles p on p.id = a.user_id
  where a.status = 'pending'
    and exists (select 1 from public.profiles f where f.id = auth.uid() and f.is_founder)
  order by a.created_at asc;
$$;

grant execute on function public.get_creator_applications() to authenticated;

create or replace function public.review_creator_application(applicant uuid, approve boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles f where f.id = auth.uid() and f.is_founder) then
    return false;
  end if;

  update public.creator_applications
  set status = case when approve then 'approved' else 'declined' end,
      reviewed_at = now()
  where user_id = applicant and status = 'pending';
  if not found then
    return false;
  end if;

  -- The flag write runs as definer (postgres), so the 0039 entitlement guard lets it through.
  update public.profiles set is_creator = approve where id = applicant;
  return true;
end;
$$;

grant execute on function public.review_creator_application(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Show the badge wherever profiles are read: get_public_profile + search_users.
-- ---------------------------------------------------------------------------
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
  is_creator boolean,
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
         is_founder, is_creator, interests, prompts, created_at
  from public.profiles
  where id = target;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated, anon;

drop function if exists public.search_users(text);
create function public.search_users(q text)
returns table (id uuid, display_name text, photo_url text, is_founder boolean, is_creator boolean)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.photo_url, p.is_founder, p.is_creator
  from public.profiles p
  where p.id <> auth.uid()
    and p.display_name is not null
    and length(btrim(q)) >= 2
    and p.display_name ilike '%' || btrim(q) || '%'
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.id)
         or (b.blocker_id = p.id and b.blocked_id = auth.uid())
    )
  order by (lower(p.display_name) = lower(btrim(q))) desc, p.display_name
  limit 20;
$$;

grant execute on function public.search_users(text) to authenticated;
