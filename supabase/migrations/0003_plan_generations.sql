-- UNPLND — daily plan-generation limit (free tier: 5/day; premium is unlimited).
-- The generate-plan Edge Function (service role) records every successful plan here and
-- counts today's rows before generating. Users may READ their own count (for a future
-- "3/5 used" hint) but can NEVER insert — so the limit can't be faked from the client.
-- Run once in the Supabase SQL Editor (or via the migration runner).

create table if not exists public.plan_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.plan_generations enable row level security;

-- Read-only for the owner. No insert/update/delete policy on purpose: only the service
-- role (the Edge Function) writes, and the service role bypasses RLS.
create policy "plan_generations_select_own" on public.plan_generations for select
  using (user_id = auth.uid());

create index if not exists plan_generations_user_created_idx
  on public.plan_generations(user_id, created_at desc);
