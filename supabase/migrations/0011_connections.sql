-- UNPLND — social connections (Phase 1): mutual connect between users, to plan real evenings
-- together. Request → accept (no messaging without a match). Plus the founder CEO badge.
-- IDEMPOTENT — safe to re-run. Run once in the Supabase SQL Editor.

-- ---------- connections ----------
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  constraint connections_no_self check (requester_id <> addressee_id),
  unique (requester_id, addressee_id)
);
alter table public.connections enable row level security;

-- You can see connection rows where you are either side.
drop policy if exists "connections_read" on public.connections;
create policy "connections_read" on public.connections for select
  using (requester_id = auth.uid() or addressee_id = auth.uid());
-- You can only create a request as yourself.
drop policy if exists "connections_insert_own" on public.connections;
create policy "connections_insert_own" on public.connections for insert
  with check (requester_id = auth.uid());
-- Only the addressee can accept (flip to accepted).
drop policy if exists "connections_update_addressee" on public.connections;
create policy "connections_update_addressee" on public.connections for update
  using (addressee_id = auth.uid()) with check (addressee_id = auth.uid());
-- Either side can remove (decline a request, or disconnect later).
drop policy if exists "connections_delete_either" on public.connections;
create policy "connections_delete_either" on public.connections for delete
  using (requester_id = auth.uid() or addressee_id = auth.uid());

create index if not exists connections_addressee_idx on public.connections(addressee_id, status);
create index if not exists connections_requester_idx on public.connections(requester_id, status);

-- ---------- founder badge ----------
alter table public.profiles add column if not exists is_founder boolean not null default false;

-- Expose is_founder via the safe public read (still nothing sensitive).
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
  member_since timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select id, display_name, photo_url, bio, profile_style, home_city, pinned_places, is_founder, created_at
  from public.profiles
  where id = target;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated, anon;
