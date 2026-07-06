-- Group admin: history control on invite, member timeouts, creator-only actions, join notices.
-- The RLS changes use coalesce() defaults, so behaviour is UNCHANGED for every existing member
-- (null hide_history_before = full history, null muted_until = never muted). Safe to run live.

alter table public.conversation_participants add column if not exists hide_history_before timestamptz;
alter table public.conversation_participants add column if not exists muted_until timestamptz;
alter table public.messages add column if not exists kind text; -- null = normal, 'join' = system join notice

-- Read: respect a member's hidden-history cutoff (set only when invited "new messages only").
drop policy if exists "messages_read" on public.messages;
create policy "messages_read" on public.messages for select
  using (
    public.is_conversation_participant(conversation_id, auth.uid())
    and created_at >= coalesce(
      (select p.hide_history_before from public.conversation_participants p
        where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()),
      '-infinity'::timestamptz)
  );

-- Insert: block writing while timed out.
drop policy if exists "messages_insert" on public.messages;
create policy "messages_insert" on public.messages for insert
  with check (
    sender_id = auth.uid()
    and public.is_conversation_participant(conversation_id, auth.uid())
    and coalesce(
      (select p.muted_until from public.conversation_participants p
        where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()),
      '-infinity'::timestamptz) <= now()
  );

-- Creator check.
create or replace function public.is_group_creator(conv uuid, uid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.conversations where id = conv and created_by = uid and is_group = true);
$$;

create or replace function public.rename_group(conv uuid, title_in text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_creator(conv, auth.uid()) then raise exception 'not the group creator'; end if;
  update public.conversations set title = coalesce(nullif(trim(title_in), ''), title) where id = conv;
end; $$;
grant execute on function public.rename_group(uuid, text) to authenticated;

create or replace function public.remove_participant(conv uuid, target uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_creator(conv, auth.uid()) then raise exception 'not the group creator'; end if;
  if target = auth.uid() then raise exception 'creator cannot remove self'; end if;
  delete from public.conversation_participants where conversation_id = conv and user_id = target;
end; $$;
grant execute on function public.remove_participant(uuid, uuid) to authenticated;

create or replace function public.set_participant_timeout(conv uuid, target uuid, minutes int)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_group_creator(conv, auth.uid()) then raise exception 'not the group creator'; end if;
  update public.conversation_participants
    set muted_until = case when minutes <= 0 then null else now() + make_interval(mins => minutes) end
    where conversation_id = conv and user_id = target;
end; $$;
grant execute on function public.set_participant_timeout(uuid, uuid, int) to authenticated;

create or replace function public.add_group_members(conv uuid, member_ids uuid[], hide_history boolean)
returns void language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  m uuid;
  cutoff timestamptz := case when hide_history then now() else null end;
  nm text;
begin
  if not public.is_group_creator(conv, me) then raise exception 'not the group creator'; end if;
  foreach m in array coalesce(member_ids, '{}') loop
    if m <> me
      and exists (
        select 1 from public.connections where status = 'accepted'
          and ((requester_id = me and addressee_id = m) or (requester_id = m and addressee_id = me))
      )
      and not exists (
        select 1 from public.conversation_participants where conversation_id = conv and user_id = m
      )
    then
      insert into public.conversation_participants (conversation_id, user_id, hide_history_before)
      values (conv, m, cutoff);
      select display_name into nm from public.profiles where id = m;
      insert into public.messages (conversation_id, sender_id, kind, body)
      values (conv, me, 'join', coalesce(nm, 'Jemand'));
    end if;
  end loop;
end; $$;
grant execute on function public.add_group_members(uuid, uuid[], boolean) to authenticated;
