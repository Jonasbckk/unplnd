-- 0036: live location for connections (Memory Map phase 2).
--
-- Privacy model, per the Constitution ("Trust is sacred") and the Memory Album Spec's
-- "Location precision reduced when shared publicly":
--   * OPT-IN only — the app never writes a row unless the user flips the switch (default off).
--   * One row per user, overwritten on every update: there is NO movement history to leak.
--   * The client rounds coordinates to ~1 km BEFORE upload; the server never sees the exact spot.
--   * Readable ONLY by accepted connections (and yourself), and only while fresh (<60 min) —
--     stale rows are invisible, so closing the app quietly takes you off the map.
--   * Turning the switch off DELETES the row immediately.

create table if not exists public.live_locations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lat double precision not null,
  lng double precision not null,
  city text,
  updated_at timestamptz not null default now()
);

alter table public.live_locations enable row level security;

-- You manage only your own row.
drop policy if exists "live_locations_upsert_own" on public.live_locations;
create policy "live_locations_upsert_own" on public.live_locations for insert
  with check (user_id = auth.uid());

drop policy if exists "live_locations_update_own" on public.live_locations;
create policy "live_locations_update_own" on public.live_locations for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "live_locations_delete_own" on public.live_locations;
create policy "live_locations_delete_own" on public.live_locations for delete
  using (user_id = auth.uid());

-- Read: yourself, or an accepted connection.
drop policy if exists "live_locations_read" on public.live_locations;
create policy "live_locations_read" on public.live_locations for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = auth.uid() and c.addressee_id = user_id)
          or (c.addressee_id = auth.uid() and c.requester_id = user_id))
    )
  );

-- Fresh connection locations + display identity in one call (avoids N profile lookups).
create or replace function public.get_live_connections()
returns table (user_id uuid, lat double precision, lng double precision, city text, updated_at timestamptz, display_name text, photo_url text)
language sql
security definer
set search_path = public
stable
as $$
  select l.user_id, l.lat, l.lng, l.city, l.updated_at, p.display_name, p.photo_url
  from public.live_locations l
  join public.profiles p on p.id = l.user_id
  where l.updated_at > now() - interval '60 minutes'
    and l.user_id <> auth.uid()
    and exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and ((c.requester_id = auth.uid() and c.addressee_id = l.user_id)
          or (c.addressee_id = auth.uid() and c.requester_id = l.user_id))
    );
$$;

grant execute on function public.get_live_connections() to authenticated;
