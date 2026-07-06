-- Make ops_metrics callable without a login so the CRM sync is a one-click, no-credentials tool.
-- Returns ONLY aggregate counts (no user data / no PII). Trade-off: readable by anyone holding
-- the app's public anon key. Acceptable for coarse growth numbers; revert to a founder gate later
-- if these should be private.

create or replace function public.ops_metrics()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return jsonb_build_object(
    'waitlist', (select count(*) from public.waitlist),
    'users', (select count(*) from public.profiles),
    'premium', (select count(*) from public.profiles where premium = true),
    'published_plans', (select count(*) from public.published_plans),
    'evenings', (select count(*) from public.albums),
    'connections', (select count(*) from public.connections where status = 'accepted'),
    'generated_at', now()
  );
end; $$;

grant execute on function public.ops_metrics() to anon, authenticated;
