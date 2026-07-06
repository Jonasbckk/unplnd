-- Ops metrics for the founder CRM/dashboard. Founder-gated aggregate counts, read via the
-- anon client after signing in as a founder (no service_role needed).

create or replace function public.ops_metrics()
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and is_founder = true) then
    raise exception 'founders only';
  end if;
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
grant execute on function public.ops_metrics() to authenticated;
