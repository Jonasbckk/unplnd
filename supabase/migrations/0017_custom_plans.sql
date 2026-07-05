-- UNPLND — mark community plans a user authored from scratch ("eigene Pläne"), so the feed can
-- badge them apart from evenings published out of a lived album. Deriving this from a null
-- source_album_id is unreliable (that also happens when an album-based plan's album is deleted),
-- so we store it explicitly.
-- IDEMPOTENT — safe to re-run. Run in the Supabase SQL Editor.

alter table public.published_plans
  add column if not exists is_custom boolean not null default false;
