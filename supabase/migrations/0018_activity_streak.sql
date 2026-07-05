-- UNPLND — daily-use streak, powering the verification ladder ("X Tage am Stück genutzt").
-- Adds streak columns to profiles + a SECURITY DEFINER RPC the app calls on launch. Doing the
-- date maths server-side (current_date) keeps it atomic and immune to client clock drift.
-- IDEMPOTENT — safe to re-run. Run in the Supabase SQL Editor.

alter table public.profiles
  add column if not exists last_active_date date,
  add column if not exists streak_days int not null default 0,
  add column if not exists best_streak int not null default 0;

create or replace function public.record_activity()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  last_seen date;
  cur int;
begin
  if uid is null then
    return;
  end if;

  select last_active_date, streak_days into last_seen, cur
  from public.profiles where id = uid;

  if last_seen = current_date then
    return;                              -- already counted today
  elsif last_seen = current_date - 1 then
    cur := coalesce(cur, 0) + 1;         -- consecutive day
  else
    cur := 1;                            -- first day or streak broken
  end if;

  update public.profiles
  set last_active_date = current_date,
      streak_days = cur,
      best_streak = greatest(coalesce(best_streak, 0), cur)
  where id = uid;
end;
$$;

grant execute on function public.record_activity() to authenticated;
