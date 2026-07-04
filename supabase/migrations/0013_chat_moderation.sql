-- UNPLND — chat moderation: report a message, and make blocking apply to DMs.
-- App-Store requirement for direct messages. IDEMPOTENT — safe to re-run.

-- Report an individual message.
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.message_reports enable row level security;
drop policy if exists "message_reports_insert_own" on public.message_reports;
create policy "message_reports_insert_own" on public.message_reports for insert
  with check (reporter_id = auth.uid());

-- Refuse to (re)open a 1:1 DM when either side has blocked the other.
create or replace function public.get_or_create_dm(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  conv uuid;
begin
  if me is null or other is null or me = other then
    raise exception 'invalid participants';
  end if;
  if not exists (
    select 1 from public.connections
    where status = 'accepted'
      and ((requester_id = me and addressee_id = other) or (requester_id = other and addressee_id = me))
  ) then
    raise exception 'not connected';
  end if;
  if exists (
    select 1 from public.blocked_users
    where (blocker_id = me and blocked_id = other) or (blocker_id = other and blocked_id = me)
  ) then
    raise exception 'blocked';
  end if;
  select c.id into conv
  from public.conversations c
  where c.is_group = false
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = me)
    and exists (select 1 from public.conversation_participants p where p.conversation_id = c.id and p.user_id = other)
    and (select count(*) from public.conversation_participants p where p.conversation_id = c.id) = 2
  limit 1;
  if conv is not null then
    return conv;
  end if;
  insert into public.conversations (is_group, created_by) values (false, me) returning id into conv;
  insert into public.conversation_participants (conversation_id, user_id) values (conv, me), (conv, other);
  return conv;
end; $$;
grant execute on function public.get_or_create_dm(uuid) to authenticated;
