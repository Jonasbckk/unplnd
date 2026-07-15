-- 0035: a highlight gets its own name and cover.
--
-- Until now a highlight borrowed the album's title and used the album's first photo as the cover.
-- Both are now optional overrides — empty falls back to the album, so nothing breaks for existing
-- highlights.
--
-- The cover file is uploaded to the album's own folder ({user_id}/{album_id}/cover-*.jpg), so the
-- narrow storage policy from 0034 already covers it: readable by others exactly while the album is
-- highlighted, private again the moment it isn't. No new storage rule needed.

alter table public.album_highlights
  add column if not exists title text,
  add column if not exists cover_path text;

-- Return signature changes → must drop before recreating.
drop function if exists public.get_profile_highlights(uuid);

create function public.get_profile_highlights(target uuid)
returns table (
  album_id uuid,
  title text,
  city text,
  taken_at timestamptz,
  mood text,
  cover_color text,
  cover_path text,
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
    coalesce(nullif(btrim(h.title), ''), a.title),  -- own name, else the album's
    a.city,
    a.date,
    a.mood,
    a.cover_color,
    h.cover_path,
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
