-- UNPLND — moderation: block a user so you never see their published plans again.
-- (Reporting uses the existing plan_reports table from 0006.) App-Store requirement for UGC.
-- Run once in the Supabase SQL Editor.

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (blocker_id, blocked_id)
);
alter table public.blocked_users enable row level security;
create policy "blocked_users_all_own" on public.blocked_users for all
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());
