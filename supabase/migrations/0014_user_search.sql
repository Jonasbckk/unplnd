-- UNPLND — find people by name to connect (no published plan required).
-- Safe search: returns only public fields, never self or blocked users.
-- IDEMPOTENT — safe to re-run. Run once in the Supabase SQL Editor.

create or replace function public.search_users(q text)
returns table (id uuid, display_name text, photo_url text, is_founder boolean)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.display_name, p.photo_url, p.is_founder
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
