-- UNPLND — ratings: rate the whole evening (plan) + each place you actually went to.
-- Run once in the Supabase SQL Editor (or via the migration runner).

-- Overall plan rating (1–5), on the plans row the app already creates when an evening starts.
alter table public.plans add column if not exists user_rating smallint;

-- Per-place ratings — a place the user rated after visiting. Reusable (future: "my places", community).
create table if not exists public.place_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  place_id text not null,
  place_name text,
  rating smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, place_id)
);
alter table public.place_ratings enable row level security;
create policy "place_ratings_all_own" on public.place_ratings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger place_ratings_updated_at before update on public.place_ratings
  for each row execute function public.set_updated_at();
