-- Explicit voting mode for a conversation — a friend group only crowns a favourite
-- when someone actually starts a vote, never automatically.

alter table public.conversations
  add column if not exists voting_active boolean not null default false;

-- Any participant can start/stop the vote; SECURITY DEFINER so it can flip the flag
-- without opening conversations to arbitrary participant updates.
create or replace function public.set_conversation_voting(conv uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_conversation_participant(conv, auth.uid()) then
    raise exception 'not a participant';
  end if;
  update public.conversations set voting_active = active where id = conv;
end;
$$;

grant execute on function public.set_conversation_voting(uuid, boolean) to authenticated;

-- Realtime so the vote toggle syncs live for everyone in the chat (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations'
  ) then
    alter publication supabase_realtime add table public.conversations;
  end if;
end $$;
