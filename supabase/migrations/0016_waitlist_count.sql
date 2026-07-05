-- Progress bar on the website's early-access section: expose ONLY the
-- number of waitlist signups (never rows) to anonymous visitors.
-- security definer bypasses the write-only RLS just for this count.

create or replace function public.waitlist_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int from public.waitlist;
$$;

revoke all on function public.waitlist_count() from public;
grant execute on function public.waitlist_count() to anon, authenticated;
