-- Early-access waitlist, written by the marketing website (website/).
-- Anon may ONLY insert: the list is write-only from the public internet;
-- reading requires the service role (dashboard / future admin tooling).

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  source text not null default 'website',
  created_at timestamptz not null default now()
);

-- one signup per address, case-insensitive
create unique index if not exists waitlist_email_key on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

drop policy if exists waitlist_anon_insert on public.waitlist;
create policy waitlist_anon_insert
  on public.waitlist
  for insert
  to anon
  with check (source = 'website');

-- belt & braces: anon gets insert only, nothing else
revoke all on public.waitlist from anon;
grant insert (name, email, source) on public.waitlist to anon;
