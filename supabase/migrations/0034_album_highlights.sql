-- 0034: profile highlights — evenings the owner explicitly chose to show on their public profile.
--
-- Doc grounding (27_SOCIAL_VISION "Friend Profiles" → "Recent Albums (if shared)"; Memory Album
-- Spec → "Private by default", "Photos never shared automatically", "Location precision reduced
-- when shared publicly", "Privacy controls for every section"):
--   * Albums stay owner-only. Highlighting ONE album is the explicit act of sharing it — nothing
--     is ever published automatically, and removing the highlight makes it private again at once.
--   * The public read exposes the album's title/city/mood/date and its photos, but NEVER the
--     timeline, addresses or coordinates — that's the "reduced location precision" rule. City only.

create table if not exists public.album_highlights (
  album_id uuid primary key references public.albums(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists album_highlights_owner_idx on public.album_highlights(owner_id, sort_order);

alter table public.album_highlights enable row level security;

-- Anyone may see WHICH albums someone highlighted (that's the point of a public profile).
drop policy if exists "album_highlights_read" on public.album_highlights;
create policy "album_highlights_read" on public.album_highlights for select using (true);

-- Only the owner decides what is highlighted.
drop policy if exists "album_highlights_insert_own" on public.album_highlights;
create policy "album_highlights_insert_own" on public.album_highlights for insert
  with check (owner_id = auth.uid() and exists (
    select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid()
  ));

drop policy if exists "album_highlights_update_own" on public.album_highlights;
create policy "album_highlights_update_own" on public.album_highlights for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "album_highlights_delete_own" on public.album_highlights;
create policy "album_highlights_delete_own" on public.album_highlights for delete
  using (owner_id = auth.uid());

-- Photos of a highlighted album become readable by others — and ONLY those. The bucket stays
-- private (0002); this is a second, narrow SELECT policy on top of the owner-only one.
-- Path convention: {user_id}/{album_id}/{file}. The regex guards the ::uuid cast against odd paths.
drop policy if exists "photos_highlighted_select" on storage.objects;
create policy "photos_highlighted_select" on storage.objects for select
  using (
    bucket_id = 'photos'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
    and exists (
      select 1 from public.album_highlights h
      where h.album_id = ((storage.foldername(name))[2])::uuid
    )
  );

-- Someone's highlighted evenings, for their public profile. Deliberately NO timeline/address/
-- coordinates — city is as precise as a shared evening ever gets.
create or replace function public.get_profile_highlights(target uuid)
returns table (
  album_id uuid,
  title text,
  city text,
  taken_at timestamptz,
  mood text,
  cover_color text,
  sort_order int,
  photos text[]
)
language sql
security definer
set search_path = public
stable
as $$
  select
    a.id,
    a.title,
    a.city,
    a.date,
    a.mood,
    a.cover_color,
    h.sort_order,
    coalesce(
      (select array_agg(p.storage_path order by p.sort_order, p.created_at)
         from public.album_photos p where p.album_id = a.id),
      '{}'::text[]
    )
  from public.album_highlights h
  join public.albums a on a.id = h.album_id
  where h.owner_id = target
  order by h.sort_order, a.date desc;
$$;

grant execute on function public.get_profile_highlights(uuid) to authenticated, anon;
