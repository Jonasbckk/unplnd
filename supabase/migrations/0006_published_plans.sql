-- UNPLND — publish plans to an in-app community feed (Feature D).
-- Founder decisions (2026-07-04): show the author's name + profile; publishing is opt-in and
-- requires the user's OWN photos; plans collect "stars" (likes) from other users (shown, and a
-- tie-breaker AFTER proximity); NO followers / no user-level metrics; report/block for moderation.
-- IDEMPOTENT — safe to re-run (each policy is dropped before it is recreated).
-- Run in the Supabase SQL Editor.

-- ---------- published_plans ----------
-- Author name/avatar are DENORMALIZED here (copied at publish time) so the feed never needs to
-- read another user's private profiles row (profiles RLS is select-own).
create table if not exists public.published_plans (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  source_album_id uuid unique references public.albums(id) on delete set null,  -- one publish per album
  author_name text,
  author_avatar text,
  title text not null,
  summary text,
  city text,
  lat double precision,
  lng double precision,
  route jsonb not null default '[]',        -- the plan stops (venues)
  photos text[] not null default '{}',      -- public URLs from the published-photos bucket
  self_rating smallint,                     -- the author's own rating (Feature C)
  star_count int not null default 0,        -- community likes (denormalized, kept by trigger)
  hidden boolean not null default false,    -- moderation: hide without deleting
  created_at timestamptz not null default now()
);
alter table public.published_plans enable row level security;
-- Any signed-in user can read published (non-hidden) plans; authors always see their own.
drop policy if exists "published_plans_read" on public.published_plans;
create policy "published_plans_read" on public.published_plans for select
  using (not hidden or author_id = auth.uid());
drop policy if exists "published_plans_insert_own" on public.published_plans;
create policy "published_plans_insert_own" on public.published_plans for insert
  with check (author_id = auth.uid());
drop policy if exists "published_plans_update_own" on public.published_plans;
create policy "published_plans_update_own" on public.published_plans for update
  using (author_id = auth.uid()) with check (author_id = auth.uid());
drop policy if exists "published_plans_delete_own" on public.published_plans;
create policy "published_plans_delete_own" on public.published_plans for delete
  using (author_id = auth.uid());
create index if not exists published_plans_city_created_idx
  on public.published_plans(city, created_at desc);

-- ---------- plan_stars (likes) ----------
create table if not exists public.plan_stars (
  id uuid primary key default gen_random_uuid(),
  published_plan_id uuid not null references public.published_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (published_plan_id, user_id)       -- one star per user per plan
);
alter table public.plan_stars enable row level security;
drop policy if exists "plan_stars_read" on public.plan_stars;
create policy "plan_stars_read" on public.plan_stars for select using (true);
drop policy if exists "plan_stars_insert_own" on public.plan_stars;
create policy "plan_stars_insert_own" on public.plan_stars for insert with check (user_id = auth.uid());
drop policy if exists "plan_stars_delete_own" on public.plan_stars;
create policy "plan_stars_delete_own" on public.plan_stars for delete using (user_id = auth.uid());

-- Keep published_plans.star_count in sync with plan_stars.
create or replace function public.sync_star_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update public.published_plans set star_count = star_count + 1 where id = new.published_plan_id;
  elsif (tg_op = 'DELETE') then
    update public.published_plans set star_count = greatest(0, star_count - 1) where id = old.published_plan_id;
  end if;
  return null;
end; $$;
drop trigger if exists plan_stars_sync on public.plan_stars;
create trigger plan_stars_sync after insert or delete on public.plan_stars
  for each row execute function public.sync_star_count();

-- ---------- plan_reports (moderation) ----------
create table if not exists public.plan_reports (
  id uuid primary key default gen_random_uuid(),
  published_plan_id uuid not null references public.published_plans(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.plan_reports enable row level security;
drop policy if exists "plan_reports_insert_own" on public.plan_reports;
create policy "plan_reports_insert_own" on public.plan_reports for insert
  with check (reporter_id = auth.uid());

-- ---------- published-photos storage bucket (PUBLIC) ----------
-- Only photos a user explicitly publishes land here; the private `photos` album bucket is untouched.
insert into storage.buckets (id, name, public)
values ('published-photos', 'published-photos', true)
on conflict (id) do nothing;

drop policy if exists "published_photos_public_read" on storage.objects;
create policy "published_photos_public_read" on storage.objects for select
  using (bucket_id = 'published-photos');
drop policy if exists "published_photos_insert_own" on storage.objects;
create policy "published_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'published-photos' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "published_photos_delete_own" on storage.objects;
create policy "published_photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'published-photos' and (storage.foldername(name))[1] = auth.uid()::text);
