-- UNPLND — initial schema (Expo + Supabase).
-- Adapted from docs 29_DATABASE_SCHEMA + 31_SECURITY: every table has an owner and Row Level Security.
-- Run this once in the Supabase SQL Editor (or via the migration runner).

-- ---------- helper: keep updated_at fresh ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------- profiles (mirrors auth.users) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  photo_url text,
  premium boolean not null default false,
  language text not null default 'en',
  theme text not null default 'system',
  favorite_moods text[] not null default '{}',
  favorite_categories text[] not null default '{}',
  settings jsonb not null default '{}',
  stats jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (id = auth.uid());
create policy "profiles_insert_own" on public.profiles for insert with check (id = auth.uid());
create policy "profiles_update_own" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- plans ----------
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'draft',
  mood text,
  budget text,
  transport text,
  group_size text,
  available_time text,
  summary text,
  estimated_cost text,
  experience_score int,
  route jsonb not null default '[]',
  weather jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.plans enable row level security;
create policy "plans_all_own" on public.plans for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists plans_owner_created_idx on public.plans(owner_id, created_at desc);

-- ---------- albums ----------
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  title text not null,
  city text,
  date timestamptz not null default now(),
  mood text,
  weather text,
  cover_color text,
  timeline jsonb not null default '[]',
  photo_count int not null default 0,
  favorite boolean not null default false,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.albums enable row level security;
create policy "albums_all_own" on public.albums for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create index if not exists albums_owner_created_idx on public.albums(owner_id, created_at desc);
create trigger albums_updated_at before update on public.albums
  for each row execute function public.set_updated_at();

-- ---------- album_photos ----------
create table if not exists public.album_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  storage_path text not null,
  caption text,
  taken_at timestamptz,
  coordinates jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.album_photos enable row level security;
create policy "album_photos_via_owner" on public.album_photos for all
  using (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid()))
  with check (exists (select 1 from public.albums a where a.id = album_id and a.owner_id = auth.uid()));

-- ---------- favorites (polymorphic join) ----------
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entity_type, entity_id)
);
alter table public.favorites enable row level security;
create policy "favorites_all_own" on public.favorites for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- notifications ----------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  type text,
  read boolean not null default false,
  deep_link text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "notifications_all_own" on public.notifications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- feedback ----------
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  type text,
  message text not null,
  app_version text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
alter table public.feedback enable row level security;
create policy "feedback_insert_own" on public.feedback for insert
  with check (user_id = auth.uid() or user_id is null);
create policy "feedback_select_own" on public.feedback for select using (user_id = auth.uid());

-- ---------- app_config (public read, single row) ----------
create table if not exists public.app_config (
  id int primary key default 1,
  minimum_version text,
  maintenance_mode boolean not null default false,
  feature_flags jsonb not null default '{}',
  seasonal_theme text,
  premium_config jsonb not null default '{}',
  constraint app_config_singleton check (id = 1)
);
alter table public.app_config enable row level security;
create policy "app_config_public_read" on public.app_config for select using (true);
insert into public.app_config (id) values (1) on conflict (id) do nothing;
